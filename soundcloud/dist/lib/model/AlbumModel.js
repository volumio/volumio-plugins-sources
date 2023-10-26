"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _AlbumModel_instances, _AlbumModel_getAlbumsFetchPromise, _AlbumModel_convertFetchedAlbumToEntity;
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../SoundCloudContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const soundcloud_fetch_1 = require("soundcloud-fetch");
const Mapper_1 = __importDefault(require("./Mapper"));
const TrackHelper_1 = __importDefault(require("../util/TrackHelper"));
class AlbumModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _AlbumModel_instances.add(this);
    }
    getAlbums(params) {
        const getItems = (this.commonGetCollectionItemsFromLoopFetchResult);
        const getNextPageToken = (this.commonGetNextPageTokenFromLoopFetchResult);
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: __classPrivateFieldGet(this, _AlbumModel_instances, "m", _AlbumModel_getAlbumsFetchPromise).bind(this),
            getItemsFromFetchResult: getItems.bind(this),
            getNextPageTokenFromFetchResult: getNextPageToken.bind(this),
            convertToEntity: __classPrivateFieldGet(this, _AlbumModel_instances, "m", _AlbumModel_convertFetchedAlbumToEntity).bind(this),
            pageToken: params.pageToken,
            pageOffset: params.pageOffset,
            limit: params.limit
        });
    }
    async getAlbum(albumId, options = {}) {
        const cacheKeyParams = {
            albumId,
            ...options
        };
        const info = await SoundCloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('album', cacheKeyParams), () => this.getSoundCloudAPI().getPlaylistOrAlbum(albumId));
        const album = info && info instanceof soundcloud_fetch_1.Album ? await Mapper_1.default.mapAlbum(info) : null;
        if (options.loadTracks && album && info) {
            const offset = options.tracksOffset || 0;
            const limit = options.tracksLimit || undefined;
            const tracks = await info.getTracks({ offset, limit });
            album.tracks = await Promise.all(tracks.map((track) => Mapper_1.default.mapTrack(track)));
            TrackHelper_1.default.cacheTracks(album.tracks, this.getCacheKeyForFetch.bind(this, 'track'));
        }
        return album;
    }
}
exports.default = AlbumModel;
_AlbumModel_instances = new WeakSet(), _AlbumModel_getAlbumsFetchPromise = async function _AlbumModel_getAlbumsFetchPromise(params) {
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
        queryParams.type = 'album';
        const cacheKeyParams = {
            search: q,
            ...queryParams
        };
        return SoundCloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('albums', cacheKeyParams), () => api.search(q, { ...queryParams, type: 'album' }));
    }
    else if (params.userId !== undefined) {
        const userId = params.userId;
        const cacheKeyParams = {
            userId,
            ...queryParams
        };
        return SoundCloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('albums', cacheKeyParams), () => api.getAlbumsByUser(userId, queryParams));
    }
    throw Error('Missing or invalid criteria for albums');
}, _AlbumModel_convertFetchedAlbumToEntity = function _AlbumModel_convertFetchedAlbumToEntity(item) {
    return Mapper_1.default.mapAlbum(item);
};
//# sourceMappingURL=AlbumModel.js.map