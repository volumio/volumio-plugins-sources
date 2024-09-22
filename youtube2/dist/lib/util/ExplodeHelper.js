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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _ExplodeHelper_getUriFromExplodedTrackInfo;
Object.defineProperty(exports, "__esModule", { value: true });
const YouTube2Context_1 = __importDefault(require("../YouTube2Context"));
const ViewHelper_1 = __importDefault(require("../controller/browse/view-handlers/ViewHelper"));
const model_1 = __importStar(require("../model"));
const Endpoint_1 = require("../types/Endpoint");
const EndpointHelper_1 = __importDefault(require("./EndpointHelper"));
class ExplodeHelper {
    // Creates a bundle that contains the data needed by explode() to
    // Generate the final exploded item.
    static getExplodedTrackInfoFromVideo(data) {
        return {
            title: data.title,
            artist: data.author?.name || data.viewCount || '',
            albumart: data.thumbnail || '',
            endpoint: data.endpoint
        };
    }
    static getExplodedTrackInfoFromUri(uri) {
        if (!uri) {
            return null;
        }
        const trackView = ViewHelper_1.default.getViewsFromUri(uri)[1];
        if (!trackView || trackView.name !== 'video' ||
            !EndpointHelper_1.default.isType(trackView.explodeTrackData?.endpoint, Endpoint_1.EndpointType.Watch)) {
            return null;
        }
        return trackView.explodeTrackData;
    }
    static validateExplodeUri(uri) {
        // Current view
        const view = ViewHelper_1.default.getViewsFromUri(uri).pop();
        if (!view) {
            return false;
        }
        /**
         * Pre v1.0: required param does not exist
         * v1.0.x: required param is not an object (because it is not converted when
         *           constructing View from URI)
         */
        switch (view.name) {
            case 'video':
                return view.explodeTrackData && typeof view.explodeTrackData === 'object';
            case 'playlist':
                return (view.endpoint && typeof view.endpoint === 'object') ||
                    (view.endpoints && typeof view.endpoints === 'object');
            case 'generic':
                return view.endpoint && typeof view.endpoint === 'object';
            default:
                return false;
        }
    }
    /**
     * Converts a legacy URI (pre v1.1) to one that current version can explode.
     * @param {*} uri
     * @returns Converted URI or `null` on failure
     */
    static async convertLegacyExplodeUri(uri) {
        // Current view
        const view = ViewHelper_1.default.getViewsFromUri(uri).pop();
        if (!view) {
            return null;
        }
        let targetView = null;
        // Conversion from pre v1.0
        if (view.name === 'video' && view.videoId) {
            const model = model_1.default.getInstance(model_1.ModelType.Video);
            const playbackInfo = await model.getPlaybackInfo(view.videoId);
            const videoInfo = { ...playbackInfo };
            if (playbackInfo) {
                videoInfo.endpoint = {
                    type: 'watch',
                    payload: {
                        videoId: view.videoId
                    }
                };
                if (view.fromPlaylistId) {
                    videoInfo.endpoint.playlistId = view.fromPlaylistId;
                }
                targetView = {
                    name: 'video',
                    explodeTrackData: this.getExplodedTrackInfoFromVideo(videoInfo)
                };
            }
        }
        else if (view.name === 'videos' && view.playlistId) {
            targetView = {
                name: 'generic',
                endpoint: {
                    type: Endpoint_1.EndpointType.Watch,
                    payload: {
                        playlistId: view.playlistId
                    }
                }
            };
        }
        else if (view.name === 'playlists' && view.channelId) {
            targetView = {
                name: 'generic',
                endpoint: {
                    type: Endpoint_1.EndpointType.Browse,
                    payload: {
                        browseId: view.channelId
                    }
                }
            };
        }
        // Conversion from v1.0.x
        else if (view.name === 'video' && view.explodeTrackData && typeof view.explodeTrackData !== 'object') {
            targetView = {
                name: 'video',
                explodeTrackData: JSON.parse(view.explodeTrackData)
            };
        }
        else if (view.name === 'generic' && view.endpoint && typeof view.endpoint !== 'object') {
            targetView = {
                name: 'generic',
                endpoint: JSON.parse(view.endpoint)
            };
        }
        if (targetView) {
            return ViewHelper_1.default.constructUriFromViews([{ name: 'root' }, targetView]);
        }
        return null;
    }
    static createQueueItemFromExplodedTrackInfo(info) {
        return {
            'service': 'youtube2',
            'uri': __classPrivateFieldGet(this, _a, "m", _ExplodeHelper_getUriFromExplodedTrackInfo).call(this, info),
            'albumart': info.albumart,
            'artist': info.artist,
            'album': YouTube2Context_1.default.getI18n('YOUTUBE2_TITLE'),
            'name': info.title,
            'title': info.title
        };
    }
}
exports.default = ExplodeHelper;
_a = ExplodeHelper, _ExplodeHelper_getUriFromExplodedTrackInfo = function _ExplodeHelper_getUriFromExplodedTrackInfo(info) {
    /**
     * `explodeTrackData` - necessary because Volumio adds track uri in
     * its own playlist / favorites / Last 100, and explodes them again when
     * played.
     */
    const targetView = {
        name: 'video',
        endpoint: info.endpoint,
        explodeTrackData: info
    };
    return `youtube2/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`;
};
//# sourceMappingURL=ExplodeHelper.js.map