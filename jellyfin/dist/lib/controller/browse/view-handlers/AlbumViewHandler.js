"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _AlbumViewHandler_instances, _AlbumViewHandler_getList;
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../../../entities");
const model_1 = require("../../../model");
const FilterableViewHandler_1 = __importDefault(require("./FilterableViewHandler"));
const JellyfinContext_1 = __importDefault(require("../../../JellyfinContext"));
const Explodable_1 = require("./Explodable");
const FilterModel_1 = require("../../../model/filter/FilterModel");
const models_1 = require("@jellyfin/sdk/lib/generated-client/models");
class AlbumViewHandler extends FilterableViewHandler_1.default {
    constructor() {
        super(...arguments);
        _AlbumViewHandler_instances.add(this);
    }
    async browse() {
        const prevUri = this.constructPrevUri();
        const view = this.currentView;
        const { lists, modelQueryParams } = await this.handleFilters();
        if (view.search && view.collatedSearchResults) {
            modelQueryParams.limit = JellyfinContext_1.default.getConfigValue('searchAlbumsResultCount');
            const searchResultsMoreView = {
                ...this.currentView,
                collatedSearchResults: undefined
            };
            lists.push(await __classPrivateFieldGet(this, _AlbumViewHandler_instances, "m", _AlbumViewHandler_getList).call(this, modelQueryParams, undefined, searchResultsMoreView, 'more'));
        }
        else if (view.artistId || view.albumArtistId) {
            const listType = view.artistAlbumListType || 'all';
            const showAlbumList = listType === 'all' || listType === 'albums';
            const showAppearsOnList = listType === 'all' || listType === 'appearsOn';
            const albumNextView = { ...this.currentView, artistAlbumListType: 'albums' };
            const appearsOnNextView = { ...this.currentView, artistAlbumListType: 'appearsOn' };
            const sortBy = [models_1.ItemSortBy.PremiereDate, models_1.ItemSortBy.ProductionYear, models_1.ItemSortBy.SortName];
            const sortOrder = models_1.SortOrder.Descending;
            let albumList, appearsOnList;
            if (view.artistId) {
                albumList = showAlbumList ? await __classPrivateFieldGet(this, _AlbumViewHandler_instances, "m", _AlbumViewHandler_getList).call(this, {
                    ...modelQueryParams,
                    artistIds: undefined,
                    albumArtistIds: view.artistId,
                    sortBy,
                    sortOrder
                }, JellyfinContext_1.default.getI18n('JELLYFIN_ALBUMS'), albumNextView) : null;
                appearsOnList = showAppearsOnList ? await __classPrivateFieldGet(this, _AlbumViewHandler_instances, "m", _AlbumViewHandler_getList).call(this, {
                    ...modelQueryParams,
                    artistIds: undefined,
                    excludeItemIds: view.artistId,
                    contributingArtistIds: view.artistId,
                    sortBy,
                    sortOrder
                }, JellyfinContext_1.default.getI18n('JELLYFIN_APPEARS_ON'), appearsOnNextView) : null;
            }
            else {
                albumList = showAlbumList ? await __classPrivateFieldGet(this, _AlbumViewHandler_instances, "m", _AlbumViewHandler_getList).call(this, {
                    ...modelQueryParams,
                    sortBy,
                    sortOrder
                }, JellyfinContext_1.default.getI18n('JELLYFIN_ALBUMS'), albumNextView) : null;
                appearsOnList = showAppearsOnList ? await __classPrivateFieldGet(this, _AlbumViewHandler_instances, "m", _AlbumViewHandler_getList).call(this, {
                    ...modelQueryParams,
                    albumArtistIds: undefined,
                    excludeItemIds: view.albumArtistId,
                    contributingArtistIds: view.albumArtistId,
                    sortBy,
                    sortOrder
                }, JellyfinContext_1.default.getI18n('JELLYFIN_APPEARS_ON'), appearsOnNextView) : null;
            }
            if (albumList?.items.length) {
                lists.push(albumList);
            }
            if (appearsOnList?.items.length) {
                lists.push(appearsOnList);
            }
        }
        else {
            lists.push(await __classPrivateFieldGet(this, _AlbumViewHandler_instances, "m", _AlbumViewHandler_getList).call(this, modelQueryParams));
        }
        let header;
        if (view.artistId || view.albumArtistId) {
            const artistModel = this.getModel(model_1.ModelType.Artist);
            let headerData;
            if (view.artistId) {
                headerData = await artistModel.getArtist(view.artistId);
            }
            else if (view.albumArtistId) {
                headerData = await artistModel.getAlbumArtist(view.albumArtistId);
            }
            header = headerData ? this.getRenderer(entities_1.EntityType.Artist).renderToHeader(headerData) : null;
        }
        else if (view.genreId) {
            const genreModel = this.getModel(model_1.ModelType.Genre);
            const headerData = await genreModel.getGenre(view.genreId);
            header = headerData ? this.getRenderer(entities_1.EntityType.Genre).renderToHeader(headerData) : null;
        }
        const pageContents = {
            prev: {
                uri: prevUri
            },
            info: header || undefined,
            lists
        };
        if (!header) {
            await this.setPageTitle(pageContents);
        }
        return {
            navigation: pageContents
        };
    }
    getFilterableViewConfig() {
        const view = this.currentView;
        const showFilters = !view.fixedView && !view.search && !view.artistId && !view.albumArtistId;
        const saveFiltersKey = view.genreId ? 'genreAlbum' : `${view.parentId}.album`;
        const filterTypes = [FilterModel_1.FilterType.Sort, FilterModel_1.FilterType.AZ, FilterModel_1.FilterType.Filter];
        if (view.genreId) { // Coming from Genres view
            filterTypes.push(FilterModel_1.FilterType.Year);
        }
        else {
            filterTypes.push(FilterModel_1.FilterType.Genre, FilterModel_1.FilterType.Year);
        }
        return {
            showFilters,
            saveFiltersKey,
            filterTypes
        };
    }
    async getSongsOnExplode() {
        const trackLimit = JellyfinContext_1.default.getConfigValue('maxTracks');
        const albumModel = this.getModel(model_1.ModelType.Album);
        const songModel = this.getModel(model_1.ModelType.Song);
        const result = [];
        const { modelQueryParams: albumModelQueryParams } = await this.handleFilters();
        albumModelQueryParams.limit = 50; // Fetch 50 albums at a time
        let iterations = 0, albumCount = 0;
        while (iterations < 500) {
            // Get albums
            const albums = await albumModel.getAlbums(albumModelQueryParams);
            // Fetch songs in each album and add to result (break when track limit is reached)
            for (const album of albums.items) {
                const songs = await songModel.getSongs({ parentId: album.id });
                result.push(...songs.items);
                albumCount++;
                if (result.length >= trackLimit) {
                    break;
                }
            }
            // Stop iteration if track limit is reached or no more albums available
            if (result.length >= trackLimit || !albums.nextStartIndex) {
                result.splice(trackLimit);
                break;
            }
            albumModelQueryParams.startIndex = albums.nextStartIndex;
            iterations++;
        }
        JellyfinContext_1.default.getLogger().info(`[jellyfin-view-album] getSongsOnExplode(): Fetched ${result.length} songs from ${albumCount} albums.`);
        return result;
    }
}
_AlbumViewHandler_instances = new WeakSet(), _AlbumViewHandler_getList = async function _AlbumViewHandler_getList(modelQueryParams, title, nextView, nextType = 'nextPage') {
    const model = this.getModel(model_1.ModelType.Album);
    const renderer = this.getRenderer(entities_1.EntityType.Album);
    const albums = await model.getAlbums(modelQueryParams);
    const listItems = albums.items.map((album) => renderer.renderToListItem(album)).filter((item) => item);
    if (albums.nextStartIndex) {
        if (!nextView) {
            nextView = this.currentView;
        }
        if (nextType === 'more') {
            const moreUri = this.constructNextUri(0, nextView);
            listItems.push(this.constructMoreItem(moreUri));
        }
        else {
            const nextUri = this.constructNextUri(albums.nextStartIndex, nextView);
            listItems.push(this.constructNextPageItem(nextUri));
        }
    }
    return {
        availableListViews: listItems.length > 0 ? ['list', 'grid'] : ['list'],
        items: listItems,
        title
    };
};
exports.default = (0, Explodable_1.Explodable)(AlbumViewHandler);
//# sourceMappingURL=AlbumViewHandler.js.map