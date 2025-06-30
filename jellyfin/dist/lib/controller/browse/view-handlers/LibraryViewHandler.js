"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _LibraryViewHandler_instances, _LibraryViewHandler_getTopItemList, _LibraryViewHandler_getLatestMusic, _LibraryViewHandler_getRecentlyPlayed, _LibraryViewHandler_getFrequentlyPlayed, _LibraryViewHandler_getFavoriteArtists, _LibraryViewHandler_getFavoriteAlbums, _LibraryViewHandler_getFavoriteSongs, _LibraryViewHandler_getAlbumList, _LibraryViewHandler_getSongList, _LibraryViewHandler_getArtistList, _LibraryViewHandler_getItemsResultToList;
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("../../../model");
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const JellyfinContext_1 = __importDefault(require("../../../JellyfinContext"));
const entities_1 = require("../../../entities");
const ViewHandlerFactory_1 = __importDefault(require("./ViewHandlerFactory"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const models_1 = require("@jellyfin/sdk/lib/generated-client/models");
class LibraryViewHandler extends BaseViewHandler_1.default {
    constructor() {
        super(...arguments);
        _LibraryViewHandler_instances.add(this);
    }
    async browse() {
        const prevUri = this.constructPrevUri();
        const baseUri = this.uri;
        const view = this.currentView;
        const libraryId = view.parentId;
        const listPromises = [
            __classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getTopItemList).call(this, libraryId, baseUri)
        ];
        if (JellyfinContext_1.default.getConfigValue('showLatestMusicSection')) {
            listPromises.push(__classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getLatestMusic).call(this, libraryId, baseUri));
        }
        if (JellyfinContext_1.default.getConfigValue('showRecentlyPlayedSection')) {
            listPromises.push(__classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getRecentlyPlayed).call(this, libraryId, baseUri));
        }
        if (JellyfinContext_1.default.getConfigValue('showFrequentlyPlayedSection')) {
            listPromises.push(__classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getFrequentlyPlayed).call(this, libraryId, baseUri));
        }
        if (JellyfinContext_1.default.getConfigValue('showFavoriteArtistsSection')) {
            listPromises.push(__classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getFavoriteArtists).call(this, libraryId, baseUri));
        }
        if (JellyfinContext_1.default.getConfigValue('showFavoriteAlbumsSection')) {
            listPromises.push(__classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getFavoriteAlbums).call(this, libraryId, baseUri));
        }
        if (JellyfinContext_1.default.getConfigValue('showFavoriteSongsSection')) {
            listPromises.push(__classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getFavoriteSongs).call(this, libraryId, baseUri));
        }
        const lists = await Promise.all(listPromises);
        const cleanLists = lists.reduce((result, list) => {
            if (list.items.length > 0) {
                result.push(list);
            }
            return result;
        }, []);
        const pageContents = {
            prev: {
                uri: prevUri
            },
            lists: cleanLists
        };
        await this.setPageTitle(pageContents);
        return {
            navigation: pageContents
        };
    }
    async explode() {
        if (!this.serverConnection) {
            throw Error('No auth');
        }
        const songView = {
            name: 'songs',
            parentId: this.currentView.parentId
        };
        const uri = `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(songView)}`;
        const handler = await ViewHandlerFactory_1.default.getHandler(uri, this.serverConnection);
        return handler.explode();
    }
}
exports.default = LibraryViewHandler;
_LibraryViewHandler_instances = new WeakSet(), _LibraryViewHandler_getTopItemList = async function _LibraryViewHandler_getTopItemList(libraryId, baseUri) {
    const baseImgPath = 'music_service/jellyfin/dist/assets/images/';
    const listItems = [
        {
            service: 'jellyfin',
            type: 'folder',
            title: JellyfinContext_1.default.getI18n('JELLYFIN_ALBUMS'),
            uri: `${baseUri}/${ViewHelper_1.default.constructUriSegmentFromView({ name: 'albums', parentId: libraryId })}`,
            albumart: `/albumart?sourceicon=${baseImgPath}album.png`
        },
        {
            service: 'jellyfin',
            type: 'streaming-category',
            title: JellyfinContext_1.default.getI18n('JELLYFIN_ALBUM_ARTISTS'),
            uri: `${baseUri}/${ViewHelper_1.default.constructUriSegmentFromView({ name: 'albumArtists', parentId: libraryId })}`,
            albumart: `/albumart?sourceicon=${baseImgPath}avatar.png`
        },
        {
            service: 'jellyfin',
            type: 'streaming-category',
            title: JellyfinContext_1.default.getI18n('JELLYFIN_ARTISTS'),
            uri: `${baseUri}/${ViewHelper_1.default.constructUriSegmentFromView({ name: 'artists', parentId: libraryId })}`,
            albumart: `/albumart?sourceicon=${baseImgPath}avatar.png`
        },
        {
            service: 'jellyfin',
            type: 'streaming-category',
            title: JellyfinContext_1.default.getI18n('JELLYFIN_PLAYLISTS'),
            uri: `${baseUri}/${ViewHelper_1.default.constructUriSegmentFromView({ name: 'playlists', parentId: libraryId })}`,
            albumart: `/albumart?sourceicon=${baseImgPath}playlist.png`
        },
        {
            service: 'jellyfin',
            type: 'streaming-category',
            title: JellyfinContext_1.default.getI18n('JELLYFIN_GENRES'),
            uri: `${baseUri}/${ViewHelper_1.default.constructUriSegmentFromView({ name: 'genres', parentId: libraryId })}`,
            albumart: `/albumart?sourceicon=${baseImgPath}genre.png`
        },
        {
            service: 'jellyfin',
            type: 'folder',
            title: JellyfinContext_1.default.getI18n('JELLYFIN_ALL_SONGS'),
            uri: `${baseUri}/${ViewHelper_1.default.constructUriSegmentFromView({ name: 'songs', parentId: libraryId })}`,
            albumart: `/albumart?sourceicon=${baseImgPath}song.png`
        }
    ];
    const model = this.getModel(model_1.ModelType.UserView);
    const userView = await model.getUserView(libraryId);
    const title = userView?.name;
    return {
        title,
        availableListViews: ['list', 'grid'],
        items: listItems
    };
}, _LibraryViewHandler_getLatestMusic = function _LibraryViewHandler_getLatestMusic(libraryId, baseUri) {
    const params = {
        parentId: libraryId,
        sortBy: [models_1.ItemSortBy.DateCreated, models_1.ItemSortBy.SortName],
        sortOrder: [models_1.SortOrder.Descending, models_1.SortOrder.Ascending],
        limit: JellyfinContext_1.default.getConfigValue('latestMusicSectionItems')
    };
    const albumView = {
        name: 'albums',
        parentId: libraryId,
        sortBy: [models_1.ItemSortBy.DateCreated, models_1.ItemSortBy.SortName],
        sortOrder: 'Descending,Ascending',
        fixedView: 'latest'
    };
    const moreUri = `${baseUri}/${ViewHelper_1.default.constructUriSegmentFromView(albumView)}`;
    return __classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getAlbumList).call(this, params, JellyfinContext_1.default.getI18n('JELLYFIN_LATEST_ALBUMS'), moreUri);
}, _LibraryViewHandler_getRecentlyPlayed = function _LibraryViewHandler_getRecentlyPlayed(libraryId, baseUri) {
    const params = {
        parentId: libraryId,
        sortBy: [models_1.ItemSortBy.DatePlayed, models_1.ItemSortBy.SortName],
        sortOrder: [models_1.SortOrder.Descending, models_1.SortOrder.Ascending],
        filters: 'IsPlayed',
        limit: JellyfinContext_1.default.getConfigValue('recentlyPlayedSectionItems')
    };
    const songView = {
        name: 'songs',
        parentId: libraryId,
        sortBy: 'DatePlayed,SortName',
        sortOrder: 'Descending,Ascending',
        filters: 'IsPlayed',
        fixedView: 'recentlyPlayed'
    };
    const moreUri = `${baseUri}/${ViewHelper_1.default.constructUriSegmentFromView(songView)}`;
    return __classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getSongList).call(this, params, JellyfinContext_1.default.getI18n('JELLYFIN_RECENTLY_PLAYED_SONGS'), moreUri);
}, _LibraryViewHandler_getFrequentlyPlayed = function _LibraryViewHandler_getFrequentlyPlayed(libraryId, baseUri) {
    const params = {
        parentId: libraryId,
        sortBy: [models_1.ItemSortBy.PlayCount, models_1.ItemSortBy.SortName],
        sortOrder: [models_1.SortOrder.Descending, models_1.SortOrder.Ascending],
        filters: 'IsPlayed',
        limit: JellyfinContext_1.default.getConfigValue('frequentlyPlayedSectionItems')
    };
    const songView = {
        name: 'songs',
        parentId: libraryId,
        sortBy: 'PlayCount,SortName',
        sortOrder: 'Descending,Ascending',
        filters: 'IsPlayed',
        fixedView: 'frequentlyPlayed'
    };
    const moreUri = `${baseUri}/${ViewHelper_1.default.constructUriSegmentFromView(songView)}`;
    return __classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getSongList).call(this, params, JellyfinContext_1.default.getI18n('JELLYFIN_FREQUENTLY_PLAYED_SONGS'), moreUri);
}, _LibraryViewHandler_getFavoriteArtists = function _LibraryViewHandler_getFavoriteArtists(libraryId, baseUri) {
    const params = {
        parentId: libraryId,
        filters: 'IsFavorite',
        limit: JellyfinContext_1.default.getConfigValue('favoriteArtistsSectionItems')
    };
    const artistView = {
        name: 'artists',
        parentId: libraryId,
        filters: 'IsFavorite',
        fixedView: 'favorite'
    };
    const moreUri = `${baseUri}/${ViewHelper_1.default.constructUriSegmentFromView(artistView)}`;
    return __classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getArtistList).call(this, params, JellyfinContext_1.default.getI18n('JELLYFIN_FAVORITE_ARTISTS'), moreUri);
}, _LibraryViewHandler_getFavoriteAlbums = function _LibraryViewHandler_getFavoriteAlbums(libraryId, baseUri) {
    const params = {
        parentId: libraryId,
        filters: 'IsFavorite',
        limit: JellyfinContext_1.default.getConfigValue('favoriteAlbumsSectionItems')
    };
    const albumView = {
        name: 'albums',
        parentId: libraryId,
        filters: 'IsFavorite',
        fixedView: 'favorite'
    };
    const moreUri = `${baseUri}/${ViewHelper_1.default.constructUriSegmentFromView(albumView)}`;
    return __classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getAlbumList).call(this, params, JellyfinContext_1.default.getI18n('JELLYFIN_FAVORITE_ALBUMS'), moreUri);
}, _LibraryViewHandler_getFavoriteSongs = function _LibraryViewHandler_getFavoriteSongs(libraryId, baseUri) {
    const params = {
        parentId: libraryId,
        filters: 'IsFavorite',
        limit: JellyfinContext_1.default.getConfigValue('favoriteSongsSectionItems')
    };
    const songView = {
        name: 'songs',
        parentId: libraryId,
        filters: 'IsFavorite',
        fixedView: 'favorite'
    };
    const moreUri = `${baseUri}/${ViewHelper_1.default.constructUriSegmentFromView(songView)}`;
    return __classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getSongList).call(this, params, JellyfinContext_1.default.getI18n('JELLYFIN_FAVORITE_SONGS'), moreUri);
}, _LibraryViewHandler_getAlbumList = async function _LibraryViewHandler_getAlbumList(params, title, moreUri) {
    return __classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getItemsResultToList).call(this, await this.getModel(model_1.ModelType.Album).getAlbums(params), this.getRenderer(entities_1.EntityType.Album), title, moreUri);
}, _LibraryViewHandler_getSongList = async function _LibraryViewHandler_getSongList(params, title, moreUri) {
    return __classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getItemsResultToList).call(this, await this.getModel(model_1.ModelType.Song).getSongs(params), this.getRenderer(entities_1.EntityType.Song), title, moreUri);
}, _LibraryViewHandler_getArtistList = async function _LibraryViewHandler_getArtistList(params, title, moreUri) {
    return __classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getItemsResultToList).call(this, await this.getModel(model_1.ModelType.Artist).getArtists(params), this.getRenderer(entities_1.EntityType.Artist), title, moreUri);
}, _LibraryViewHandler_getItemsResultToList = async function _LibraryViewHandler_getItemsResultToList(result, renderer, title, moreUri) {
    const listItems = result.items.map((entity) => renderer.renderToListItem(entity)).filter((item) => item);
    if (result.nextStartIndex) {
        listItems.push(this.constructNextPageItem(moreUri, `<span style='color: #7a848e;'>${JellyfinContext_1.default.getI18n('JELLYFIN_VIEW_MORE')}</span>`));
    }
    listItems.push();
    return {
        title,
        availableListViews: ['list', 'grid'],
        items: listItems
    };
};
//# sourceMappingURL=LibraryViewHandler.js.map