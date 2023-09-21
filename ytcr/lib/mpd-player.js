'use strict';

const EventEmitter = require('events');
const Player = require('yt-cast-receiver').Player;
const ytdl = require('ytdl-core');
const mpdapi = require('mpd-api');
const fetch = require('node-fetch');

const MPD_TO_PLAYER_STATUSES = {
    'play': Player.STATUS_PLAYING,
    'pause': Player.STATUS_PAUSED,
    'stop': Player.STATUS_STOPPED
};

const ERROR_TRACK_LOAD_FAILED = 101;
const ERROR_TRACK_UNPLAYABLE = 102;

class MPDPlayer extends Player {

    static async instance(options) {
        let player = new MPDPlayer();
        await player.init(options);
        return player;
    }

    async init(options = {}) {
        let mpdConfig = options.mpd;

        this.currentPlayData = null;
        this.mpdClient = await mpdapi.connect(mpdConfig);

        let externalMPDEventHandler = this.handleExternalMPDEvent.bind(this);
        this.mpdListener = new MPDEventListener(this.mpdClient, {
            logDebug: this.logDebug.bind(this)
        });
        this.mpdListener.on('player', externalMPDEventHandler);
        this.mpdListener.on('mixer', externalMPDEventHandler);

        this.eventEmitter = new EventEmitter();
        this.destroyed = false;
        this.setVolumeControl(options.volumeControl || null);
        if (options.autoRequestPlayNext != undefined) {
            this.setAutoRequestPlayNext(options.autoRequestPlayNext);
        }
        else {
            this.setAutoRequestPlayNext(true);
        }
        this.setDebug(options.debug);

        this.sleep();
        this.mpdListener.start();
    }

    async destroy() {
        this.destroyed = true;
        this.mpdListener.stop();
        await this.stop();
        await this.mpdClient.disconnect();
        this.eventEmitter.removeAllListeners();
        
        this.mpdListener = null;
        this.mpdClient = null;
        this.currentPlayData = null;
        this.pendingPlayData = null;
        this.eventEmitter = null;
        this.asleep = true;
        this.volumeControl = null;
    }

    setVolumeControl(delegate) {
        this.volumeControl = delegate;
    }

    setAutoRequestPlayNext(value) {
        this.autoRequestPlayNext = value ? true : false;
    }

    setDebug(value) {
        this.debug = value ? true : false;
    }

    logDebug(message) {
        this.debug && console.log(message);
    }

    resolveOnMPDStatusChanged(command, subsystem, resolveOn = {}) {
        let self = this;
        return new Promise( (resolve, reject) => {
            self.mpdListener.prependOnce(subsystem, async (event) => {
                let mpdStatus = await this.mpdClient.api.status.get();
                let _resolve = true;
                for (let [key, value] of Object.entries(resolveOn)) {
                    if (mpdStatus[key] == undefined || mpdStatus[key] !== value) {
                        _resolve = false;
                        break;
                    }
                }
                event.stopPropagation();
                if (_resolve) {
                    self.logDebug('[MPDPlayer] Resolve on MPD status changed');
                    resolve(mpdStatus);
                }
                else {
                    self.logDebug('[MPDPlayer] Unable to resolve on MPD status update - resolveOn data mismatch');
                    self.logDebug('[MPDPlayer] MPD status:');
                    self.logDebug(mpdStatus);
                    self.logDebug('[MPDPlayer] resolveOn data:')
                    self.logDebug(resolveOn);
                    reject('resolveOn data mismatch');
                }
            });

            command();
        });
    }

