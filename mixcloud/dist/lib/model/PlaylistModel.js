"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _PlaylistModel_instances, _PlaylistModel_getPlaylistsFetchPromise, _PlaylistModel_getPlaylistsFromFetchResult, _PlaylistModel_convertFetchedPlaylistToEntity;
Object.defineProperty(exports, "__esModule", { value: true });
const mixcloud_fetch_1 = __importDefault(require("mixcloud-fetch"));
const MixcloudContext_1 = __importDefault(require("../MixcloudContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const EntityConverter_1 = __importDefault(require("../util/EntityConverter"));
class PlaylistModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _PlaylistModel_instances.add(this);
    }
    getPlaylists(params) {
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: __classPrivateFieldGet(this, _PlaylistModel_instances, "m", _PlaylistModel_getPlaylistsFetchPromise).bind(this),
            getItemsFromFetchResult: __classPrivateFieldGet(this, _PlaylistModel_instances, "m", _PlaylistModel_getPlaylistsFromFetchResult).bind(this),
            convertToEntity: __classPrivateFieldGet(this, _PlaylistModel_instances, "m", _PlaylistModel_convertFetchedPlaylistToEntity).bind(this)
        });
    }
    getPlaylist(playlistId) {
        return MixcloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('playlist', { playlistId }), async () => {
            const data = await mixcloud_fetch_1.default.playlist(playlistId).getInfo();
            return data ? __classPrivateFieldGet(this, _PlaylistModel_instances, "m", _PlaylistModel_convertFetchedPlaylistToEntity).call(this, data) : null;
        });
    }
}
_PlaylistModel_instances = new WeakSet(), _PlaylistModel_getPlaylistsFetchPromise = function _PlaylistModel_getPlaylistsFetchPromise(params) {
    return MixcloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('playlists', { username: params.username }), () => mixcloud_fetch_1.default.user(params.username).getPlaylists());
}, _PlaylistModel_getPlaylistsFromFetchResult = function _PlaylistModel_getPlaylistsFromFetchResult(result) {
    return result ? result.items.slice(0) : [];
}, _PlaylistModel_convertFetchedPlaylistToEntity = function _PlaylistModel_convertFetchedPlaylistToEntity(item) {
    return EntityConverter_1.default.convertPlaylist(item);
};
exports.default = PlaylistModel;
//# sourceMappingURL=PlaylistModel.js.map