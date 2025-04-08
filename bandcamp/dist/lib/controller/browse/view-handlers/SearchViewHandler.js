"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BandcampContext_1 = __importDefault(require("../../../BandcampContext"));
const model_1 = require("../../../model");
const SearchModel_1 = require("../../../model/SearchModel");
const UIHelper_1 = __importDefault(require("../../../util/UIHelper"));
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const renderers_1 = require("./renderers");
class SearchViewHandler extends BaseViewHandler_1.default {
    async browse() {
        const view = this.currentView;
        if (!view.query) {
            throw Error('Search query missing');
        }
        const modelParams = {
            query: view.query,
            itemType: SearchModel_1.SearchItemType.All,
            limit: view.combinedSearch ? BandcampContext_1.default.getConfigValue('combinedSearchResults', 17) : BandcampContext_1.default.getConfigValue('itemsPerPage', 47)
        };
        if (view.pageRef) {
            modelParams.pageToken = view.pageRef.pageToken;
            modelParams.pageOffset = view.pageRef.pageOffset;
        }
        if (view.itemType) {
            modelParams.itemType = view.itemType;
        }
        const searchResults = await this.getModel(model_1.ModelType.Search).getSearchResults(modelParams);
        const renderer = this.getRenderer(renderers_1.RendererType.SearchResult);
        const listItems = searchResults.items.reduce((result, item) => {
            const rendered = renderer.renderToListItem(item);
            if (rendered) {
                result.push(rendered);
            }
            return result;
        }, []);
        const nextPageRef = this.constructPageRef(searchResults.nextPageToken, searchResults.nextPageOffset);
        if (nextPageRef) {
            const nextUri = this.constructNextUri(nextPageRef);
            listItems.push(this.constructNextPageItem(nextUri));
        }
        let titleKey;
        switch (view.itemType) {
            case SearchModel_1.SearchItemType.ArtistsAndLabels:
                titleKey = 'BANDCAMP_SEARCH_ARTISTS_AND_LABELS_TITLE';
                break;
            case SearchModel_1.SearchItemType.Albums:
                titleKey = 'BANDCAMP_SEARCH_ALBUMS_TITLE';
                break;
            case SearchModel_1.SearchItemType.Tracks:
                titleKey = 'BANDCAMP_SEARCH_TRACKS_TITLE';
                break;
            default:
                titleKey = 'BANDCAMP_SEARCH_TITLE';
        }
        if (!view.combinedSearch) {
            titleKey += '_FULL';
        }
        const pageTitle = UIHelper_1.default.addBandcampIconToListTitle(BandcampContext_1.default.getI18n(titleKey, view.query));
        return {
            navigation: {
                prev: { uri: this.constructPrevUri() },
                lists: [
                    {
                        availableListViews: ['list', 'grid'],
                        items: listItems,
                        title: pageTitle
                    }
                ]
            }
        };
    }
}
exports.default = SearchViewHandler;
//# sourceMappingURL=SearchViewHandler.js.map