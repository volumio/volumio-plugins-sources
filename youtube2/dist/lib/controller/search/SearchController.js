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
        const searchView = {
            name: 'search',
            query: safeQuery
        };
        const searchUri = `youtube2/${ViewHelper_1.default.constructUriSegmentFromView(searchView)}`;
        const handler = ViewHandlerFactory_1.default.getHandler(searchUri);
        const page = await handler.browse();
        return page.navigation?.lists || [];
    }
}
exports.default = SearchController;
//# sourceMappingURL=SearchController.js.map