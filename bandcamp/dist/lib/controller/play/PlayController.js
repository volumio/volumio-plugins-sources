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
var _PlayController_instances, _PlayController_mpdPlugin, _PlayController_getStreamUrl, _PlayController_doPlay, _PlayController_mpdAddTags;
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const kew_1 = __importDefault(require("kew"));
const BandcampContext_1 = __importDefault(require("../../BandcampContext"));
const ViewHelper_1 = __importDefault(require("../browse/view-handlers/ViewHelper"));
const model_1 = __importStar(require("../../model"));
const util_1 = require("../../util");
class PlayController {
    constructor() {
        _PlayController_instances.add(this);
        _PlayController_mpdPlugin.set(this, void 0);
        __classPrivateFieldSet(this, _PlayController_mpdPlugin, BandcampContext_1.default.getMpdPlugin(), "f");
    }
    /**
     * Track uri:
     * - bandcamp/track@trackUrl={trackUrl}@artistUrl={...}@albumUrl={...}
     * - bandcamp/show@showUrl={showUrl}
     * - bandcamp/article@articleUrl={articleUrl}@mediaItemRef={...}@track={trackPosition}@artistUrl={...}@albumUrl={...}
     * - bandcamp/album@albumUrl={...}@track={...}@artistUrl={...}@albumUrl={...}
     */
    async clearAddPlayTrack(track) {
        BandcampContext_1.default.getLogger().info(`[bandcamp-play] clearAddPlayTrack: ${track.uri}`);
        let streamUrl;
        try {
            streamUrl = await __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getStreamUrl).call(this, track);
        }
        catch (error) {
            BandcampContext_1.default.getLogger().error(`[bandcamp-play] Error getting stream: ${error}`);
            throw error;
        }
        return __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_doPlay).call(this, streamUrl, track);
    }
    // Returns kew promise!
    stop() {
        BandcampContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").stop();
    }
    // Returns kew promise!
    pause() {
        BandcampContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").pause();
    }
    // Returns kew promise!
    resume() {
        BandcampContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").resume();
    }
    // Returns kew promise!
    seek(position) {
        BandcampContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").seek(position);
    }
    // Returns kew promise!
    next() {
        BandcampContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").next();
    }
    // Returns kew promise!
    previous() {
        BandcampContext_1.default.getStateMachine().setConsumeUpdateService(undefined);
        return BandcampContext_1.default.getStateMachine().previous();
    }
    async prefetch(track) {
        const prefetchEnabled = BandcampContext_1.default.getConfigValue('prefetch', true);
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
            BandcampContext_1.default.getLogger().info('[bandcamp-play] Prefetch disabled');
            BandcampContext_1.default.getStateMachine().prefetchDone = false;
            return;
        }
        let streamUrl;
        try {
            streamUrl = await __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getStreamUrl).call(this, track, true);
        }
        catch (error) {
            BandcampContext_1.default.getLogger().error(`[bandcamp] Prefetch failed: ${error}`);
            BandcampContext_1.default.getStateMachine().prefetchDone = false;
            return;
        }
        const mpdPlugin = __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f");
        return (0, util_1.kewToJSPromise)(mpdPlugin.sendMpdCommand(`addid "${streamUrl}"`, [])
            .then((addIdResp) => __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_mpdAddTags).call(this, addIdResp, track))
            .then(() => {
            BandcampContext_1.default.getLogger().info(`[bandcamp-play] Prefetched and added track to MPD queue: ${track.name}`);
            return mpdPlugin.sendMpdCommand('consume 1', []);
        }));
    }
}
exports.default = PlayController;
_PlayController_mpdPlugin = new WeakMap(), _PlayController_instances = new WeakSet(), _PlayController_getStreamUrl = async function _PlayController_getStreamUrl(track, isPrefetching = false) {
    const _toast = (type, msg) => {
        if (!isPrefetching) {
            BandcampContext_1.default.toast(type, msg);
        }
    };
    const views = ViewHelper_1.default.getViewsFromUri(track.uri);
    let trackView = views[1];
    if (!trackView) {
        trackView = { name: '' };
    }
    if (trackView.name === 'track') {
        const { trackUrl } = trackView;
        if (!trackUrl) {
            _toast('error', BandcampContext_1.default.getI18n('BANDCAMP_ERR_INVALID_PLAY_REQUEST'));
            throw Error('Track URL not specified');
        }
        const model = model_1.default.getInstance(model_1.ModelType.Track);
        const trackInfo = await model.getTrack(trackUrl);
        if (!trackInfo.streamUrl) {
            _toast('warning', BandcampContext_1.default.getI18n('BANDCAMP_SKIP_NON_PLAYABLE_TRACK', trackInfo.name));
            if (!isPrefetching) {
                BandcampContext_1.default.getStateMachine().next();
            }
            throw Error('Skipping non-playable track');
        }
        else {
            const safeUri = trackInfo.streamUrl.replace(/"/g, '\\"');
            return safeUri;
        }
    }
    else if (trackView.name === 'show') {
        const { showUrl } = trackView;
        if (!showUrl) {
            _toast('error', BandcampContext_1.default.getI18n('BANDCAMP_ERR_INVALID_PLAY_REQUEST'));
            throw Error('Show URL not specified');
        }
        const model = model_1.default.getInstance(model_1.ModelType.Show);
        const showInfo = await model.getShow(showUrl);
        const streamUrl = showInfo.streamUrl;
        if (!streamUrl) {
            _toast('error', BandcampContext_1.default.getI18n('BANDCAMP_ERR_STREAM_NOT_FOUND', showInfo.name));
            throw Error(`Stream not found for show URL: ${showUrl}`);
        }
        const safeUri = streamUrl.replace(/"/g, '\\"');
        return safeUri;
    }
    else if (trackView.name === 'article') {
        const { articleUrl, mediaItemRef, track: trackPosition } = trackView;
        if (!articleUrl || !mediaItemRef) {
            _toast('error', BandcampContext_1.default.getI18n('BANDCAMP_ERR_INVALID_PLAY_REQUEST'));
            throw Error('Article URL, mediaItemRef or track position not specified');
        }
        const model = model_1.default.getInstance(model_1.ModelType.Article);
        const article = await model.getArticle(articleUrl);
        const mediaItem = article.mediaItems?.find((mi) => mi.mediaItemRef === mediaItemRef);
        if (!mediaItem) {
            _toast('error', BandcampContext_1.default.getI18n('BANDCAMP_ERR_STREAM_NOT_FOUND', track.name));
            throw Error(`Target mediaItemRef '${mediaItemRef}' not found for article URL: ${articleUrl}`);
        }
        let matchedTrack;
        if (mediaItem.type === 'album') {
            if (!trackPosition) {
                _toast('error', BandcampContext_1.default.getI18n('BANDCAMP_ERR_INVALID_PLAY_REQUEST'));
                throw Error(`Track position not specified for mediaItemRef '${mediaItemRef}' (article URL: ${articleUrl})`);
            }
            matchedTrack = mediaItem.tracks?.find((tr) => tr.position?.toString() === trackPosition);
            if (!matchedTrack) {
                _toast('error', BandcampContext_1.default.getI18n('BANDCAMP_ERR_STREAM_NOT_FOUND', track.name));
                throw Error(`No track at position ${trackPosition} for mediaItemRef '${mediaItemRef}' (article URL: ${articleUrl})`);
            }
        }
        else {
            matchedTrack = mediaItem;
        }
        if (matchedTrack.streamUrl) {
            const safeUri = matchedTrack.streamUrl.replace(/"/g, '\\"');
            return safeUri;
        }
        _toast('error', BandcampContext_1.default.getI18n('BANDCAMP_ERR_STREAM_NOT_FOUND', matchedTrack.name));
        throw Error(`Stream URL missing for track matching ${trackPosition ? `${trackPosition}@` : ''}${mediaItemRef} (article URL: ${articleUrl})`);
    }
    else if (trackView.name === 'album') {
        const { albumUrl, track: trackPosition } = trackView;
        if (!albumUrl || !trackPosition) {
            throw Error('Album URL or track position not specified');
        }
        const model = model_1.default.getInstance(model_1.ModelType.Album);
        const album = await model.getAlbum(albumUrl);
        const albumTrack = album.tracks?.[parseInt(trackPosition, 10) - 1];
        if (albumTrack?.streamUrl) {
            const safeUri = albumTrack.streamUrl.replace(/"/g, '\\"');
            return safeUri;
        }
        _toast('error', BandcampContext_1.default.getI18n('BANDCAMP_ERR_STREAM_NOT_FOUND', albumTrack?.name || track.name));
        throw Error(`Track or stream URL missing at position ${trackPosition} for album URL: ${albumUrl}`);
    }
    _toast('error', BandcampContext_1.default.getI18n('BANDCAMP_ERR_INVALID_PLAY_REQUEST'));
    throw Error(`Invalid track URI: ${track.uri}`);
}, _PlayController_doPlay = function _PlayController_doPlay(streamUrl, track) {
    const mpdPlugin = __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f");
    return mpdPlugin.sendMpdCommand('stop', [])
        .then(() => {
        return mpdPlugin.sendMpdCommand('clear', []);
    })
        .then(() => {
        return mpdPlugin.sendMpdCommand(`addid "${streamUrl}"`, []);
    })
        .then((addIdResp) => __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_mpdAddTags).call(this, addIdResp, track))
        .then(() => {
        BandcampContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return mpdPlugin.sendMpdCommand('play', []);
    });
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
};
//# sourceMappingURL=PlayController.js.map