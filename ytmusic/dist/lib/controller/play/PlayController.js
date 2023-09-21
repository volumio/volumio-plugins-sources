"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var _PlayController_instances, _PlayController_mpdPlugin, _PlayController_autoplayListener, _PlayController_lastPlaybackInfo, _PlayController_addAutoplayListener, _PlayController_removeAutoplayListener, _PlayController_getExplodedTrackInfoFromUri, _PlayController_getPlaybackInfoFromUri, _PlayController_doPlay, _PlayController_appendTrackTypeToStreamUrl, _PlayController_mpdAddTags, _PlayController_handleAutoplay, _PlayController_findLastPlayedTrackQueueIndex, _PlayController_getAutoplayItems;
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const kew_1 = __importDefault(require("kew"));
const YTMusicContext_1 = __importDefault(require("../../YTMusicContext"));
const model_1 = __importStar(require("../../model"));
const Endpoint_1 = require("../../types/Endpoint");
const util_1 = require("../../util");
const ViewHelper_1 = __importDefault(require("../browse/view-handlers/ViewHelper"));
const ExplodeHelper_1 = __importDefault(require("../../util/ExplodeHelper"));
const AutoplayHelper_1 = __importDefault(require("../../util/AutoplayHelper"));
const EndpointHelper_1 = __importDefault(require("../../util/EndpointHelper"));
class PlayController {
    constructor() {
        _PlayController_instances.add(this);
        _PlayController_mpdPlugin.set(this, void 0);
        _PlayController_autoplayListener.set(this, void 0);
        _PlayController_lastPlaybackInfo.set(this, void 0);
        __classPrivateFieldSet(this, _PlayController_mpdPlugin, YTMusicContext_1.default.getMpdPlugin(), "f");
        __classPrivateFieldSet(this, _PlayController_autoplayListener, null, "f");
    }
    /**
     * Track uri:
     * - ytmusic/[song|video]@@explodeTrackData={...}
     *
     */
    async clearAddPlayTrack(track) {
        YTMusicContext_1.default.getLogger().info(`[ytmusic-play] clearAddPlayTrack: ${track.uri}`);
        const { videoId, info: playbackInfo } = await __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getPlaybackInfoFromUri).call(this, track.uri);
        if (!playbackInfo) {
            throw Error(`Could not obtain playback info for: ${videoId})`);
        }
        const stream = playbackInfo.stream;
        if (!stream?.url) {
            YTMusicContext_1.default.toast('error', YTMusicContext_1.default.getI18n('YTMUSIC_ERR_NO_STREAM', track.name));
            throw Error(`Stream not found for: ${videoId}`);
        }
        track.title = playbackInfo.title || track.title;
        track.name = playbackInfo.title || track.title;
        track.artist = playbackInfo.artist?.name || track.artist;
        track.album = playbackInfo.album?.title || track.album;
        track.albumart = playbackInfo.thumbnail || track.albumart;
        track.duration = playbackInfo.duration;
        if (stream.bitrate) {
            track.samplerate = stream.bitrate;
        }
        __classPrivateFieldSet(this, _PlayController_lastPlaybackInfo, {
            track,
            position: YTMusicContext_1.default.getStateMachine().getState().position
        }, "f");
        const safeStreamUrl = stream.url.replace(/"/g, '\\"');
        await __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_doPlay).call(this, safeStreamUrl, track);
        if (YTMusicContext_1.default.getConfigValue('autoplay')) {
            __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_addAutoplayListener).call(this);
        }
        if (YTMusicContext_1.default.getConfigValue('addToHistory')) {
            try {
                playbackInfo.addToHistory();
            }
            catch (error) {
                YTMusicContext_1.default.getLogger().error(YTMusicContext_1.default.getErrorMessage(`[ytmusic-play] Error: could not add to history (${videoId}): `, error));
            }
        }
    }
    // Returns kew promise!
    stop() {
        __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_removeAutoplayListener).call(this);
        YTMusicContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").stop();
    }
    // Returns kew promise!
    pause() {
        YTMusicContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").pause();
    }
    // Returns kew promise!
    resume() {
        YTMusicContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").resume();
    }
    // Returns kew promise!
    seek(position) {
        YTMusicContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").seek(position);
    }
    // Returns kew promise!
    next() {
        YTMusicContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").next();
    }
    // Returns kew promise!
    previous() {
        YTMusicContext_1.default.getStateMachine().setConsumeUpdateService(undefined);
        return YTMusicContext_1.default.getStateMachine().previous();
    }
    async prefetch(track) {
        const prefetchEnabled = YTMusicContext_1.default.getConfigValue('prefetch');
        if (!prefetchEnabled) {
            /**
             * Volumio doesn't check whether `prefetch()` is actually performed or
             * successful (such as inspecting the result of the function call) -
             * it just sets its internal state variable `prefetchDone`
             * to `true`. This results in the next track being skipped in cases
             * where prefetch is not performed or fails. So when we want to signal
             * that prefetch is not done, we would have to directly falsify the
             * statemachine's `prefetchDone` variable.
             */
            YTMusicContext_1.default.getLogger().info('[ytmusic-play] Prefetch disabled');
            YTMusicContext_1.default.getStateMachine().prefetchDone = false;
            return;
        }
        let streamUrl;
        try {
            const { videoId, info: playbackInfo } = await __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getPlaybackInfoFromUri).call(this, track.uri);
            streamUrl = playbackInfo?.stream?.url;
            if (!streamUrl) {
                throw Error(`Stream not found for: '${videoId}'`);
            }
        }
        catch (error) {
            YTMusicContext_1.default.getLogger().error(`[ytmusic-play] Prefetch failed: ${error}`);
            YTMusicContext_1.default.getStateMachine().prefetchDone = false;
            return;
        }
        const mpdPlugin = __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f");
        return (0, util_1.kewToJSPromise)(mpdPlugin.sendMpdCommand(`addid "${__classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_appendTrackTypeToStreamUrl).call(this, streamUrl)}"`, [])
            .then((addIdResp) => __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_mpdAddTags).call(this, addIdResp, track))
            .then(() => {
            YTMusicContext_1.default.getLogger().info(`[ytmusic-play] Prefetched and added track to MPD queue: ${track.name}`);
            return mpdPlugin.sendMpdCommand('consume 1', []);
        }));
    }
    async getGotoUri(type, uri) {
        const playbackInfo = (await __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getPlaybackInfoFromUri).call(this, uri))?.info;
        if (!playbackInfo) {
            return null;
        }
        if (type === 'album' && playbackInfo.album.albumId) {
            const targetView = {
                name: 'album',
                endpoints: {
                    browse: {
                        type: Endpoint_1.EndpointType.Browse,
                        payload: {
                            browseId: playbackInfo.album.albumId
                        }
                    },
                    // `watch` endpoint is actually not necessary in GoTo context, but required by AlbumView.
                    watch: {
                        type: Endpoint_1.EndpointType.Watch,
                        payload: {
                            playlistId: playbackInfo.album.albumId
                        }
                    }
                }
            };
            return `ytmusic/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`;
        }
        if (type === 'artist' && playbackInfo.artist.channelId) {
            const targetView = {
                name: 'generic',
                endpoint: {
                    type: Endpoint_1.EndpointType.Browse,
                    payload: {
                        browseId: playbackInfo.artist.channelId
                    }
                }
            };
            return `ytmusic/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`;
        }
        return null;
    }
}
exports.default = PlayController;
_PlayController_mpdPlugin = new WeakMap(), _PlayController_autoplayListener = new WeakMap(), _PlayController_lastPlaybackInfo = new WeakMap(), _PlayController_instances = new WeakSet(), _PlayController_addAutoplayListener = function _PlayController_addAutoplayListener() {
    if (!__classPrivateFieldGet(this, _PlayController_autoplayListener, "f")) {
        __classPrivateFieldSet(this, _PlayController_autoplayListener, () => {
            __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").getState().then((state) => {
                if (state.status === 'stop') {
                    __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_handleAutoplay).call(this);
                    __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_removeAutoplayListener).call(this);
                }
            });
        }, "f");
        __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").clientMpd.on('system-player', __classPrivateFieldGet(this, _PlayController_autoplayListener, "f"));
    }
}, _PlayController_removeAutoplayListener = function _PlayController_removeAutoplayListener() {
    if (__classPrivateFieldGet(this, _PlayController_autoplayListener, "f")) {
        __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").clientMpd.removeListener('system-player', __classPrivateFieldGet(this, _PlayController_autoplayListener, "f"));
        __classPrivateFieldSet(this, _PlayController_autoplayListener, null, "f");
    }
}, _PlayController_getExplodedTrackInfoFromUri = function _PlayController_getExplodedTrackInfoFromUri(uri) {
    if (!uri) {
        return null;
    }
    const trackView = ViewHelper_1.default.getViewsFromUri(uri)[1];
    if (!trackView || (trackView.name !== 'video' && trackView.name !== 'song') ||
        !EndpointHelper_1.default.isType(trackView.explodeTrackData?.endpoint, Endpoint_1.EndpointType.Watch)) {
        return null;
    }
    return trackView.explodeTrackData;
}, _PlayController_getPlaybackInfoFromUri = async function _PlayController_getPlaybackInfoFromUri(uri) {
    const endpoint = __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getExplodedTrackInfoFromUri).call(this, uri)?.endpoint;
    const videoId = endpoint?.payload?.videoId;
    if (!videoId) {
        throw Error(`Invalid track uri: ${uri}`);
    }
    const model = model_1.default.getInstance(model_1.ModelType.MusicItem);
    return {
        videoId,
        info: await model.getPlaybackInfo(endpoint)
    };
}, _PlayController_doPlay = function _PlayController_doPlay(streamUrl, track) {
    const mpdPlugin = __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f");
    return (0, util_1.kewToJSPromise)(mpdPlugin.sendMpdCommand('stop', [])
        .then(() => {
        return mpdPlugin.sendMpdCommand('clear', []);
    })
        .then(() => {
        return mpdPlugin.sendMpdCommand(`addid "${__classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_appendTrackTypeToStreamUrl).call(this, streamUrl)}"`, []);
    })
        .then((addIdResp) => __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_mpdAddTags).call(this, addIdResp, track))
        .then(() => {
        YTMusicContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return mpdPlugin.sendMpdCommand('play', []);
    }));
}, _PlayController_appendTrackTypeToStreamUrl = function _PlayController_appendTrackTypeToStreamUrl(url) {
    /**
     * Fool MPD plugin to return correct `trackType` in `parseTrackInfo()` by adding
     * track type to URL query string as a dummy param.
     */
    return `${url}&t.YouTube`;
}, _PlayController_mpdAddTags = function _PlayController_mpdAddTags(mpdAddIdResponse, track) {
    const songId = mpdAddIdResponse?.Id;
    if (songId !== undefined) {
        const cmds = [];
        cmds.push({
            command: 'addtagid',
            parameters: [songId, 'title', track.title]
        });
        if (track.album) {
            cmds.push({
                command: 'addtagid',
                parameters: [songId, 'album', track.album]
            });
        }
        cmds.push({
            command: 'addtagid',
            parameters: [songId, 'artist', track.artist]
        });
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").sendMpdCommandArray(cmds);
    }
    return kew_1.default.resolve();
}, _PlayController_handleAutoplay = async function _PlayController_handleAutoplay() {
    const lastPlayedQueueIndex = __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_findLastPlayedTrackQueueIndex).call(this);
    if (lastPlayedQueueIndex < 0) {
        return;
    }
    const stateMachine = YTMusicContext_1.default.getStateMachine(), state = stateMachine.getState(), isLastTrack = stateMachine.getQueue().length - 1 === lastPlayedQueueIndex, currentPositionChanged = state.position !== lastPlayedQueueIndex; // True if client clicks on another item in the queue
    const noAutoplayConditions = !YTMusicContext_1.default.getConfigValue('autoplay') || currentPositionChanged || !isLastTrack || state.random || state.repeat || state.repeatSingle;
    const getAutoplayItemsPromise = noAutoplayConditions ? Promise.resolve(null) : __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getAutoplayItems).call(this);
    if (!noAutoplayConditions) {
        YTMusicContext_1.default.toast('info', YTMusicContext_1.default.getI18n('YTMUSIC_AUTOPLAY_FETCH'));
    }
    const items = await getAutoplayItemsPromise;
    if (items && items.length > 0) {
        // Add items to queue and play
        const clearQueue = YTMusicContext_1.default.getConfigValue('autoplayClearQueue');
        if (clearQueue) {
            stateMachine.clearQueue();
        }
        stateMachine.addQueueItems(items).then((result) => {
            if (items.length > 1) {
                YTMusicContext_1.default.toast('success', YTMusicContext_1.default.getI18n('YTMUSIC_AUTOPLAY_ADDED', items.length));
            }
            else {
                YTMusicContext_1.default.toast('success', YTMusicContext_1.default.getI18n('YTMUSIC_AUTOPLAY_ADDED_SINGLE', items[0].title));
            }
            stateMachine.play(result.firstItemIndex);
        });
    }
    else if (!noAutoplayConditions) {
        YTMusicContext_1.default.toast('info', YTMusicContext_1.default.getI18n('YTMUSIC_AUTOPLAY_NO_ITEMS'));
    }
}, _PlayController_findLastPlayedTrackQueueIndex = function _PlayController_findLastPlayedTrackQueueIndex() {
    if (!__classPrivateFieldGet(this, _PlayController_lastPlaybackInfo, "f")) {
        return -1;
    }
    const queue = YTMusicContext_1.default.getStateMachine().getQueue();
    const trackUri = __classPrivateFieldGet(this, _PlayController_lastPlaybackInfo, "f").track.uri;
    const endIndex = __classPrivateFieldGet(this, _PlayController_lastPlaybackInfo, "f").position;
    for (let i = endIndex; i >= 0; i--) {
        if (queue[i]?.uri === trackUri) {
            return i;
        }
    }
    return -1;
}, _PlayController_getAutoplayItems = async function _PlayController_getAutoplayItems() {
    const explodedTrackInfo = __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getExplodedTrackInfoFromUri).call(this, __classPrivateFieldGet(this, _PlayController_lastPlaybackInfo, "f")?.track?.uri);
    const autoplayContext = explodedTrackInfo?.autoplayContext;
    if (autoplayContext) {
        YTMusicContext_1.default.getLogger().info(`[ytmusic-play] Obtaining autoplay videos from endpoint: ${JSON.stringify(autoplayContext.fetchEndpoint)}`);
    }
    else {
        YTMusicContext_1.default.getLogger().info('[ytmusic-play] No autoplay context provided');
    }
    const endpointModel = model_1.default.getInstance(model_1.ModelType.Endpoint);
    const contents = autoplayContext ? await endpointModel.getContents(autoplayContext.fetchEndpoint) : null;
    const autoplayItems = [];
    let newAutoplayContext = null;
    if (contents) {
        let items;
        if (contents.isContinuation) { // WatchContinuationContent
            items = contents.items;
        }
        else { // WatchContent
            items = contents.playlist?.items;
        }
        if (items) {
            const continueFromVideoId = autoplayContext?.fetchEndpoint.payload.videoId;
            let currentIndex = 0;
            if (continueFromVideoId) {
                currentIndex = items?.findIndex((item) => item.videoId === continueFromVideoId) || 0;
            }
            if (currentIndex < 0) {
                currentIndex = 0;
            }
            const itemsAfter = items?.slice(currentIndex + 1).filter((item) => item.type === 'video' || item.type === 'song') || [];
            autoplayItems.push(...itemsAfter);
            YTMusicContext_1.default.getLogger().info(`[ytmusic-play] Obtained ${itemsAfter.length} items for autoplay from current playlist`);
            if (itemsAfter.length > 0) {
                newAutoplayContext = AutoplayHelper_1.default.getAutoplayContext(contents);
            }
        }
        if (autoplayItems.length <= 5 && !contents.isContinuation && contents.automix) {
            const automixContents = await endpointModel.getContents(contents.automix.endpoint);
            const items = automixContents?.playlist?.items;
            if (items) {
                autoplayItems.push(...items);
                YTMusicContext_1.default.getLogger().info(`[ytmusic-play] Obtained ${items.length} items for autoplay from automix`);
                if (items.length > 0) {
                    newAutoplayContext = AutoplayHelper_1.default.getAutoplayContext(automixContents);
                }
            }
        }
    }
    if (autoplayItems.length === 0) {
        // Fetch from radio endpoint as last resort.
        const playbackInfo = await __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getPlaybackInfoFromUri).call(this, __classPrivateFieldGet(this, _PlayController_lastPlaybackInfo, "f").track.uri);
        const radioEndpoint = playbackInfo.info?.radioEndpoint;
        if (radioEndpoint && (!autoplayContext || radioEndpoint.payload.playlistId !== autoplayContext.fetchEndpoint.payload.playlistId)) {
            const radioContents = await endpointModel.getContents(radioEndpoint);
            const items = radioContents?.playlist?.items;
            if (items) {
                const currentIndex = items.findIndex((item) => item.videoId === playbackInfo.videoId) || 0;
                const itemsAfter = items.slice(currentIndex + 1).filter((item) => item.type === 'video' || item.type === 'song') || [];
                autoplayItems.push(...itemsAfter);
                YTMusicContext_1.default.getLogger().info(`[ytmusic-play] Obtained ${itemsAfter.length} items for autoplay from radio`);
                if (items.length > 0) {
                    newAutoplayContext = AutoplayHelper_1.default.getAutoplayContext(radioContents);
                }
            }
        }
    }
    if (newAutoplayContext) {
        for (const item of autoplayItems) {
            item.autoplayContext = newAutoplayContext;
        }
    }
    return autoplayItems
        .map((item) => ExplodeHelper_1.default.getExplodedTrackInfoFromMusicItem(item))
        .map((item) => ExplodeHelper_1.default.createQueueItemFromExplodedTrackInfo(item));
};
//# sourceMappingURL=PlayController.js.map