"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GenericViewHandler_1 = __importDefault(require("./GenericViewHandler"));
const OptionSelectionViewHandler_1 = __importDefault(require("./OptionSelectionViewHandler"));
const PlaylistViewHandler_1 = __importDefault(require("./PlaylistViewHandler"));
const RootViewHandler_1 = __importDefault(require("./RootViewHandler"));
const SearchViewHandler_1 = __importDefault(require("./SearchViewHandler"));
const SubscriptionsViewHandler_1 = __importDefault(require("./SubscriptionsViewHandler"));
const VideoViewHandler_1 = __importDefault(require("./VideoViewHandler"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const VIEW_NAME_TO_CLASS = {
    'root': RootViewHandler_1.default,
    'generic': GenericViewHandler_1.default,
    'video': VideoViewHandler_1.default,
    'playlist': PlaylistViewHandler_1.default,
    'optionSelection': OptionSelectionViewHandler_1.default,
    'search': SearchViewHandler_1.default,
    'subscriptions': SubscriptionsViewHandler_1.default
};
class ViewHandlerFactory {
    static getHandler(uri) {
        const views = ViewHelper_1.default.getViewsFromUri(uri);
        const currentView = views.pop();
        const previousViews = views;
        if (!currentView) {
            throw Error('Invalid URI: no parseable view.');
        }
        return new VIEW_NAME_TO_CLASS[currentView.name](uri, currentView, previousViews);
    }
}
exports.default = ViewHandlerFactory;
//# sourceMappingURL=ViewHandlerFactory.js.map