    async play(videoId, position = 0) {
        let self = this;

        if (self.isDestroyed()) {
            return;
        }
        self.eventEmitter.emit('command', 'play', { videoId, position });
      
        self.logDebug(`[MPDPlayer] Play ${videoId} at position ${position}s`);
        
        if (await self.getStatus() !== Player.STATUS_STOPPED) {
            await self.stop();
        }

        let playData;
        try {
            playData = await self.loadPlayData(videoId);
            self.logDebug(`[MPDPlayer] Loaded track for ${videoId}:`);
            self.logDebug(playData);
            if (!playData.playable) {
                self.logDebug(`[MPDPlayer] Track is unplayable: ${playData.unplayableReason}`);
                self.eventEmitter.emit('error', {
                    code: ERROR_TRACK_UNPLAYABLE,
                    message: playData.unplayableReason || '',
                    trackInfo: playData
                });
            }
        } catch (error) {
            self.logDebug(`[MPDPlayer] An error occurred while loading track:`);
            self.logDebug(error.message || error);
            if (error.stack) {
                self.logDebug(error.stack);
            }
            playData = null;
            self.eventEmitter.emit('error', {
                code: ERROR_TRACK_LOAD_FAILED,
                message: error.message || error,
                videoId
            });
        }
        await self.mpdClient.api.queue.clear();
        if (playData) {
            if (playData.playable) {
                let songId = await self.mpdClient.api.queue.addid(playData.streamUrl);
                playData.mpdSongId = songId;
                await self.mpdClient.api.queue.addtagid(songId, 'title', playData.title);
                await self.mpdClient.api.queue.addtagid(songId, 'album', playData.channelTitle);
                await self.mpdClient.api.queue.addtagid(songId, 'artist', 'YouTube Cast');
                await self.mpdClient.api.playback.consume(1);
                await self.mpdClient.api.playback.seekid(songId, position);

                self.wake();

                return self.resolveOnMPDStatusChanged(
                    self.mpdClient.api.playback.playid.bind(self, songId), 'player',
                    {
                        state: 'play',
                        songid: playData.mpdSongId
                    }
                )
                .then( async (mpdStatus) => {
                    self.currentPlayData = playData;
                    await self.notifyVolumeChanged();
                    await self.notifyPlayed();
                    return mpdStatus;
                })
                .then( mpdStatus => self.getState(mpdStatus) )
                .then( playerState => self.eventEmitter.emit('stateChanged', playerState, { triggeredBy: 'play' }) )
            }
            else {
                return self.requestPlayNext();
            }
        }
    }

    async pause() {
        let self = this;

        if (self.isDestroyed()) {
            return;
        }
        self.eventEmitter.emit('command', 'pause', {});

        self.logDebug(`[MPDPlayer] Pause`);

        if (await self.getStatus() === Player.STATUS_PLAYING) {
            return self.resolveOnMPDStatusChanged(
                self.mpdClient.api.playback.pause.bind(self), 'player',
                {
                    state: 'pause',
                    songid: self.currentPlayData.mpdSongId,
                }
            )
            .then( async (mpdStatus) => {
                await self.notifyPaused();
                return mpdStatus;
            })
            .then( mpdStatus => self.getState(mpdStatus) )
            .then( playerState => self.eventEmitter.emit('stateChanged', playerState, { triggeredBy: 'pause' }) );
        }
    }

    async resume() {
        let self = this;

        if (self.isDestroyed()) {
            return;
        }
        self.eventEmitter.emit('command', 'resume', {});

        self.logDebug(`[MPDPlayer] Pause`);

        return self.resolveOnMPDStatusChanged(
            self.mpdClient.api.playback.resume.bind(self), 'player',
            {
                state: 'play',
                songid: self.currentPlayData.mpdSongId
            }
        )
        .then( async (mpdStatus) => {
            await self.notifyPlayed();
            return mpdStatus;
        })
        .then( mpdStatus => self.getState(mpdStatus) )
        .then( playerState => self.eventEmitter.emit('stateChanged', playerState, { triggeredBy: 'resume' }) )
    }

