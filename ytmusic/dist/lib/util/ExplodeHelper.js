"use strict";
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
const YTMusicContext_1 = __importDefault(require("../YTMusicContext"));
const ViewHelper_1 = __importDefault(require("../controller/browse/view-handlers/ViewHelper"));
const Endpoint_1 = require("../types/Endpoint");
const EndpointHelper_1 = __importDefault(require("./EndpointHelper"));
class ExplodeHelper {
    // Creates a bundle that contains the data needed by explode() to
    // Generate the final exploded item.
    static getExplodedTrackInfoFromMusicItem(data) {
        const result = {
            type: data.type,
            title: data.title,
            artist: data.artistText || '',
            album: data.album?.title || '',
            albumart: data.thumbnail || '',
            endpoint: data.endpoint // Watch endpoint
        };
        if (data.autoplayContext) {
            result.autoplayContext = data.autoplayContext;
        }
        return result;
    }
    static getExplodedTrackInfoFromUri(uri) {
        if (!uri) {
            return null;
        }
        const trackView = ViewHelper_1.default.getViewsFromUri(uri)[1];
        if (!trackView || (trackView.name !== 'video' && trackView.name !== 'song') ||
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
        if (view.noExplode) {
            return true;
        }
        /**
         * Pre-v1.0 URIs do not have
         */
        switch (view.name) {
            case 'video':
            case 'song':
                // ExplodeTrackData must be an object (pre-v1.0 is stringified)
                return view.explodeTrackData && typeof view.explodeTrackData === 'object';
            case 'playlist':
            case 'album':
                // Endpoints object must exist (pre-v1.0 is just albumId / playlistId)
                return view.endpoints && typeof view.endpoints === 'object';
            case 'generic':
                // Endpoint must be an object (pre-v1.0 is stringified)
                return view.endpoint && typeof view.endpoint === 'object';
            default:
                return false;
        }
    }
    /**
     * Converts a legacy URI (pre-v1.0) to one that current version can explode.
     * Legacy URI:
     * - song[@explodeTrackData=...]
     * - video[@explodeTrackData=...]
     * - album[@albumId=...]
     * - artist[@artistId=...]
     * - playlist[@playlistId=...]
     * - generic[@endpoint=...] (endpoint must be of type 'watch_playlist')
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
        // Conversion from pre-v1.0
        if ((view.name === 'video' && view.videoId) ||
            (view.name === 'song' && view.songId)) {
            let explodeTrackData;
            try {
                explodeTrackData = JSON.parse(decodeURIComponent(view.explodeTrackData));
            }
            catch (error) {
                explodeTrackData = view.explodeTrackData;
            }
            if (typeof explodeTrackData !== 'object') {
                YTMusicContext_1.default.getLogger().error('[ytmusic] Failed to obtain explodeTrackData from legacy URI');
                return null;
            }
            const { videoId, album, albumart, artist, title, playlistId, autoplayContext } = explodeTrackData;
            if (!videoId || !title || !playlistId) {
                YTMusicContext_1.default.getLogger().error('[ytmusic] Incomplete explodeTrackData from legacy URI');
                return null;
            }
            const endpoint = {
                type: Endpoint_1.EndpointType.Watch,
                payload: {
                    videoId,
                    playlistId
                }
            };
            const convertedExplodeTrackData = {
                type: view.name,
                title,
                album,
                artist,
                albumart,
                endpoint
            };
            if (autoplayContext?.playlistId) {
                const { playlistId, params, continuation, continueFromVideoId } = autoplayContext;
                let fetchEndpoint;
                if (continuation) {
                    fetchEndpoint = {
                        type: Endpoint_1.EndpointType.WatchContinuation,
                        payload: {
                            token: continuation,
                            playlistId
                        }
                    };
                }
                else {
                    fetchEndpoint = {
                        type: Endpoint_1.EndpointType.Watch,
                        payload: {
                            playlistId
                        }
                    };
                }
                if (params) {
                    fetchEndpoint.payload.params = params;
                }
                if (continueFromVideoId) {
                    fetchEndpoint.payload.videoId = continueFromVideoId;
                }
                convertedExplodeTrackData.autoplayContext = {
                    fetchEndpoint
                };
            }
            const musicItemView = {
                name: view.name,
                explodeTrackData: convertedExplodeTrackData
            };
            targetView = musicItemView;
        }
        else if (view.name === 'playlist' && view.playlistId) {
            let playlistId = decodeURIComponent(view.playlistId);
            if (playlistId.startsWith('VL')) {
                playlistId = playlistId.substring(2);
            }
            const genericView = {
                name: 'generic',
                endpoint: {
                    type: Endpoint_1.EndpointType.Watch,
                    payload: {
                        playlistId: decodeURIComponent(playlistId)
                    }
                }
            };
            targetView = genericView;
        }
        else if (view.name === 'album' && view.albumId) {
            const genericView = {
                name: 'generic',
                endpoint: {
                    type: Endpoint_1.EndpointType.Browse,
                    payload: {
                        browseId: decodeURIComponent(view.albumId)
                    }
                }
            };
            targetView = genericView;
        }
        else if (view.name === 'artist' && view.artistId) {
            const genericView = {
                name: 'generic',
                endpoint: {
                    type: Endpoint_1.EndpointType.Browse,
                    payload: {
                        browseId: decodeURIComponent(view.artistId)
                    }
                }
            };
            targetView = genericView;
        }
        else if (view.name === 'generic' && view.endpoint?.actionType === 'watchPlaylist') {
            const { playlistId, params, videoId } = view.endpoint.payload || {};
            if (playlistId) {
                const endpoint = {
                    type: Endpoint_1.EndpointType.Watch,
                    payload: {
                        playlistId
                    }
                };
                if (params) {
                    endpoint.payload.params = params;
                }
                if (videoId) {
                    endpoint.payload.videoId = videoId;
                }
                const genericView = {
                    name: 'generic',
                    endpoint
                };
                targetView = genericView;
            }
        }
        if (targetView) {
            return ViewHelper_1.default.constructUriFromViews([{ name: 'root' }, targetView]);
        }
        return null;
    }
    static createQueueItemFromExplodedTrackInfo(info) {
        return {
            'service': 'ytmusic',
            'uri': __classPrivateFieldGet(this, _a, "m", _ExplodeHelper_getUriFromExplodedTrackInfo).call(this, info),
            'albumart': info.albumart,
            'artist': info.artist,
            'album': info.album,
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
        name: info.type,
        explodeTrackData: info
    };
    return `ytmusic/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`;
};
//# sourceMappingURL=ExplodeHelper.js.map