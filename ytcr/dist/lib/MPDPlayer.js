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
var _MPDPlayer_instances, _MPDPlayer_config, _MPDPlayer_currentVideoInfo, _MPDPlayer_prefetchedAndQueuedVideoInfo, _MPDPlayer_prefetchedVideoExpiryTimer, _MPDPlayer_mpdClient, _MPDPlayer_mpdClientInitTimer, _MPDPlayer_volumeControl, _MPDPlayer_videoLoader, _MPDPlayer_loadVideoAbortController, _MPDPlayer_videoPrefetcher, _MPDPlayer_playlistEventListener, _MPDPlayer_autoplayModeChangeListener, _MPDPlayer_subsystemEventEmitter, _MPDPlayer_destroyed, _MPDPlayer_asleep, _MPDPlayer_clearMPDClientInitTimer, _MPDPlayer_initMPDClient, _MPDPlayer_abortLoadVideo, _MPDPlayer_addToMPDQueue, _MPDPlayer_handlePlaylistEvent, _MPDPlayer_handleAutoplayModeChange, _MPDPlayer_refreshPrefetch, _MPDPlayer_checkAndStartPrefetch, _MPDPlayer_cancelPrefetch, _MPDPlayer_clearPrefetch, _MPDPlayer_clearPrefetchedVideoExpiryTimer, _MPDPlayer_handlePrefetchedVideo, _MPDPlayer_handleExternalMPDEvent;
Object.defineProperty(exports, "__esModule", { value: true });
const yt_cast_receiver_1 = require("yt-cast-receiver");
const mpd_api_1 = __importDefault(require("mpd-api"));
const abort_controller_1 = __importDefault(require("abort-controller"));
const MPDSubsystemEventEmitter_js_1 = __importDefault(require("./MPDSubsystemEventEmitter.js"));
const YTCRContext_js_1 = __importDefault(require("./YTCRContext.js"));
const VideoPrefetcher_js_1 = __importDefault(require("./VideoPrefetcher.js"));
class MPDPlayer extends yt_cast_receiver_1.Player {
    constructor(config) {
        super();
        _MPDPlayer_instances.add(this);
        _MPDPlayer_config.set(this, void 0);
        _MPDPlayer_currentVideoInfo.set(this, void 0);
        _MPDPlayer_prefetchedAndQueuedVideoInfo.set(this, void 0);
        _MPDPlayer_prefetchedVideoExpiryTimer.set(this, void 0);
        _MPDPlayer_mpdClient.set(this, void 0);
        _MPDPlayer_mpdClientInitTimer.set(this, void 0);
        _MPDPlayer_volumeControl.set(this, void 0);
        _MPDPlayer_videoLoader.set(this, void 0);
        _MPDPlayer_loadVideoAbortController.set(this, void 0);
        _MPDPlayer_videoPrefetcher.set(this, void 0);
        _MPDPlayer_playlistEventListener.set(this, void 0);
        _MPDPlayer_autoplayModeChangeListener.set(this, void 0);
        _MPDPlayer_subsystemEventEmitter.set(this, void 0);
        _MPDPlayer_destroyed.set(this, void 0);
        _MPDPlayer_asleep.set(this, void 0);
        __classPrivateFieldSet(this, _MPDPlayer_config, config, "f");
        __classPrivateFieldSet(this, _MPDPlayer_mpdClientInitTimer, null, "f");
    }
    // Must be called after receiver started, not before.
    async init() {
        __classPrivateFieldSet(this, _MPDPlayer_currentVideoInfo, null, "f");
        __classPrivateFieldSet(this, _MPDPlayer_destroyed, false, "f");
        __classPrivateFieldSet(this, _MPDPlayer_videoLoader, __classPrivateFieldGet(this, _MPDPlayer_config, "f").videoLoader, "f");
        __classPrivateFieldSet(this, _MPDPlayer_videoPrefetcher, __classPrivateFieldGet(this, _MPDPlayer_config, "f").prefetch ? new VideoPrefetcher_js_1.default(__classPrivateFieldGet(this, _MPDPlayer_videoLoader, "f"), this.logger) : null, "f");
        __classPrivateFieldSet(this, _MPDPlayer_volumeControl, __classPrivateFieldGet(this, _MPDPlayer_config, "f").volumeControl, "f");
        __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_initMPDClient).call(this);
        __classPrivateFieldSet(this, _MPDPlayer_playlistEventListener, __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_handlePlaylistEvent).bind(this), "f");
        Object.values(yt_cast_receiver_1.PLAYLIST_EVENT_TYPES).forEach((event) => {
            this.queue.on(event, __classPrivateFieldGet(this, _MPDPlayer_playlistEventListener, "f"));
        });
        __classPrivateFieldSet(this, _MPDPlayer_autoplayModeChangeListener, __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_handleAutoplayModeChange).bind(this), "f");
        this.queue.on('autoplayModeChange', __classPrivateFieldGet(this, _MPDPlayer_autoplayModeChangeListener, "f"));
    }
    async doPlay(video, position) {
        if (__classPrivateFieldGet(this, _MPDPlayer_destroyed, "f") || !__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")) {
            return false;
        }
        await __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_clearPrefetch).call(this);
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
        if (videoInfo) {
            const songId = await __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_addToMPDQueue).call(this, videoInfo);
            if (songId) {
                videoInfo.mpdSongId = songId;
                await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.playback.seekid(songId, position.toString());
                this.wake();
                const resolved = await this.resolveOnMPDStatusChanged(__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.playback.playid.bind(this, songId), 'player', { state: 'play', songid: videoInfo.mpdSongId });
                if (resolved.result) { // Playback successful
                    __classPrivateFieldSet(this, _MPDPlayer_currentVideoInfo, videoInfo, "f");
                    __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_checkAndStartPrefetch).call(this, resolved.mpdStatus);
                }
                return resolved.result;
            }
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
    // Overrides
    async next(AID) {
        // If prefetched video already added to MPD queue, tell MPD to play it instead of going through the original next() workflow.
        // This will trigger an external MPD event which will be dealt with in #handleExternalMPDEvent().
        const queueState = this.queue.getState();
        const nextVideo = queueState.next || queueState.autoplay;
        if (nextVideo && __classPrivateFieldGet(this, _MPDPlayer_prefetchedAndQueuedVideoInfo, "f")?.id === nextVideo.id && __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")) {
            this.logger.debug(`[ytcr] Playing prefetched video from MPD queue: ${nextVideo.id}`);
            await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.playback.playid(__classPrivateFieldGet(this, _MPDPlayer_prefetchedAndQueuedVideoInfo, "f").mpdSongId);
            return true;
        }
        // Original workflow
        await __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_clearPrefetch).call(this);
        return super.next(AID);
    }
    async doPause() {
        if (__classPrivateFieldGet(this, _MPDPlayer_destroyed, "f") || !__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f") || !__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f")?.mpdSongId) {
            return false;
        }
        await __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_cancelPrefetch).call(this);
        this.emit('action', { name: 'pause' });
        this.logger.debug('[ytcr] MPDPlayer: pause');
        const resolve = await this.resolveOnMPDStatusChanged(__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.playback.pause.bind(this), 'player', { state: 'pause', songid: __classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").mpdSongId });
        return resolve.result;
    }
    async doResume() {
        if (__classPrivateFieldGet(this, _MPDPlayer_destroyed, "f") || !__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f") || !__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f")?.mpdSongId) {
            return false;
        }
        this.emit('action', { name: 'resume' });
        this.logger.debug('[ytcr] MPDPlayer: resume');
        const resolve = await this.resolveOnMPDStatusChanged(__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.playback.resume.bind(this), 'player', { state: 'play', songid: __classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").mpdSongId });
        if (resolve.result) {
            __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_checkAndStartPrefetch).call(this, resolve.mpdStatus);
        }
        return resolve.result;
    }
    async doStop() {
        if (__classPrivateFieldGet(this, _MPDPlayer_destroyed, "f") || !__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")) {
            return true;
        }
        await __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_clearPrefetch).call(this);
        if (this.status === yt_cast_receiver_1.Constants.PLAYER_STATUSES.LOADING) {
            __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_abortLoadVideo).call(this);
            return true;
        }
        this.emit('action', { name: 'stop' });
        this.logger.debug('[ytcr] MPDPlayer: stop');
        const resolved = await this.resolveOnMPDStatusChanged(__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.playback.stop.bind(this), 'player', { state: 'stop' });
        if (resolved.result) { // Stopped
            __classPrivateFieldSet(this, _MPDPlayer_currentVideoInfo, null, "f");
        }
        return resolved.result;
    }
    async doSeek(position) {
        if (__classPrivateFieldGet(this, _MPDPlayer_destroyed, "f") || !__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f") || !__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f")?.mpdSongId) {
            return false;
        }
        await __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_cancelPrefetch).call(this);
        // Seeking not supported for livestreams
        if (__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").isLive) {
            this.logger.debug('[ytcr] MPDPlayer playing livestream; seek request ignored.');
            return false;
        }
        this.emit('action', { name: 'seek', data: { position } });
        this.logger.debug(`[ytcr] MPDPlayer: seek to ${position}s`);
        const resolve = await this.resolveOnMPDStatusChanged(__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.playback.seekcur.bind(this, position.toString()), 'player', { songid: __classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").mpdSongId });
        if (resolve.result) {
            __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_checkAndStartPrefetch).call(this, resolve.mpdStatus);
        }
        return resolve.result;
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
        return mpdStatus.elapsed || 0;
    }
    async doGetDuration() {
        if (__classPrivateFieldGet(this, _MPDPlayer_asleep, "f") || __classPrivateFieldGet(this, _MPDPlayer_destroyed, "f") || !__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")) {
            return 0;
        }
        if (__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f")?.isLive) {
            return 600;
        }
        const mpdStatus = await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.status.get();
        return mpdStatus.duration || 0;
    }
    async enablePrefetch(value) {
        if (value === __classPrivateFieldGet(this, _MPDPlayer_config, "f").prefetch) {
            return;
        }
        if (value) {
            __classPrivateFieldSet(this, _MPDPlayer_videoPrefetcher, new VideoPrefetcher_js_1.default(__classPrivateFieldGet(this, _MPDPlayer_videoLoader, "f"), this.logger), "f");
            if ((this.status === yt_cast_receiver_1.Constants.PLAYER_STATUSES.PAUSED || this.status === yt_cast_receiver_1.Constants.PLAYER_STATUSES.PLAYING) && __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")) {
                const mpdStatus = await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.status.get();
                __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_checkAndStartPrefetch).call(this, mpdStatus);
            }
        }
        else {
            await __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_clearPrefetch).call(this);
            __classPrivateFieldSet(this, _MPDPlayer_videoPrefetcher, null, "f");
        }
        __classPrivateFieldGet(this, _MPDPlayer_config, "f").prefetch = value;
    }
    async destroy() {
        __classPrivateFieldSet(this, _MPDPlayer_destroyed, true, "f");
        __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_clearMPDClientInitTimer).call(this);
        __classPrivateFieldGet(this, _MPDPlayer_subsystemEventEmitter, "f")?.destroy();
        await this.stop();
        await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")?.disconnect();
        this.removeAllListeners();
        Object.values(yt_cast_receiver_1.PLAYLIST_EVENT_TYPES).forEach((event) => {
            this.queue.off(event, __classPrivateFieldGet(this, _MPDPlayer_playlistEventListener, "f"));
        });
        this.queue.off('autoplayModeChange', __classPrivateFieldGet(this, _MPDPlayer_autoplayModeChangeListener, "f"));
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
                    resolve({ result: true, mpdStatus });
                }
                else {
                    this.logger.debug('[ytcr] MPD status:', mpdStatus, 'does not match condition:', resolveOn);
                    this.logger.debug('[ytcr] Condition for resolveOnMPDStatusChanged() failed. Rejecting Promise...');
                    resolve({ result: false, mpdStatus });
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
    get currentVideo() {
        return __classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f");
    }
    on(event, listener) {
        super.on(event, listener);
        return this;
    }
}
exports.default = MPDPlayer;
_MPDPlayer_config = new WeakMap(), _MPDPlayer_currentVideoInfo = new WeakMap(), _MPDPlayer_prefetchedAndQueuedVideoInfo = new WeakMap(), _MPDPlayer_prefetchedVideoExpiryTimer = new WeakMap(), _MPDPlayer_mpdClient = new WeakMap(), _MPDPlayer_mpdClientInitTimer = new WeakMap(), _MPDPlayer_volumeControl = new WeakMap(), _MPDPlayer_videoLoader = new WeakMap(), _MPDPlayer_loadVideoAbortController = new WeakMap(), _MPDPlayer_videoPrefetcher = new WeakMap(), _MPDPlayer_playlistEventListener = new WeakMap(), _MPDPlayer_autoplayModeChangeListener = new WeakMap(), _MPDPlayer_subsystemEventEmitter = new WeakMap(), _MPDPlayer_destroyed = new WeakMap(), _MPDPlayer_asleep = new WeakMap(), _MPDPlayer_instances = new WeakSet(), _MPDPlayer_clearMPDClientInitTimer = function _MPDPlayer_clearMPDClientInitTimer() {
    if (__classPrivateFieldGet(this, _MPDPlayer_mpdClientInitTimer, "f")) {
        clearTimeout(__classPrivateFieldGet(this, _MPDPlayer_mpdClientInitTimer, "f"));
        __classPrivateFieldSet(this, _MPDPlayer_mpdClientInitTimer, null, "f");
    }
}, _MPDPlayer_initMPDClient = async function _MPDPlayer_initMPDClient() {
    __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_clearMPDClientInitTimer).call(this);
    if (__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")) {
        return;
    }
    try {
        __classPrivateFieldSet(this, _MPDPlayer_mpdClient, await mpd_api_1.default.connect(__classPrivateFieldGet(this, _MPDPlayer_config, "f").mpd), "f");
    }
    catch (error) {
        this.logger.error('[ytcr] Error connecting MPD:', error, ' Retrying in 5 seconds...');
        __classPrivateFieldSet(this, _MPDPlayer_mpdClientInitTimer, setTimeout(() => {
            if (!__classPrivateFieldGet(this, _MPDPlayer_destroyed, "f")) {
                __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_initMPDClient).call(this);
            }
        }, 5000), "f");
        return;
    }
    this.logger.debug('[ytcr] MPD connected');
    __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").once('close', async () => {
        __classPrivateFieldSet(this, _MPDPlayer_mpdClient, null, "f");
        __classPrivateFieldGet(this, _MPDPlayer_subsystemEventEmitter, "f")?.destroy();
        if (__classPrivateFieldGet(this, _MPDPlayer_destroyed, "f")) {
            return;
        }
        await __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_clearPrefetch).call(this);
        __classPrivateFieldSet(this, _MPDPlayer_currentVideoInfo, null, "f");
        await this.notifyExternalStateChange(yt_cast_receiver_1.Constants.PLAYER_STATUSES.STOPPED);
        this.sleep();
        this.logger.debug('[ytcr] MPD disconnected. Reconnecting...');
        __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_initMPDClient).call(this);
    });
    const externalMPDEventListener = __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_handleExternalMPDEvent).bind(this);
    __classPrivateFieldSet(this, _MPDPlayer_subsystemEventEmitter, MPDSubsystemEventEmitter_js_1.default.instance(__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f"), this.logger), "f");
    __classPrivateFieldGet(this, _MPDPlayer_subsystemEventEmitter, "f").on('player', externalMPDEventListener);
    __classPrivateFieldGet(this, _MPDPlayer_subsystemEventEmitter, "f").on('mixer', externalMPDEventListener);
    __classPrivateFieldGet(this, _MPDPlayer_subsystemEventEmitter, "f").enable();
}, _MPDPlayer_abortLoadVideo = function _MPDPlayer_abortLoadVideo() {
    if (__classPrivateFieldGet(this, _MPDPlayer_loadVideoAbortController, "f")) {
        __classPrivateFieldGet(this, _MPDPlayer_loadVideoAbortController, "f").abort();
        __classPrivateFieldSet(this, _MPDPlayer_loadVideoAbortController, null, "f");
    }
}, _MPDPlayer_addToMPDQueue = async function _MPDPlayer_addToMPDQueue(videoInfo) {
    if (__classPrivateFieldGet(this, _MPDPlayer_destroyed, "f") || !__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")) {
        return null;
    }
    if (videoInfo.streamUrl) {
        const songId = (await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.queue.addid(videoInfo.streamUrl)).toString();
        if (videoInfo.title) {
            await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.queue.addtagid(songId, 'title', videoInfo.title);
        }
        const album = videoInfo.album || videoInfo.channel;
        if (album) {
            await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.queue.addtagid(songId, 'album', album);
        }
        await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.queue.addtagid(songId, 'artist', videoInfo.artist || 'YouTube Cast');
        await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.playback.consume('1');
        return songId;
    }
    return null;
}, _MPDPlayer_handlePlaylistEvent = async function _MPDPlayer_handlePlaylistEvent() {
    const queueState = this.queue.getState();
    if (!queueState.current?.id || __classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f")?.id !== queueState.current.id) {
        // Skip handling if:
        // 1. Current video is `null`, meaning doStop() will be called if player is playing. We will clear prefetching there; or
        // 2. Current video has changed, meaning doPlay() will be called. We will handle prefetching there.
        return;
    }
    // Same video so doPlay() / doStop() will not be called.
    // But playlist could have been updated so that the next / autoplay video is different. Need to refresh prefetch as ncessary.
    await __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_refreshPrefetch).call(this);
}, _MPDPlayer_handleAutoplayModeChange = async function _MPDPlayer_handleAutoplayModeChange() {
    await __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_refreshPrefetch).call(this);
}, _MPDPlayer_refreshPrefetch = async function _MPDPlayer_refreshPrefetch() {
    const queueState = this.queue.getState();
    if (__classPrivateFieldGet(this, _MPDPlayer_videoPrefetcher, "f")) {
        const nextVideo = queueState.next || queueState.autoplay;
        const prefetcherTarget = __classPrivateFieldGet(this, _MPDPlayer_prefetchedAndQueuedVideoInfo, "f") || __classPrivateFieldGet(this, _MPDPlayer_videoPrefetcher, "f").getCurrentTarget();
        if (!nextVideo || prefetcherTarget?.id !== nextVideo.id) {
            await __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_clearPrefetch).call(this);
            if (nextVideo && __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")) {
                this.logger.debug(`[ytcr] Refreshing prefetcher (previous target -> current: ${prefetcherTarget?.id} -> ${nextVideo.id})`);
                const mpdStatus = await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.status.get();
                __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_checkAndStartPrefetch).call(this, mpdStatus);
            }
        }
    }
}, _MPDPlayer_checkAndStartPrefetch = function _MPDPlayer_checkAndStartPrefetch(mpdStatus) {
    if (!__classPrivateFieldGet(this, _MPDPlayer_videoPrefetcher, "f") || !__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f") || __classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").isLive) {
        return;
    }
    if (__classPrivateFieldGet(this, _MPDPlayer_prefetchedAndQueuedVideoInfo, "f") || __classPrivateFieldGet(this, _MPDPlayer_videoPrefetcher, "f").isPrefetching()) {
        return;
    }
    const timeRemaining = mpdStatus.duration - mpdStatus.elapsed;
    if (timeRemaining > 10) {
        const queueState = this.queue.getState();
        const nextVideo = queueState.next || queueState.autoplay;
        if (nextVideo) {
            __classPrivateFieldGet(this, _MPDPlayer_videoPrefetcher, "f").removeAllListeners('prefetch');
            __classPrivateFieldGet(this, _MPDPlayer_videoPrefetcher, "f").once('prefetch', __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_handlePrefetchedVideo).bind(this));
            __classPrivateFieldGet(this, _MPDPlayer_videoPrefetcher, "f").startPrefetchOnTimeout(nextVideo, timeRemaining - 10);
        }
    }
}, _MPDPlayer_cancelPrefetch = async function _MPDPlayer_cancelPrefetch(abortIfPrefetching = false, clearIfPrefetched = false) {
    if (!__classPrivateFieldGet(this, _MPDPlayer_videoPrefetcher, "f")) { // Prefetch disabled
        return;
    }
    this.logger.debug(`[ytcr] Cancelling prefetch (abortIfPrefetching: ${abortIfPrefetching}, clearIfPrefetched: ${clearIfPrefetched})`);
    if (!__classPrivateFieldGet(this, _MPDPlayer_videoPrefetcher, "f").isPrefetching() || abortIfPrefetching) {
        __classPrivateFieldGet(this, _MPDPlayer_videoPrefetcher, "f").abortPrefetch();
        __classPrivateFieldGet(this, _MPDPlayer_videoPrefetcher, "f").removeAllListeners('prefetch');
    }
    if (__classPrivateFieldGet(this, _MPDPlayer_prefetchedAndQueuedVideoInfo, "f")?.mpdSongId && __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f") && clearIfPrefetched) {
        try {
            await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.queue.deleteid(__classPrivateFieldGet(this, _MPDPlayer_prefetchedAndQueuedVideoInfo, "f").mpdSongId);
        }
        catch (error) {
            this.logger.error(`[ytcr] Failed to remove prefetched song from MPD queue (song Id ${__classPrivateFieldGet(this, _MPDPlayer_prefetchedAndQueuedVideoInfo, "f").mpdSongId}):`, error);
        }
        finally {
            __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_clearPrefetchedVideoExpiryTimer).call(this);
        }
    }
    if (clearIfPrefetched) {
        __classPrivateFieldSet(this, _MPDPlayer_prefetchedAndQueuedVideoInfo, null, "f");
    }
}, _MPDPlayer_clearPrefetch = function _MPDPlayer_clearPrefetch() {
    return __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_cancelPrefetch).call(this, true, true);
}, _MPDPlayer_clearPrefetchedVideoExpiryTimer = function _MPDPlayer_clearPrefetchedVideoExpiryTimer() {
    if (__classPrivateFieldGet(this, _MPDPlayer_prefetchedVideoExpiryTimer, "f")) {
        clearTimeout(__classPrivateFieldGet(this, _MPDPlayer_prefetchedVideoExpiryTimer, "f"));
        __classPrivateFieldSet(this, _MPDPlayer_prefetchedVideoExpiryTimer, null, "f");
    }
}, _MPDPlayer_handlePrefetchedVideo = async function _MPDPlayer_handlePrefetchedVideo(videoInfo) {
    if (__classPrivateFieldGet(this, _MPDPlayer_destroyed, "f") || !__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")) {
        return;
    }
    const queueState = this.queue.getState();
    const nextVideo = queueState.next || queueState.autoplay;
    if (nextVideo?.id === videoInfo.id) {
        if (videoInfo) {
            const songId = await __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_addToMPDQueue).call(this, videoInfo);
            if (songId) {
                __classPrivateFieldSet(this, _MPDPlayer_prefetchedAndQueuedVideoInfo, {
                    ...videoInfo,
                    mpdSongId: songId
                }, "f");
                this.logger.debug(`[ytcr] Prefetched video ${videoInfo.id} added to MPD queue with song Id: ${songId}`);
                if (videoInfo.streamExpires) {
                    const expiryMS = videoInfo.streamExpires.getTime() - Date.now();
                    if (expiryMS > 0) {
                        this.logger.debug(`[ytcr] Stream URL of prefetched video ${videoInfo.id} is going to expire in ${expiryMS / 1000}s`);
                        __classPrivateFieldSet(this, _MPDPlayer_prefetchedVideoExpiryTimer, setTimeout(async () => {
                            this.logger.debug(`[ytcr] Stream URL of prefetched video ${videoInfo.id} is about to expire.`);
                            if (__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")) {
                                this.logger.debug(`[ytcr] Removing it from MPD queue (song Id: ${songId})...`);
                                try {
                                    await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.queue.deleteid(songId);
                                }
                                catch (error) {
                                    this.logger.error(`[ytcr] Failed to remove expired prefetched song from MPD queue (song Id ${songId}):`, error);
                                }
                                finally {
                                    __classPrivateFieldSet(this, _MPDPlayer_prefetchedVideoExpiryTimer, null, "f");
                                }
                            }
                        }, expiryMS - 60000), "f");
                    }
                }
            }
            else {
                this.logger.debug(`[ytcr] Failed to add prefetched video ${videoInfo.id} to MPD queue: MPD did not return a song Id.`);
            }
        }
    }
    else {
        this.logger.debug(`[ytcr] Prefetched video Id ${videoInfo.id} does not match next in queue (${nextVideo?.id})`);
    }
}, _MPDPlayer_handleExternalMPDEvent = async function _MPDPlayer_handleExternalMPDEvent(event) {
    if (__classPrivateFieldGet(this, _MPDPlayer_asleep, "f") || __classPrivateFieldGet(this, _MPDPlayer_destroyed, "f") || !__classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f")) {
        return;
    }
    this.logger.debug(`[ytcr] MPDPlayer received external MPD event for subsystem: ${event.name}.`);
    const mpdStatus = await __classPrivateFieldGet(this, _MPDPlayer_mpdClient, "f").api.status.get();
    this.logger.debug('[ytcr] MPD status for subsystem event:', mpdStatus);
    // Prefetched video added to MPD queue and is now being played automatically by MPD when previous one has ended
    if (mpdStatus.state === 'play' && __classPrivateFieldGet(this, _MPDPlayer_prefetchedAndQueuedVideoInfo, "f") && mpdStatus.songid.toString() === __classPrivateFieldGet(this, _MPDPlayer_prefetchedAndQueuedVideoInfo, "f").mpdSongId) {
        this.logger.debug('[ytcr] Playback of prefetched video started');
        __classPrivateFieldSet(this, _MPDPlayer_currentVideoInfo, __classPrivateFieldGet(this, _MPDPlayer_prefetchedAndQueuedVideoInfo, "f"), "f");
        __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_clearPrefetchedVideoExpiryTimer).call(this);
        __classPrivateFieldSet(this, _MPDPlayer_prefetchedAndQueuedVideoInfo, null, "f");
        await this.queue.next();
        await this.notifyExternalStateChange(yt_cast_receiver_1.Constants.PLAYER_STATUSES.PLAYING);
        __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_checkAndStartPrefetch).call(this, mpdStatus);
        return;
    }
    if (!__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f") || (__classPrivateFieldGet(this, _MPDPlayer_currentVideoInfo, "f").mpdSongId !== mpdStatus.songid?.toString() && mpdStatus.state !== 'stop')) {
        this.logger.debug('[ytcr] MPD subsystem event does not match current song. Putting player to sleep...');
        await __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_clearPrefetch).call(this);
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
                await __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_cancelPrefetch).call(this);
                await this.notifyExternalStateChange(yt_cast_receiver_1.Constants.PLAYER_STATUSES.PAUSED);
                break;
            case 'stop':
                await __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_clearPrefetch).call(this);
                await this.notifyExternalStateChange(yt_cast_receiver_1.Constants.PLAYER_STATUSES.STOPPED);
                break;
            default:
                __classPrivateFieldGet(this, _MPDPlayer_instances, "m", _MPDPlayer_checkAndStartPrefetch).call(this, mpdStatus);
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
                await this.next();
            }
        }
    }
};
//# sourceMappingURL=MPDPlayer.js.map