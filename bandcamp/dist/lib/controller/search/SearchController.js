"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BandcampContext_1 = __importDefault(require("../../BandcampContext"));
const SearchModel_1 = require("../../model/SearchModel");
const ViewHandlerFactory_1 = __importDefault(require("../browse/view-handlers/ViewHandlerFactory"));
const ViewHelper_1 = __importDefault(require("../browse/view-handlers/ViewHelper"));
class SearchController {
    async search(query) {
        const safeQuery = query.value.replace(/"/g, '\\"');
        const searchView = {
            name: 'search',
            query: safeQuery
        };
        const browsePromises = [];
        if (BandcampContext_1.default.getConfigValue('searchByItemType', true)) {
            [SearchModel_1.SearchItemType.ArtistsAndLabels, SearchModel_1.SearchItemType.Albums, SearchModel_1.SearchItemType.Tracks].forEach((itemType) => {
                const searchByTypeView = {
                    ...searchView,
                    itemType
                };
                const handler = ViewHandlerFactory_1.default.getHandler(`bandcamp/${ViewHelper_1.default.constructUriSegmentFromView(searchByTypeView)}@combinedSearch=1`);
                browsePromises.push(handler.browse());
            });
        }
        else {
            const handler = ViewHandlerFactory_1.default.getHandler(`bandcamp/${ViewHelper_1.default.constructUriSegmentFromView(searchView)}@combinedSearch=1`);
            browsePromises.push(handler.browse());
        }
        const searchResultPages = await Promise.all(browsePromises);
        const allLists = searchResultPages.reduce((result, page) => {
            if (page.navigation?.lists) {
                result.push(...page.navigation.lists.filter((list) => list.items.length > 0));
            }
            return result;
        }, []);
        return allLists;
    }
}
exports.default = SearchController;
//# sourceMappingURL=SearchController.js.map