    async stop() {
        let self = this;

        if (self.isDestroyed()) {
            return;
        }
        self.eventEmitter.emit('command', 'stop', {});

        self.logDebug(`[MPDPlayer] Stop`);

        let currentPlayerStatus = await self.getStatus();
        if (currentPlayerStatus !== Player.STATUS_STOPPED) {
            return self.resolveOnMPDStatusChanged(
                self.mpdClient.api.playback.stop.bind(self), 'player',
                {
                    state: 'stop',
                }
            )
            .then( async (mpdStatus) => {
                self.currentPlayData = null;
                await self.notifyStopped();
                return mpdStatus;
            })
            .then( mpdStatus => self.getState(mpdStatus) )
            .then( playerState => self.eventEmitter.emit('stateChanged', playerState, { triggeredBy: 'stop' }) );
        }
    }

    async seek(position) {
        if (this.isDestroyed()) {
            return;
        }

        // Seeking not supported for livestreams
        if (this.currentPlayData.isLive) {
            this.logDebug(`[MPDPlayer] Playing livestream - ignoring seek request...`);
            let mpdStatus = await this.mpdClient.api.status.get();
            await this.notifySeeked(MPD_TO_PLAYER_STATUSES[mpdStatus.state]);
            return;
        }
        
        this.eventEmitter.emit('command', 'seek', { position });

        this.logDebug(`[MPDPlayer] Seek to ${position}s`);
        let self = this;

        return self.resolveOnMPDStatusChanged(
            self.mpdClient.api.playback.seekcur.bind(self, position), 'player',
            {
                songid: self.currentPlayData.mpdSongId
            }
        )
        .then( async (mpdStatus) => {
            await self.notifySeeked(MPD_TO_PLAYER_STATUSES[mpdStatus.state]);
            return mpdStatus;
        })
        .then( mpdStatus => this.getState(mpdStatus) )
        .then( playerState => this.eventEmitter.emit('stateChanged', playerState, { triggeredBy: 'seek' }) );
    }

    on(eventName, listener) {
        if (this.isDestroyed()) {
            return;
        }
        this.eventEmitter.on(eventName, listener);
    }

    off(eventName, listener) {
        if (this.isDestroyed()) {
            return;
        }
        this.eventEmitter.off(eventName, listener);
    }

    async handleExternalMPDEvent(event) {
        if (this.isAsleep() || this.isDestroyed()) {
            return;
        }

        this.logDebug(`[MPDPlayer] Received external MPD event for subsystem ${event.subsystem}`);

        let mpdStatus = await this.mpdClient.api.status.get();

        if (!this.currentPlayData || (this.currentPlayData.mpdSongId !== mpdStatus.songid && mpdStatus.state !== 'stop')) {
            this.logDebug(`[MPDPlayer] Event does not correspond to current song. Putting player to sleep...`);
            this.currentPlayData = null;
            this.notifyStopped();
            this.sleep();
            return;
        }

        if (event.subsystem === 'mixer' && !this.volumeControl) {
            this.logDebug(`[MPDPlayer] MPD volume changed. Notifying change...`);
            await this.notifyVolumeChanged();
            await this.eventEmitter.emit('volumeChanged', mpdStatus.volume)
            return;
        }

        if (event.subsystem === 'player') {
            switch(mpdStatus.state) {
                case 'pause':
                    await this.notifyPaused();
                    break;
                case 'stop': 
                    await this.notifyStopped();
                    break;
                default:
                    await this.notifyPlayed();
            }

            let playerState = await this.getState(mpdStatus);
            if (mpdStatus.state === 'stop') {
                // In play(), we set consume on for mpd. If song is no longer in the queue, 
                // that means it has finished playing
                let songIdInfo;
                try {
                    songIdInfo = await this.mpdClient.api.queue.id(this.currentPlayData.mpdSongId);
                } catch (error) {
                    songIdInfo = null;
                }
                this.currentPlayData = null;
                let playbackFinished = false;
                if (!songIdInfo) {
                    this.logDebug(`[MPDPlayer] Current playback finished.`);
                    playbackFinished = true;
                }
                this.eventEmitter.emit('stateChanged', playerState, { triggeredBy: 'playbackFinished' });
                if (this.autoRequestPlayNext) {
                    await this.requestPlayNext();
                } 
            }
            else {
                this.eventEmitter.emit('stateChanged', playerState, { triggeredBy: 'external' });
            }
        }
    }

