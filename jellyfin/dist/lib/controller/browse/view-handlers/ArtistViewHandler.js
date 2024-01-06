"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../../../entities");
const model_1 = require("../../../model");
const FilterableViewHandler_1 = __importDefault(require("./FilterableViewHandler"));
const JellyfinContext_1 = __importDefault(require("../../../JellyfinContext"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const FilterModel_1 = require("../../../model/filter/FilterModel");
class ArtistViewHandler extends FilterableViewHandler_1.default {
    async browse() {
        const prevUri = this.constructPrevUri();
        const view = this.currentView;
        const artistType = view.name === 'artists' ? entities_1.EntityType.Artist : entities_1.EntityType.AlbumArtist;
        const { lists, modelQueryParams } = await this.handleFilters();
        if (view.search && view.collatedSearchResults) {
            modelQueryParams.limit = JellyfinContext_1.default.getConfigValue('searchArtistsResultCount');
        }
        const model = this.getModel(model_1.ModelType.Artist);
        const renderer = this.getRenderer(entities_1.EntityType.Artist);
        const artists = artistType === entities_1.EntityType.Artist ?
            await model.getArtists(modelQueryParams) : await model.getAlbumArtists(modelQueryParams);
        const listItems = artists.items.map((artist) => renderer.renderToListItem(artist)).filter((item) => item);
        if (artists.nextStartIndex) {
            if (view.search && view.collatedSearchResults && this.serverConnection) {
                const artistView = {
                    name: 'artists',
                    search: view.search
                };
                const moreUri = `jellyfin/${this.serverConnection.id}/${ViewHelper_1.default.constructUriSegmentFromView(artistView)}`;
                listItems.push(this.constructMoreItem(moreUri));
            }
            else {
                const nextUri = this.constructNextUri(artists.nextStartIndex);
                listItems.push(this.constructNextPageItem(nextUri));
            }
        }
        lists.push({
            availableListViews: listItems.length > 0 ? ['list', 'grid'] : ['list'],
            items: listItems
        });
        const pageContents = {
            prev: {
                uri: prevUri
            },
            lists
        };
        await this.setPageTitle(pageContents);
        return {
            navigation: pageContents
        };
    }
    getFilterableViewConfig() {
        const view = this.currentView;
        const artistType = view.name === 'artists' ? entities_1.EntityType.Artist : entities_1.EntityType.AlbumArtist;
        const showFilters = !view.fixedView && !view.search;
        const saveFiltersKey = `${view.parentId}.${artistType}`;
        const filterTypes = [FilterModel_1.FilterType.AZ, FilterModel_1.FilterType.Filter, FilterModel_1.FilterType.Genre];
        return {
            showFilters,
            saveFiltersKey,
            filterTypes
        };
    }
}
exports.default = ArtistViewHandler;
//# sourceMappingURL=ArtistViewHandler.js.map