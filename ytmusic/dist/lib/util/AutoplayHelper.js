"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _AutoplayHelper_getCommonPlaylistData;
Object.defineProperty(exports, "__esModule", { value: true });
const Endpoint_1 = require("../types/Endpoint");
class AutoplayHelper {
    static getAutoplayContext(data) {
        // SectionItem[]
        if (Array.isArray(data)) {
            const commonPlaylistData = __classPrivateFieldGet(this, _a, "m", _AutoplayHelper_getCommonPlaylistData).call(this, data);
            if (commonPlaylistData) {
                return {
                    fetchEndpoint: {
                        type: Endpoint_1.EndpointType.Watch,
                        payload: {
                            ...commonPlaylistData
                        }
                    }
                };
            }
            return null;
        }
        // Watch / Watch Continuation Content
        if (data.type === 'watch') {
            if (data.continuation) {
                return {
                    fetchEndpoint: data.continuation.endpoint
                };
            }
            if (!data.isContinuation && data.automix) {
                return {
                    fetchEndpoint: data.automix.endpoint
                };
            }
            return null;
        }
        // MusicItem
        if ((data.type === 'song' || data.type === 'video')) {
            return {
                fetchEndpoint: data.endpoint
            };
        }
        return null;
    }
}
exports.default = AutoplayHelper;
_a = AutoplayHelper, _AutoplayHelper_getCommonPlaylistData = function _AutoplayHelper_getCommonPlaylistData(items) {
    const hasOnlySongsAndVideos = items.length > 0 &&
        items.every((item) => item.type === 'song' || item.type === 'video');
    if (hasOnlySongsAndVideos) {
        const musicItems = items;
        const playlistId = musicItems[0].endpoint.payload.playlistId;
        const params = musicItems[0].endpoint.payload.params;
        if (playlistId) {
            const allFromSamePlaylist = musicItems.every((item) => item.endpoint.payload.playlistId === playlistId && item.endpoint.payload.params === params);
            if (allFromSamePlaylist) {
                return {
                    playlistId,
                    params,
                    videoId: musicItems[musicItems.length - 1].videoId
                };
            }
        }
    }
    return null;
};
//# sourceMappingURL=AutoplayHelper.js.map