    async getState(mpdStatus) {
        if (this.isAsleep() || this.isDestroyed()) {
            return null;
        }

        if (mpdStatus == undefined) {
            mpdStatus = await this.mpdClient.api.status.get();
        }
        let state = {
            status: MPD_TO_PLAYER_STATUSES[mpdStatus.state],
            position: mpdStatus.elapsed || 0,
            duration: mpdStatus.time ? mpdStatus.time.total : 0,
            volume: this.volumeControl ? await this.volumeControl.getVolume() : mpdStatus.volume
        };

        let audio = mpdStatus.audio;
        if (audio) {
            if (audio.bits) {
                state.bitDepth = audio.bits === 'f' ? '32 bit' : Number(audio.bits) + ' bit';
            }
            if (audio.sample_rate_short) {
                state.sampleRate  = audio.sample_rate_short.value + ' ' + audio.sample_rate_short.unit;
            }
        }

        if (this.currentPlayData) {
            state.title = this.currentPlayData.title;
            state.channelTitle = this.currentPlayData.channelTitle;
            state.thumbnail = this.currentPlayData.thumbnail;
            if (this.currentPlayData.bitrate) {
                state.bitrate = this.currentPlayData.bitrate + ' Kbps';
            }
            if (this.currentPlayData.channels) {
                state.channels = this.currentPlayData.channels;
            }
            state.isPlayingLiveStream = this.currentPlayData.isLive;
        }

        return state;
    }

    async getVolume() {
        if (this.isAsleep() || this.isDestroyed()) {
            return 0;
        }

        if (this.volumeControl) {
            return this.volumeControl.getVolume();
        }
        else {
            let mpdStatus = await this.mpdClient.api.status.get();
            return mpdStatus.volume || 0;
        }
    }

    async setVolume(volume) {
        if (this.isAsleep() || this.isDestroyed()) {
            return;
        }
        this.eventEmitter.emit('command', 'setVolume', { volume });

        if (this.isAsleep() || this.isDestroyed()) {
            return;
        }

        this.logDebug(`[MPDPlayer] Set volume to ${volume}`);
        if (this.volumeControl) {
            return this.volumeControl.setVolume(volume);
        }
        else {
            let self = this;
            return self.resolveOnMPDStatusChanged(
                self.mpdClient.api.playback.setvol.bind(self, volume), 'mixer')
            .then( async (mpdStatus) => {
                await self.notifyVolumeChanged();
                return mpdStatus;
            })
            .then( mpdStatus => self.eventEmitter.emit('volumeChanged', mpdStatus.volume) );
        }
    }

    async getStatus() {
        if (this.isAsleep() || this.isDestroyed()) {
            this.logDebug('[MPDPlayer] is asleep - returning stopped status')
            return Player.STATUS_STOPPED;
        }
        let mpdStatus = await this.mpdClient.api.status.get();
        return MPD_TO_PLAYER_STATUSES[mpdStatus.state];
    }

    async getPosition() {
        if (this.isAsleep() || this.isDestroyed()) {
            return 0;
        }
        if (this.currentPlayData && this.currentPlayData.isLive) {
            return 600;
        }
        let mpdStatus = await this.mpdClient.api.status.get();
        return mpdStatus.elapsed || 0;
    }

    async getDuration() {
        if (this.isAsleep() || this.isDestroyed()) {
            return 0;
        }
        if (this.currentPlayData && this.currentPlayData.isLive) {
            return 600;
        }
        let mpdStatus = await this.mpdClient.api.status.get();
        return mpdStatus.time ? mpdStatus.time.total : 0;
    }

