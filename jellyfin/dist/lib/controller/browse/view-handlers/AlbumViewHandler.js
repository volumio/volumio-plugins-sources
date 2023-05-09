"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../../../entities");
const model_1 = require("../../../model");
const FilterableViewHandler_1 = __importDefault(require("./FilterableViewHandler"));
const JellyfinContext_1 = __importDefault(require("../../../JellyfinContext"));
const Explodable_1 = require("./Explodable");
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const FilterModel_1 = require("../../../model/filter/FilterModel");
class AlbumViewHandler extends FilterableViewHandler_1.default {
    async browse() {
        const prevUri = this.constructPrevUri();
        const view = this.currentView;
        const { lists, modelQueryParams } = await this.handleFilters();
        if (view.search && view.collatedSearchResults) {
            modelQueryParams.limit = JellyfinContext_1.default.getConfigValue('searchAlbumsResultCount', 11);
        }
        const model = this.getModel(model_1.ModelType.Album);
        const renderer = this.getRenderer(entities_1.EntityType.Album);
        const albums = await model.getAlbums(modelQueryParams);
        const listItems = albums.items.map((album) => renderer.renderToListItem(album)).filter((item) => item);
        if (albums.nextStartIndex) {
            if (view.search && view.collatedSearchResults && this.serverConnection) {
                const albumView = {
                    name: 'albums',
                    search: view.search
                };
                const moreUri = `jellyfin/${this.serverConnection.id}/${ViewHelper_1.default.constructUriSegmentFromView(albumView)}`;
                listItems.push(this.constructMoreItem(moreUri));
            }
            else {
                const nextUri = this.constructNextUri(albums.nextStartIndex);
                listItems.push(this.constructNextPageItem(nextUri));
            }
        }
        lists.push({
            availableListViews: listItems.length > 0 ? ['list', 'grid'] : ['list'],
            items: listItems
        });
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
        const trackLimit = JellyfinContext_1.default.getConfigValue('maxTracks', 100);
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
exports.default = (0, Explodable_1.Explodable)(AlbumViewHandler);
//# sourceMappingURL=AlbumViewHandler.js.map