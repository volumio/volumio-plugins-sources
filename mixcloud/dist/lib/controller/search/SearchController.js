"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ViewHandlerFactory_1 = __importDefault(require("../browse/view-handlers/ViewHandlerFactory"));
const ViewHelper_1 = __importDefault(require("../browse/view-handlers/ViewHelper"));
class SearchController {
    async search(query) {
        const safeQuery = query.value.replace(/"/g, '\\"');
        const tagView = {
            name: 'tags',
            keywords: safeQuery
        };
        const cloudcastView = {
            name: 'cloudcasts',
            keywords: safeQuery
        };
        const userView = {
            name: 'users',
            keywords: safeQuery
        };
        const searchUris = [
            `mixcloud/${ViewHelper_1.default.constructUriSegmentFromView(tagView)}@inSection=1`,
            `mixcloud/${ViewHelper_1.default.constructUriSegmentFromView(cloudcastView)}@inSection=1`,
            `mixcloud/${ViewHelper_1.default.constructUriSegmentFromView(userView)}@inSection=1`
        ];
        const browsePromises = searchUris.map((uri) => ViewHandlerFactory_1.default.getHandler(uri).browse());
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