    async loadPlayData(videoId, rt = 5) {
        this.logDebug(`[MPDPlayer] loadPlayData(${ videoId })`);

        ytdl.cache.info.clear();
        ytdl.cache.watch.clear();

        let info = await ytdl.getInfo(videoId);
        let data = {};

        // Playability
        let playability = info.player_response.playabilityStatus;
        data.playable = playability.status === 'OK';            
        if (!data.playable) {
            data.unplayableReason = playability.reason;
        }
    
        // Video details
        let details = info.videoDetails;
        data.thumbnail = details.thumbnails ? details.thumbnails.pop().url : null;
        data.videoId = details.videoId;
        data.title = details.title;
        data.channelTitle = details.ownerChannelName;
        data.duration = details.lengthSeconds;
        
        // Audio
        if (data.playable) {
            let bestFormat;
            // `isLive` indicates whether the format is currently being streamed live
            let isLiveFormats = ytdl.filterFormats(info.formats, format => format.isLive);
            // `isLiveContent` does not necessarily mean the video is still currently live, we have to
            // see whether there are `isLive` formats too.
            let isCurrentlyLive = details.isLiveContent && isLiveFormats.length > 0;
            if (isCurrentlyLive) {
                // We need to obtain HLS format for livestreams
                this.logDebug('[MPDPlayer] Obtaining HLS format for livestream...')
                let hlsFormats = ytdl.filterFormats(isLiveFormats, format => format.hasAudio && format.isHLS);
                bestFormat = ytdl.chooseFormat(hlsFormats, { quality: 'highestaudio' });
            }
            else {
                let audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
                bestFormat = ytdl.chooseFormat(audioFormats, { quality: 'highest' });
            }
            data.streamUrl = bestFormat.url.replace(/"/g, '\\"'); // safe uri
            data.channels = bestFormat.audioChannels || 2;
            data.bitrate = bestFormat.audioBitrate;
            data.isLive = isCurrentlyLive;
        }

        // Check stream URL
        let streamUrlCheckStatus = await this.checkAudioUrl(data.streamUrl);
        if (streamUrlCheckStatus.error) {
            if (rt > 0) {
                this.logDebug('[MPDPlayer] checkAudioUrl() failed. Retry with new request...');
                return this.loadPlayData(videoId, rt - 1);
            }
            else {
                this.logDebug('[MPDPlayer] checkAudioUrl() failed. Max retries reached - giving up.');
                throw streamUrlCheckStatus.error;
            }
        }
        else {
            return data;
        }
    }

    async checkAudioUrl(url) {
        let self = this;
        self.logDebug(`[MPDPlayer] checkAudioUrl(): ${ url }`);

        const result = {
            error: null
        }
        try {
            const response = await fetch(url, {
                method: 'HEAD'
            });
            result.statusCode = response.status;
            if (result.statusCode === 403) {
                result.error = new Error('Audio URL returns 403 Forbidden');
            }
            else if (result.statusCode === 404) { // Might as well handle 404...
                result.error = new Error('Audio URL returns 404 Not Found');
            }
            else {
                self.logDebug(`[MPDPlayer] checkAudioUrl() passed. Response status code: ${ result.statusCode }`);
            }
        } catch (error) {
            self.logDebug(`[MPDPlayer] checkAudioUrl() failed: ${ err.message }`);
            if (!err.message) {
                self.logDebug(err);
            }
            result.error = error;
        }

        return result;
    }

    sleep() {
        if (!this.isAsleep()) {
            this.logDebug('[MPDPlayer] Going to sleep...')
            this.asleep = true;
        }
    }

    wake() {
        if (this.isAsleep()) {
            this.logDebug('[MPDPlayer] Waking up...')
            this.asleep = false;
        }
    }

    isAsleep() {
        return this.asleep;
    }

    isDestroyed() {
        return this.destroyed;
    }

}

class MPDEventListener {

