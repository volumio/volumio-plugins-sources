"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _PlaylistModel_instances, _PlaylistModel_getPlaylistsFetchPromise, _PlaylistModel_convertFetchedPlaylistToEntity;
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../SoundCloudContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const soundcloud_fetch_1 = require("soundcloud-fetch");
const Mapper_1 = __importDefault(require("./Mapper"));
const TrackHelper_1 = __importDefault(require("../util/TrackHelper"));
class PlaylistModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _PlaylistModel_instances.add(this);
    }
    getPlaylists(params) {
        const getItems = (this.commonGetCollectionItemsFromLoopFetchResult);
        const getNextPageToken = (this.commonGetNextPageTokenFromLoopFetchResult);
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: __classPrivateFieldGet(this, _PlaylistModel_instances, "m", _PlaylistModel_getPlaylistsFetchPromise).bind(this),
            getItemsFromFetchResult: getItems.bind(this),
            getNextPageTokenFromFetchResult: getNextPageToken.bind(this),
            convertToEntity: __classPrivateFieldGet(this, _PlaylistModel_instances, "m", _PlaylistModel_convertFetchedPlaylistToEntity).bind(this),
            pageToken: params.pageToken,
            pageOffset: params.pageOffset,
            limit: params.limit
        });
    }
    async getPlaylist(playlistId, options = {}) {
        const cacheKeyParams = {
            playlistId,
            ...options
        };
        const info = await SoundCloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('playlist', cacheKeyParams), () => {
            if (options.type === 'system' && typeof playlistId === 'string') {
                return this.getSoundCloudAPI().getSystemPlaylist(playlistId);
            }
            else if (options.type !== 'system' && typeof playlistId === 'number') {
                return this.getSoundCloudAPI().getPlaylistOrAlbum(playlistId);
            }
            throw Error('Playlist ID has wrong type');
        });
        const playlist = info ? await Mapper_1.default.mapPlaylist(info) : null;
        if (options.loadTracks && playlist && info) {
            const offset = options.tracksOffset || 0;
            const limit = options.tracksLimit || undefined;
            const tracks = await info.getTracks({ offset, limit });
            playlist.tracks = await Promise.all(tracks.map((track) => Mapper_1.default.mapTrack(track)));
            TrackHelper_1.default.cacheTracks(playlist.tracks, this.getCacheKeyForFetch.bind(this, 'track'));
        }
        return playlist;
    }
}
exports.default = PlaylistModel;
_PlaylistModel_instances = new WeakSet(), _PlaylistModel_getPlaylistsFetchPromise = async function _PlaylistModel_getPlaylistsFetchPromise(params) {
    const api = this.getSoundCloudAPI();
    const continuationContents = await this.commonGetLoopFetchResultByPageToken(params);
    if (continuationContents) {
        return continuationContents;
    }
    const queryParams = {
        limit: soundcloud_fetch_1.Constants.QUERY_MAX_LIMIT
    };
    if (params.search) {
        const q = params.search;
        queryParams.type = 'playlist';
        const cacheKeyParams = {
            search: q,
            ...queryParams
        };
        return SoundCloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('playlists', cacheKeyParams), () => api.search(q, { ...queryParams, type: 'playlist' }));
    }
    else if (params.userId !== undefined) {
        const userId = params.userId;
        const cacheKeyParams = {
            userId,
            ...queryParams
        };
        return SoundCloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('playlists', cacheKeyParams), () => api.getPlaylistsByUser(userId, queryParams));
    }
    throw Error('Missing or invalid criteria for playlists');
}, _PlaylistModel_convertFetchedPlaylistToEntity = async function _PlaylistModel_convertFetchedPlaylistToEntity(item) {
    return Mapper_1.default.mapPlaylist(item);
};
//# sourceMappingURL=PlaylistModel.js.map