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
const YouTube2Context_1 = __importDefault(require("../../YouTube2Context"));
const model_1 = __importStar(require("../../model"));
const Endpoint_1 = require("../../types/Endpoint");
const util_1 = require("../../util");
const ViewHelper_1 = __importDefault(require("../browse/view-handlers/ViewHelper"));
const ExplodeHelper_1 = __importDefault(require("../../util/ExplodeHelper"));
class PlayController {
    constructor() {
        _PlayController_instances.add(this);
        _PlayController_mpdPlugin.set(this, void 0);
        _PlayController_autoplayListener.set(this, void 0);
        _PlayController_lastPlaybackInfo.set(this, void 0);
        __classPrivateFieldSet(this, _PlayController_mpdPlugin, YouTube2Context_1.default.getMpdPlugin(), "f");
        __classPrivateFieldSet(this, _PlayController_autoplayListener, null, "f");
    }
    /**
     * Track uri:
     * - youtube2/video@endpoint={...}@explodeTrackData={...}
     *
     */
    async clearAddPlayTrack(track) {
        YouTube2Context_1.default.getLogger().info(`[youtube2-play] clearAddPlayTrack: ${track.uri}`);
        const { videoId, info: playbackInfo } = await __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getPlaybackInfoFromUri).call(this, track.uri);
        if (!playbackInfo) {
            throw Error(`Could not obtain playback info for videoId: ${videoId})`);
        }
        const stream = playbackInfo.stream;
        if (!stream?.url) {
            YouTube2Context_1.default.toast('error', YouTube2Context_1.default.getI18n('YOUTUBE2_ERR_NO_STREAM', track.name));
            throw Error(`Stream not found for videoId: ${videoId}`);
        }
        track.title = playbackInfo.title || track.title;
        track.name = playbackInfo.title || track.title;
        track.artist = playbackInfo.author?.name || track.artist;
        track.albumart = playbackInfo.thumbnail || track.albumart;
        track.duration = playbackInfo.isLive ? 0 : playbackInfo.duration;
        if (stream.bitrate) {
            track.samplerate = stream.bitrate;
        }
        __classPrivateFieldSet(this, _PlayController_lastPlaybackInfo, {
            track,
            position: YouTube2Context_1.default.getStateMachine().getState().position
        }, "f");
        const safeStreamUrl = stream.url.replace(/"/g, '\\"');
        await __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_doPlay).call(this, safeStreamUrl, track);
        if (YouTube2Context_1.default.getConfigValue('autoplay')) {
            __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_addAutoplayListener).call(this);
        }
        if (YouTube2Context_1.default.getConfigValue('addToHistory')) {
            try {
                playbackInfo.addToHistory();
            }
            catch (error) {
                YouTube2Context_1.default.getLogger().error(YouTube2Context_1.default.getErrorMessage(`[youtube2-play] Error: could not add to history (videoId: ${videoId}): `, error));
            }
        }
    }
    // Returns kew promise!
    stop() {
        __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_removeAutoplayListener).call(this);
        YouTube2Context_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").stop();
    }
    // Returns kew promise!
    pause() {
        YouTube2Context_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").pause();
    }
    // Returns kew promise!
    resume() {
        YouTube2Context_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").resume();
    }
    // Returns kew promise!
    seek(position) {
        YouTube2Context_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").seek(position);
    }
    // Returns kew promise!
    next() {
        YouTube2Context_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").next();
    }
    // Returns kew promise!
    previous() {
        YouTube2Context_1.default.getStateMachine().setConsumeUpdateService(undefined);
        return YouTube2Context_1.default.getStateMachine().previous();
    }
    async getGotoUri(type, uri) {
        if (type === 'album') {
            const playlistId = __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getExplodedTrackInfoFromUri).call(this, uri)?.endpoint?.payload?.playlistId;
            if (playlistId) {
                const targetView = {
                    name: 'generic',
                    endpoint: {
                        type: Endpoint_1.EndpointType.Browse,
                        payload: {
                            browseId: (!playlistId.startsWith('VL') ? 'VL' : '') + playlistId
                        }
                    }
                };
                return `youtube2/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`;
            }
        }
        else if (type === 'artist') {
            const videoId = __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getExplodedTrackInfoFromUri).call(this, uri)?.endpoint?.payload?.videoId;
            if (videoId) {
                const model = model_1.default.getInstance(model_1.ModelType.Video);
                const playbackInfo = await model.getPlaybackInfo(videoId);
                const channelId = playbackInfo?.author?.channelId;
                if (channelId) {
                    const targetView = {
                        name: 'generic',
                        endpoint: {
                            type: Endpoint_1.EndpointType.Browse,
                            payload: {
                                browseId: channelId
                            }
                        }
                    };
                    return `youtube2/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`;
                }
            }
        }
        return null;
    }
    async prefetch(track) {
        const prefetchEnabled = YouTube2Context_1.default.getConfigValue('prefetch');
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
            YouTube2Context_1.default.getLogger().info('[youtube2-play] Prefetch disabled');
            YouTube2Context_1.default.getStateMachine().prefetchDone = false;
            return;
        }
        let streamUrl;
        try {
            const { videoId, info: playbackInfo } = await __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getPlaybackInfoFromUri).call(this, track.uri);
            streamUrl = playbackInfo?.stream?.url;
            if (!streamUrl) {
                throw Error(`Stream not found for videoId '${videoId}'`);
            }
        }
        catch (error) {
            YouTube2Context_1.default.getLogger().error(`[youtube2-play] Prefetch failed: ${error}`);
            YouTube2Context_1.default.getStateMachine().prefetchDone = false;
            return;
        }
        const mpdPlugin = __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f");
        return (0, util_1.kewToJSPromise)(mpdPlugin.sendMpdCommand(`addid "${__classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_appendTrackTypeToStreamUrl).call(this, streamUrl)}"`, [])
            .then((addIdResp) => __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_mpdAddTags).call(this, addIdResp, track))
            .then(() => {
            YouTube2Context_1.default.getLogger().info(`[youtube2-play] Prefetched and added track to MPD queue: ${track.name}`);
            return mpdPlugin.sendMpdCommand('consume 1', []);
        }));
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
    if (!trackView || trackView.name !== 'video' ||
        trackView.explodeTrackData?.endpoint?.type !== Endpoint_1.EndpointType.Watch) {
        return null;
    }
    return trackView.explodeTrackData;
}, _PlayController_getPlaybackInfoFromUri = async function _PlayController_getPlaybackInfoFromUri(uri) {
    const watchEndpoint = __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getExplodedTrackInfoFromUri).call(this, uri)?.endpoint;
    const videoId = watchEndpoint?.payload?.videoId;
    if (!videoId) {
        throw Error(`Invalid track uri: ${uri}`);
    }
    const model = model_1.default.getInstance(model_1.ModelType.Video);
    return {
        videoId,
        info: await model.getPlaybackInfo(videoId)
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
        YouTube2Context_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
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
    const stateMachine = YouTube2Context_1.default.getStateMachine(), state = stateMachine.getState(), isLastTrack = stateMachine.getQueue().length - 1 === lastPlayedQueueIndex, currentPositionChanged = state.position !== lastPlayedQueueIndex; // True if client clicks on another item in the queue
    const noAutoplayConditions = !YouTube2Context_1.default.getConfigValue('autoplay') || currentPositionChanged || !isLastTrack || state.random || state.repeat || state.repeatSingle;
    const getAutoplayItemsPromise = noAutoplayConditions ? Promise.resolve(null) : __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getAutoplayItems).call(this);
    if (!noAutoplayConditions) {
        YouTube2Context_1.default.toast('info', YouTube2Context_1.default.getI18n('YOUTUBE2_AUTOPLAY_FETCH'));
    }
    const items = await getAutoplayItemsPromise;
    if (items && items.length > 0) {
        // Add items to queue and play
        const clearQueue = YouTube2Context_1.default.getConfigValue('autoplayClearQueue');
        if (clearQueue) {
            stateMachine.clearQueue();
        }
        stateMachine.addQueueItems(items).then((result) => {
            if (items.length > 1) {
                YouTube2Context_1.default.toast('success', YouTube2Context_1.default.getI18n('YOUTUBE2_AUTOPLAY_ADDED', items.length));
            }
            else {
                YouTube2Context_1.default.toast('success', YouTube2Context_1.default.getI18n('YOUTUBE2_AUTOPLAY_ADDED_SINGLE', items[0].title));
            }
            stateMachine.play(result.firstItemIndex);
        });
    }
    else if (!noAutoplayConditions) {
        YouTube2Context_1.default.toast('info', YouTube2Context_1.default.getI18n('YOUTUBE2_AUTOPLAY_NO_ITEMS'));
    }
}, _PlayController_findLastPlayedTrackQueueIndex = function _PlayController_findLastPlayedTrackQueueIndex() {
    if (!__classPrivateFieldGet(this, _PlayController_lastPlaybackInfo, "f")) {
        return -1;
    }
    const queue = YouTube2Context_1.default.getStateMachine().getQueue();
    const trackUri = __classPrivateFieldGet(this, _PlayController_lastPlaybackInfo, "f").track.uri;
    const endIndex = __classPrivateFieldGet(this, _PlayController_lastPlaybackInfo, "f").position;
    for (let i = endIndex; i >= 0; i--) {
        if (queue[i]?.uri === trackUri) {
            return i;
        }
    }
    return -1;
}, _PlayController_getAutoplayItems = async function _PlayController_getAutoplayItems() {
    const lastPlayedEndpoint = __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getExplodedTrackInfoFromUri).call(this, __classPrivateFieldGet(this, _PlayController_lastPlaybackInfo, "f")?.track?.uri)?.endpoint;
    const videoId = lastPlayedEndpoint?.payload?.videoId;
    if (!videoId) {
        return [];
    }
    YouTube2Context_1.default.getLogger().info(`[youtube2-play] Obtaining autoplay videos for ${videoId}`);
    const autoplayPayload = {
        videoId
    };
    if (lastPlayedEndpoint.payload.playlistId) {
        autoplayPayload.playlistId = lastPlayedEndpoint.payload.playlistId;
        if (lastPlayedEndpoint.payload.index) {
            autoplayPayload.playlistIndex = lastPlayedEndpoint.payload.index;
        }
    }
    if (lastPlayedEndpoint.payload.params) {
        autoplayPayload.params = lastPlayedEndpoint.payload.params;
    }
    const autoplayFetchEndpoint = {
        type: Endpoint_1.EndpointType.Watch,
        payload: autoplayPayload
    };
    const endpointModel = model_1.default.getInstance(model_1.ModelType.Endpoint);
    const contents = await endpointModel.getContents(autoplayFetchEndpoint);
    const autoplayItems = [];
    // Get from current playlist, if any.
    if (contents?.playlist) {
        const currentIndex = contents.playlist.currentIndex || 0;
        const itemsAfter = contents.playlist.items?.slice(currentIndex + 1).filter((item) => item.type === 'video') || [];
        const explodedTrackInfos = itemsAfter.map((item) => ExplodeHelper_1.default.getExplodedTrackInfoFromVideo(item));
        autoplayItems.push(...explodedTrackInfos);
        YouTube2Context_1.default.getLogger().info(`[youtube2-play] Obtained ${autoplayItems.length} videos for autoplay from current playlist`);
    }
    /**
     * If there are no items added, that means playlist doesn't exist or has
     * reached the end. From here, we obtain the autoplay video in the following
     * order of priority:
     *
     * 1. Videos in a Mix playlist that appears in the Related section
     * 2. Any video in Related section
     * 3. YouTube default
     *
     * (1 and 2 subject to plugin config)
     */
    const autoplayPrefMixRelated = YouTube2Context_1.default.getConfigValue('autoplayPrefMixRelated');
    const relatedItems = contents?.related?.items;
    // 1. Mix
    if (autoplayItems.length === 0 && relatedItems && autoplayPrefMixRelated) {
        const mixPlaylist = relatedItems.find((item) => item.type === 'playlist' && item.isMix);
        if (mixPlaylist?.endpoint && mixPlaylist.endpoint.type === Endpoint_1.EndpointType.Watch) {
            // Get videos in the Mix playlist
            const mixPlaylistContents = await endpointModel.getContents({ ...mixPlaylist.endpoint, type: mixPlaylist.endpoint.type });
            if (mixPlaylistContents?.playlist?.items) {
                const mixes = mixPlaylistContents.playlist.items.filter((item) => item.videoId !== videoId);
                autoplayItems.push(...mixes.map((item) => ExplodeHelper_1.default.getExplodedTrackInfoFromVideo(item)));
                YouTube2Context_1.default.getLogger().info(`[youtube2-play] Obtained ${autoplayItems.length} videos for autoplay from Mix playlist ${mixPlaylist.playlistId}`);
            }
        }
    }
    // 2. Related
    if (autoplayItems.length === 0 && relatedItems && autoplayPrefMixRelated) {
        const relatedVideos = relatedItems.filter((item) => item.type === 'video');
        if (relatedVideos) {
            autoplayItems.push(...relatedVideos.map((item) => ExplodeHelper_1.default.getExplodedTrackInfoFromVideo(item)));
            YouTube2Context_1.default.getLogger().info(`[youtube2-play] Obtained ${autoplayItems.length} related videos for autoplay`);
        }
    }
    // 3. YouTube default
    if (autoplayItems.length === 0 && contents?.autoplay?.payload?.videoId) {
        const videoModel = model_1.default.getInstance(model_1.ModelType.Video);
        // Contents.autoplay is just an endpoint, so we need to get video info (title, author...) from it
        const playbackInfo = await videoModel.getPlaybackInfo(contents.autoplay.payload.videoId);
        if (playbackInfo && playbackInfo.title && playbackInfo.author?.name) {
            autoplayItems.push({
                title: playbackInfo.title,
                artist: playbackInfo.author.name,
                albumart: playbackInfo.thumbnail,
                endpoint: contents.autoplay
            });
        }
        YouTube2Context_1.default.getLogger().info('[youtube2-play] Used YouTube default result for autoplay');
    }
    if (autoplayItems.length > 0) {
        return autoplayItems.map((item) => ExplodeHelper_1.default.createQueueItemFromExplodedTrackInfo(item));
    }
    return [];
};
//# sourceMappingURL=PlayController.js.map