    constructor(mpdClient, logger) {
        this.state = 'stopped';
        this.mpdClient = mpdClient;
        this.handler = new MPDEventHandler(logger);
        this.listener = this._listener.bind(this);
        this.logger = logger;
    }

    logDebug(message) {
        this.logger.logDebug(message);
    }

    start() {
        if (this.state === 'stopped') {
            this.mpdClient.on('system', this.listener);
            this.state = 'running';
            this.logDebug(`[MPDPlayer.MPDEventListener] Started`);
        }
    }

    stop() {
        this.state = 'stopped';
        this.mpdClient.removeListener('system', this.listener);
        this.logDebug(`[MPDPlayer.MPDEventListener] Stopped`);
    }

    on(subsystem, callback) {
        this.handler.addCallback(subsystem, callback, false,false);
    }

    off(subsystem, callback) {
        this.handler.removeCallback(subsystem, callback);
    }

    once(subsystem, callback) {
        this.handler.addCallback(subsystem, callback, true, false);
    }

    prepend(subsystem, callback) {
        this.handler.addCallback(subsystem, callback, false, true);
    }

    prependOnce(subsystem, callback) {
        this.handler.addCallback(subsystem, callback, true, true);
    }

    async _listener(subsystem) {
        this.logDebug(`[MPDPlayer.MPDEventListener] Event received for subsystem '${subsystem}'`);
        if (this.state === 'running') {
            this.logDebug(`[MPDPlayer.MPDEventListener] Calling handler.handle()...`);
            await this.handler.handle(subsystem);
        }
    }

}

class MPDEventHandler {

    constructor(logger) {
        this.callbacks = {};
        this.logger = logger;
    }

    logDebug(message) {
        this.logger.logDebug(message);
    }

    addCallback(subsystem, callback, once = false, prepend = false) {
        this.logDebug(`[MPDPlayer.MPDEventHandler] Adding callback:`);
        this.logDebug({
            subsystem,
            once,
            prepend
        });
        let wrappedCallback = {
            callback,
            once
        };
        if (this.callbacks[subsystem] == undefined) {
            this.callbacks[subsystem] = [];
        }
        if (prepend) {
            this.callbacks[subsystem].unshift(wrappedCallback);
        }
        else {
            this.callbacks[subsystem].push(wrappedCallback);
        }
    }

    removeCallback(subsystem, callback) {
        let callbacks = this.callbacks[subsystem];
        if (callbacks == undefined) {
            return;
        }
        let filtered = callbacks.filter( cb => cb.callback !== callback );
        this.callbacks[subsystem] = filtered;
    }

    async handle(subsystem) {
        let callbacks = this.callbacks[subsystem];
        this.logDebug(`[MPDPlayer.MPDEventHandler] Number of callbacks for subsystem ${subsystem}: ${callbacks ? callbacks.length : 0}`);
        if (!callbacks) {
            return;
        }

        for (let i = 0; i < callbacks.length; i++) {
            let event = {
                subsystem,
                _stopPropagation: false,
            };
            event.stopPropagation = () => {
                event._stopPropagation = true;
            };
            let cb = callbacks[i];
            try {
                let cbResult = cb.callback(event);
                if (cbResult.then != undefined) {
                    await cbResult;
                }
            } catch (error) {
                this.logDebug(`[MPDPlayer.MPDEventHandler] Callback error: ${error}`);
            }
            if (event._stopPropagation) {
                this.logDebug(`[MPDPlayer.MPDEventHandler] stopPropagation() called - skipping further callbacks...`);
                break;
            }
        }
        this.callbacks[subsystem] = callbacks.filter( cb => !cb.once );
    }
}

MPDPlayer.ERROR_TRACK_LOAD_FAILED = ERROR_TRACK_LOAD_FAILED;
MPDPlayer.ERROR_TRACK_UNPLAYABLE = ERROR_TRACK_UNPLAYABLE;

module.exports = MPDPlayer;