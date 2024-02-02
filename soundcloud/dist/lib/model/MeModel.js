"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _MeModel_instances, _MeModel_getLikesFetchPromise, _MeModel_convertFetchedLikeToEntity, _MeModel_getLibraryItemsFetchPromise, _MeModel_filterFetchedLibraryItem, _MeModel_isArtistStation, _MeModel_convertFetchedLibraryItemToEntity;
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../SoundCloudContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const soundcloud_fetch_1 = require("soundcloud-fetch");
const Mapper_1 = __importDefault(require("./Mapper"));
class MeModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _MeModel_instances.add(this);
    }
    getLikes(params) {
        const getItems = (this.commonGetCollectionItemsFromLoopFetchResult);
        const getNextPageToken = (this.commonGetNextPageTokenFromLoopFetchResult);
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: __classPrivateFieldGet(this, _MeModel_instances, "m", _MeModel_getLikesFetchPromise).bind(this),
            getItemsFromFetchResult: getItems.bind(this),
            getNextPageTokenFromFetchResult: getNextPageToken.bind(this),
            convertToEntity: __classPrivateFieldGet(this, _MeModel_instances, "m", _MeModel_convertFetchedLikeToEntity).bind(this),
            pageToken: params.pageToken,
            pageOffset: params.pageOffset,
            limit: params.limit
        });
    }
    getLibraryItems(params) {
        const getItems = (this.commonGetCollectionItemsFromLoopFetchResult);
        const getNextPageToken = (this.commonGetNextPageTokenFromLoopFetchResult);
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: __classPrivateFieldGet(this, _MeModel_instances, "m", _MeModel_getLibraryItemsFetchPromise).bind(this),
            getItemsFromFetchResult: getItems.bind(this),
            filterFetchedItem: __classPrivateFieldGet(this, _MeModel_instances, "m", _MeModel_filterFetchedLibraryItem).bind(this),
            getNextPageTokenFromFetchResult: getNextPageToken.bind(this),
            convertToEntity: __classPrivateFieldGet(this, _MeModel_instances, "m", _MeModel_convertFetchedLibraryItemToEntity).bind(this),
            pageToken: params.pageToken,
            pageOffset: params.pageOffset,
            limit: params.limit
        });
    }
    async getMyProfile() {
        if (!this.hasAccessToken()) {
            return null;
        }
        const info = await SoundCloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('myProfile', {}), () => this.getSoundCloudAPI().me.getProfile());
        if (info) {
            return Mapper_1.default.mapUser(info);
        }
        return null;
    }
    async addToPlayHistory(track, origin) {
        if (!this.hasAccessToken() || !track.urn) {
            return;
        }
        const api = this.getSoundCloudAPI();
        try {
            let setOrUrn = null;
            if (origin?.type === 'album') {
                setOrUrn = new soundcloud_fetch_1.Album({ id: origin.albumId }, api);
            }
            else if (origin?.type === 'playlist') {
                setOrUrn = new soundcloud_fetch_1.Playlist({ id: origin.playlistId }, api);
            }
            else if (origin?.type === 'system-playlist') {
                setOrUrn = origin.urn;
            }
            if (setOrUrn) {
                try {
                    await api.me.addToPlayHistory(track.urn, setOrUrn);
                }
                catch (error) {
                    SoundCloudContext_1.default.getLogger().error(SoundCloudContext_1.default.getErrorMessage('Failed to add to play history - will retry without track origin:', error, true));
                    await this.addToPlayHistory(track);
                }
            }
            else {
                await api.me.addToPlayHistory(track.urn);
            }
        }
        catch (error) {
            SoundCloudContext_1.default.getLogger().error(SoundCloudContext_1.default.getErrorMessage('Failed to add to play history:', error, true));
        }
    }
}
exports.default = MeModel;
_MeModel_instances = new WeakSet(), _MeModel_getLikesFetchPromise = async function _MeModel_getLikesFetchPromise(params) {
    const api = this.getSoundCloudAPI();
    const continuationContents = await this.commonGetLoopFetchResultByPageToken(params);
    if (continuationContents) {
        return continuationContents;
    }
    const queryParams = {
        limit: soundcloud_fetch_1.Constants.QUERY_MAX_LIMIT,
        type: params.type
    };
    return SoundCloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('likes', queryParams), () => api.me.getLikes(queryParams));
}, _MeModel_convertFetchedLikeToEntity = async function _MeModel_convertFetchedLikeToEntity(item) {
    const wrappedItem = item.item;
    if (wrappedItem instanceof soundcloud_fetch_1.Album) {
        return Mapper_1.default.mapAlbum(wrappedItem);
    }
    else if (wrappedItem instanceof soundcloud_fetch_1.Playlist) {
        return Mapper_1.default.mapPlaylist(wrappedItem);
    }
    else if (wrappedItem instanceof soundcloud_fetch_1.Track) {
        return Mapper_1.default.mapTrack(wrappedItem);
    }
    return null;
}, _MeModel_getLibraryItemsFetchPromise = async function _MeModel_getLibraryItemsFetchPromise(params) {
    const api = this.getSoundCloudAPI();
    const continuationContents = await this.commonGetLoopFetchResultByPageToken(params);
    if (continuationContents) {
        return continuationContents;
    }
    const queryParams = {
        limit: soundcloud_fetch_1.Constants.QUERY_MAX_LIMIT
    };
    return SoundCloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('libraryItems', queryParams), () => api.me.getLibraryItems(queryParams));
}, _MeModel_filterFetchedLibraryItem = function _MeModel_filterFetchedLibraryItem(item, params) {
    switch (params.type) {
        case 'album':
            const isCreatedAlbum = item.itemType === 'Album';
            const isLikedAlbum = item.itemType === 'AlbumLike';
            if (params.filter === 'created') {
                return isCreatedAlbum;
            }
            else if (params.filter === 'liked') {
                return isLikedAlbum;
            }
            return isCreatedAlbum || isLikedAlbum;
        case 'playlist':
            const isCreatedPlaylist = item.itemType === 'Playlist';
            const isLikedPlaylist = item.itemType === 'PlaylistLike' ||
                (item.itemType === 'SystemPlaylistLike' && !__classPrivateFieldGet(this, _MeModel_instances, "m", _MeModel_isArtistStation).call(this, item));
            if (params.filter === 'created') {
                return isCreatedPlaylist;
            }
            else if (params.filter === 'liked') {
                return isLikedPlaylist;
            }
            return isCreatedPlaylist || isLikedPlaylist;
        case 'station':
            return __classPrivateFieldGet(this, _MeModel_instances, "m", _MeModel_isArtistStation).call(this, item);
    }
}, _MeModel_isArtistStation = function _MeModel_isArtistStation(item) {
    return item.item instanceof soundcloud_fetch_1.SystemPlaylist && item.item.playlistType === 'artistStation';
}, _MeModel_convertFetchedLibraryItemToEntity = async function _MeModel_convertFetchedLibraryItemToEntity(item) {
    return Mapper_1.default.mapLibraryItem(item);
};
//# sourceMappingURL=MeModel.js.map