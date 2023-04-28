"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _MPDPlayer_instances, _MPDPlayer_config, _MPDPlayer_currentVideoInfo, _MPDPlayer_mpdClient, _MPDPlayer_volumeControl, _MPDPlayer_videoLoader, _MPDPlayer_loadVideoAbortController, _MPDPlayer_subsystemEventEmitter, _MPDPlayer_destroyed, _MPDPlayer_asleep, _MPDPlayer_abortLoadVideo, _MPDPlayer_handleExternalMPDEvent;
Object.defineProperty(exports, "__esModule", { value: true });
const yt_cast_receiver_1 = require("yt-cast-receiver");
const mpd_api_1 = __importDefault(require("mpd-api"));
const abort_controller_1 = __importDefault(require("abort-controller"));
const MPDSubsystemEventEmitter_js_1 = __importDefault(require("./MPDSubsystemEventEmitter.js"));
const YTCRContext_js_1 = __importDefault(require("./YTCRContext.js"));
class MPDPlayer extends yt_cast_receiver_1.Player {
    constructor(config) {
        super();
        _MPDPlayer_instances.add(this);
        _MPDPlayer_config.set(this, void 0);
        _MPDPlayer_currentVideoInfo.set(this, void 0);
        _MPDPlayer_mpdClient.set(this, void 0);
        _MPDPlayer_volumeControl.set(this, void 0);
        _MPDPlayer_videoLoader.set(this, void 0);
        _MPDPlayer_loadVideoAbortController.set(this, void 0);
        _MPDPlayer_subsystemEventEmitter.set(this, void 0);
        _MPDPlayer_destroyed.set(this, void 0);
        _MPDPlayer_asleep.set(this, void 0);
        __classPrivateFieldSet(this, _MPDPlayer_config, config, "f");
    }
    // Must be called after receiver started, not before.
    async init() {
        __classPrivateFieldSet(this, _MPDPlayer_currentVideoInfo, null, "f");
        __classPrivateFieldSet(this, _MPDPlayer_mpdClient, await mpd_api_1.default.connect(__classPrivateFieldGet(this, _MPDPlayer_config, "f").mpd), "f");
        __classPrivateFieldSet(this, _MPDPlayer_destroyed, false, "f");
        __classPrivateFieldSet(this, _MPDPlayer_videoLoader, __classPrivateFieldGet(this, _MPDPlayer_config, "f").videoLoader, "f");
        __classPrivateFieldSet(this, _MPDPlayer_volumeControl, __classPrivateFieldGet(this, _MPDPlayer_config, "f").volumeControl, "f");
        const externalMPDEventListener = __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_handleExternalMPDEvent).bind(this);
        __classPrivateFieldSet(this, _MPDPlayer_subsystemEventEmitter, MPDSubsystemEventEmitter_js_1.default.instance(__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f"), this.logger), "f");
        __classPrivateFieldGet(this, _MPDPlayer_subsystemEventEmitter, "f").on('player', externalMPDEventListener);
        __classPrivateFieldGet(this, _MPDPlayer_subsystemEventEmitter, "f").on('mixer', externalMPDEventListener);
        __classPrivateFieldGet(this, _MPDPlayer_subsystemEventEmitter, "f").enable();
    }
    async doPlay(video, position) {
        if (__classPrivateFieldGet(this, _MPDPlayer_destroyed, "f") || !__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")) {
            return false;
        }
        this.emit('action', { name: 'play', data: { videoId: video.id, position } });
        this.logger.debug(`[ytcr] MPDPlayer: play ${video.id} at position ${position}s`);
        __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_abortLoadVideo).call(this);
        __classPrivateFieldSet(this, _MPDPlayer_loadVideoAbortController, new abort_controller_1.default(), "f");
        let videoInfo;
        try {
            videoInfo = await __classPrivateFieldGet(this, _MPDPlayer_videoLoader, "f").getInfo(video, __classPrivateFieldGet(this, _MPDPlayer_loadVideoAbortController, "f").signal);
        }
        catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                this.logger.debug('[ytcr] AbortError:', error);
                return false;
            }
            throw error;
        }
        finally {
            __classPrivateFieldSet(this, _MPDPlayer_loadVideoAbortController, null, "f");
        }
        this.logger.debug(`[ytcr] MPDPLayer obtained info for ${video.id}:`, videoInfo);
        await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.queue.clear();
        if (videoInfo?.streamUrl) {
            const songId = (await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.queue.addid(videoInfo.streamUrl)).toString();
            videoInfo.mpdSongId = songId;
            if (videoInfo.title) {
                await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.queue.addtagid(songId, 'title', videoInfo.title);
            }
            if (videoInfo.channel) {
                await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.queue.addtagid(songId, 'album', videoInfo.channel);
            }
            await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.queue.addtagid(songId, 'artist', 'YouTube Cast');
            await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.playback.consume('1');
            await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.playback.seekid(songId, position.toString());
            this.wake();
            const resolved = await this.resolveOnMPDStatusChanged(__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.playback.playid.bind(this, songId), 'player', { state: 'play', songid: videoInfo.mpdSongId });
            if (resolved) { // Playback successful
                __classPrivateFieldSet(this, _MPDPlayer_currentVideoInfo, videoInfo, "f");
            }
            return resolved;
            /*       Return this.resolveOnMPDStatusChanged(
                      this.#mpdClient.api.playback.playid.bind(this, songId), 'player',
                      { state: 'play', songid: videoInfo.mpdSongId }
                    )
                      .then(async (mpdStatus) => {
                        this.#currentVideoInfo = videoInfo;
                        await this.notifyVolumeChanged();
                        await this.notifyPlayed();
                        return mpdStatus;
                      })
                      .then(mpdStatus => this.getState(mpdStatus))
                      .then(playerState => this.eventEmitter.emit('stateChanged', playerState, { triggeredBy: 'play' }))*/
        }
        this.logger.debug(`[ytcr] MPDPlayer failed to play ${video.id}: ${videoInfo.errMsg}`);
        this.emit('error', {
            message: YTCRContext_js_1.default.getI18n('YTCR_START_PLAYBACK_FAILED', videoInfo.title || videoInfo.id, videoInfo.errMsg)
        });
        // Check if video was in fact loaded (just that it's unplayable) - this affects whether we're going to play next.
        if (videoInfo?.title) {
            this.logger.debug('[ytcr] Video unplayable; proceeding to next in queue...');
            return this.next();
        }
        return false;
    }
    async doPause() {
        if (__classPrivateFieldGet(this, _MPDPlayer_destroyed, "f") || !__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f") || !__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f")?.mpdSongId) {
            return false;
        }
        this.emit('action', { name: 'pause' });
        this.logger.debug('[ytcr] MPDPlayer: pause');
        return this.resolveOnMPDStatusChanged(__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.playback.pause.bind(this), 'player', { state: 'pause', songid: __classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").mpdSongId });
    }
    async doResume() {
        if (__classPrivateFieldGet(this, _MPDPlayer_destroyed, "f") || !__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f") || !__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f")?.mpdSongId) {
            return false;
        }
        this.emit('action', { name: 'resume' });
        this.logger.debug('[ytcr] MPDPlayer: resume');
        return this.resolveOnMPDStatusChanged(__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.playback.resume.bind(this), 'player', { state: 'play', songid: __classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").mpdSongId });
    }
    async doStop() {
        if (__classPrivateFieldGet(this, _MPDPlayer_destroyed, "f") || !__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")) {
            return true;
        }
        if (this.status === yt_cast_receiver_1.Constants.PLAYER_STATUSES.LOADING) {
            __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_abortLoadVideo).call(this);
            return true;
        }
        this.emit('action', { name: 'stop' });
        this.logger.debug('[ytcr] MPDPlayer: stop');
        const resolved = await this.resolveOnMPDStatusChanged(__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.playback.stop.bind(this), 'player', { state: 'stop' });
        if (resolved) { // Stopped
            __classPrivateFieldSet(this, _MPDPlayer_currentVideoInfo, null, "f");
        }
        return resolved;
    }
    async doSeek(position) {
        if (__classPrivateFieldGet(this, _MPDPlayer_destroyed, "f") || !__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f") || !__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f")?.mpdSongId) {
            return false;
        }
        // Seeking not supported for livestreams
        if (__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").isLive) {
            this.logger.debug('[ytcr] MPDPlayer playing livestream; seek request ignored.');
            return false;
        }
        this.emit('action', { name: 'seek', data: { position } });
        this.logger.debug(`[ytcr] MPDPlayer: seek to ${position}s`);
        return await this.resolveOnMPDStatusChanged(__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.playback.seekcur.bind(this, position.toString()), 'player', { songid: __classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").mpdSongId });
    }
    async doSetVolume(volume) {
        if (__classPrivateFieldGet(this, _MPDPlayer_asleep, "f") || __classPrivateFieldGet(this, _MPDPlayer_destroyed, "f")) {
            return false;
        }
        this.emit('action', { name: 'setVolume', data: { volume } });
        if (__classPrivateFieldGet(this, _MPDPlayer_asleep, "f") || __classPrivateFieldGet(this, _MPDPlayer_destroyed, "f")) {
            return false;
        }
        this.logger.debug('[ytcr] MPDPlayer: set volume to:', volume);
        __classPrivateFieldGet(this, _MPDPlayer_volumeControl, "f").setVolume(volume);
        return true;
    }
    doGetVolume() {
        return __classPrivateFieldGet(this, _MPDPlayer_volumeControl, "f").getVolume();
    }
    async doGetPosition() {
        if (__classPrivateFieldGet(this, _MPDPlayer_asleep, "f") || __classPrivateFieldGet(this, _MPDPlayer_destroyed, "f") || !__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")) {
            return 0;
        }
        if (__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f")?.isLive) {
            return 600;
        }
        const mpdStatus = await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.status.get();
        return mpdStatus?.elapsed || 0;
    }
    async doGetDuration() {
        if (__classPrivateFieldGet(this, _MPDPlayer_asleep, "f") || __classPrivateFieldGet(this, _MPDPlayer_destroyed, "f") || !__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")) {
            return 0;
        }
        if (__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f")?.isLive) {
            return 600;
        }
        const mpdStatus = await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.status.get();
        return mpdStatus?.time?.total || 0;
    }
    async destroy() {
        __classPrivateFieldSet(this, _MPDPlayer_destroyed, true, "f");
        __classPrivateFieldGet(this, _MPDPlayer_subsystemEventEmitter, "f")?.disable();
        await this.stop();
        await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")?.disconnect();
        this.removeAllListeners();
        __classPrivateFieldSet(this, _MPDPlayer_subsystemEventEmitter, null, "f");
        __classPrivateFieldSet(this, _MPDPlayer_mpdClient, null, "f");
        __classPrivateFieldSet(this, _MPDPlayer_currentVideoInfo, null, "f");
        __classPrivateFieldSet(this, _MPDPlayer_asleep, true, "f");
    }
    sleep() {
        if (!__classPrivateFieldGet(this, _MPDPlayer_asleep, "f")) {
            this.logger.debug('[ytcr] MPDPlayer going to sleep...');
            __classPrivateFieldSet(this, _MPDPlayer_asleep, true, "f");
        }
    }
    wake() {
        if (__classPrivateFieldGet(this, _MPDPlayer_asleep, "f")) {
            this.logger.debug('[ytcr] MPDPlayer waking up...');
            __classPrivateFieldSet(this, _MPDPlayer_asleep, false, "f");
        }
    }
    resolveOnMPDStatusChanged(action, subsystem, resolveOn = {}) {
        return new Promise((resolve) => {
            __classPrivateFieldGet(this, _MPDPlayer_subsystemEventEmitter, "f")?.prependOnceListener(subsystem, async (event) => {
                const mpdStatus = await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")?.api.status.get();
                let shouldResolve = true;
                for (const [key, value] of Object.entries(resolveOn)) {
                    if (mpdStatus[key] === undefined || mpdStatus[key].toString() !== value.toString()) {
                        shouldResolve = false;
                        break;
                    }
                }
                event.stopPropagation();
                if (shouldResolve) {
                    this.logger.debug('[ytcr] Condition for resolveOnMPDStatusChanged() satisfied. Resolving Promise...');
                    resolve(true);
                }
                else {
                    this.logger.debug('[ytcr] MPD status:', mpdStatus, 'does not match condition:', resolveOn);
                    this.logger.debug('[ytcr] Condition for resolveOnMPDStatusChanged() failed. Rejecting Promise...');
                    resolve(false);
                }
            });
            action();
        });
    }
    async getVolumioState() {
        if (__classPrivateFieldGet(this, _MPDPlayer_asleep, "f") || __classPrivateFieldGet(this, _MPDPlayer_destroyed, "f") || !__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")) {
            return null;
        }
        const mpdStatus = await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.status.get();
        const volume = await __classPrivateFieldGet(this, _MPDPlayer_volumeControl, "f").getVolume();
        if (!mpdStatus) {
            return null;
        }
        const state = {
            status: mpdStatus.state,
            service: 'ytcr',
            albumart: __classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f")?.thumbnail || '/albumart',
            uri: '',
            trackType: 'YouTube',
            seek: Math.round((mpdStatus.elapsed || 0) * 1000),
            duration: Math.round(mpdStatus.time?.total || 0),
            volume: volume.level,
            mute: volume.muted
        };
        const audio = mpdStatus?.audio;
        if (audio && !__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f")?.bitrate) {
            if (audio.bits && audio.bits !== 'f') {
                state.bitdepth = `${audio.bits.toString()} bit`;
            }
            if (audio.sample_rate_short) {
                state.samplerate = `${audio.sample_rate_short.value} ${audio.sample_rate_short.unit}`;
            }
        }
        if (__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f")) {
            state.title = __classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").title;
            state.artist = __classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").channel || __classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").artist;
            if (__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").album) {
                state.album = __classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").album;
            }
            if (__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").bitrate) {
                state.bitrate = __classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").bitrate;
            }
            if (__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").channels) {
                state.channels = __classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").channels;
            }
            state.isStreaming = __classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").isLive;
            if (__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").isLive) {
                state.duration = 0;
                state.seek = undefined;
            }
            const youtubeCastText = `YouTube Cast${__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").isLive ? ' (Live)' : ''}`;
            if (state.bitdepth) {
                state.bitdepth = `${state.bitdepth} - ${youtubeCastText}`;
            }
            else if (state.samplerate) {
                state.samplerate = `${state.samplerate} - ${youtubeCastText}`;
            }
            else if (state.bitrate) {
                state.samplerate = `${state.bitrate} - ${youtubeCastText}`;
            }
            else {
                state.samplerate = youtubeCastText;
            }
            delete state.bitrate;
        }
        return state;
    }
    get videoLoader() {
        return __classPrivateFieldGet(this, _MPDPlayer_videoLoader, "f");
    }
    on(event, listener) {
        super.on(event, listener);
        return this;
    }
}
exports.default = MPDPlayer;
_MPDPlayer_config = new WeakMap(), _MPDPlayer_currentVideoInfo = new WeakMap(), _MPDPlayer_mpdClient = new WeakMap(), _MPDPlayer_volumeControl = new WeakMap(), _MPDPlayer_videoLoader = new WeakMap(), _MPDPlayer_loadVideoAbortController = new WeakMap(), _MPDPlayer_subsystemEventEmitter = new WeakMap(), _MPDPlayer_destroyed = new WeakMap(), _MPDPlayer_asleep = new WeakMap(), _MPDPlayer_instances = new WeakSet(), _MPDPlayer_abortLoadVideo = function _MPDPlayer_abortLoadVideo() {
    if (__classPrivateFieldGet(this, _MPDPlayer_loadVideoAbortController, "f")) {
        __classPrivateFieldGet(this, _MPDPlayer_loadVideoAbortController, "f").abort();
        __classPrivateFieldSet(this, _MPDPlayer_loadVideoAbortController, null, "f");
    }
}, _MPDPlayer_handleExternalMPDEvent = async function _MPDPlayer_handleExternalMPDEvent(event) {
    if (__classPrivateFieldGet(this, _MPDPlayer_asleep, "f") || __classPrivateFieldGet(this, _MPDPlayer_destroyed, "f") || !__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")) {
        return;
    }
    this.logger.debug(`[ytcr] MPDPlayer received external MPD event for subsystem: ${event.name}.`);
    const mpdStatus = await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.status.get();
    this.logger.debug('[ytcr] MPD status for subsystem event:', mpdStatus);
    if (!__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f") || (__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").mpdSongId !== mpdStatus.songid?.toString() && mpdStatus.state !== 'stop')) {
        this.logger.debug('[ytcr] MPD subsystem event does not match current song. Putting player to sleep...');
        __classPrivateFieldSet(this, _MPDPlayer_currentVideoInfo, null, "f");
        await this.notifyExternalStateChange(yt_cast_receiver_1.Constants.PLAYER_STATUSES.STOPPED);
        this.sleep();
        return;
    }
    if (event.name === 'mixer') {
        this.logger.debug('[ytcr] MPD subsystem event indicated volume change. Notifying senders of change...');
        await this.notifyExternalStateChange();
        //This.emit('volumeChanged', mpdStatus.volume)
        return;
    }
    if (event.name === 'player') {
        switch (mpdStatus.state) {
            case 'pause':
                await this.notifyExternalStateChange(yt_cast_receiver_1.Constants.PLAYER_STATUSES.PAUSED);
                break;
            case 'stop':
                await this.notifyExternalStateChange(yt_cast_receiver_1.Constants.PLAYER_STATUSES.STOPPED);
                break;
            default:
                await this.notifyExternalStateChange(yt_cast_receiver_1.Constants.PLAYER_STATUSES.PLAYING);
        }
        //Let playerState = await this.getState(mpdStatus);
        if (mpdStatus.state === 'stop') {
            // In play(), we set consume on for mpd. If song is no longer in the queue,
            // That means it has finished playing
            let songIdInfo;
            try {
                if (__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").mpdSongId) {
                    songIdInfo = await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.queue.id(__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").mpdSongId);
                }
            }
            catch (error) {
                songIdInfo = null;
            }
            __classPrivateFieldSet(this, _MPDPlayer_currentVideoInfo, null, "f");
            //Let playbackFinished = false;
            if (!songIdInfo) {
                this.logger.debug('[ytcr] Current playback finished.');
                //PlaybackFinished = true;
                await this.next();
            }
            //This.eventEmitter.emit('stateChanged', playerState, { triggeredBy: 'playbackFinished' });
        }
        else {
            //This.eventEmitter.emit('stateChanged', playerState, { triggeredBy: 'external' });
        }
    }
};
//# sourceMappingURL=MPDPlayer.js.map