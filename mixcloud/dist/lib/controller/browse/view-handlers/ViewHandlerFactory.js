"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const RootViewHandler_1 = __importDefault(require("./RootViewHandler"));
const CloudcastViewHandler_1 = __importDefault(require("./CloudcastViewHandler"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const DiscoverViewHandler_1 = __importDefault(require("./DiscoverViewHandler"));
const FeaturedViewHandler_1 = __importDefault(require("./FeaturedViewHandler"));
const PlaylistViewHandler_1 = __importDefault(require("./PlaylistViewHandler"));
const TagViewHandler_1 = __importDefault(require("./TagViewHandler"));
const UserViewHandler_1 = __importDefault(require("./UserViewHandler"));
const LiveStreamViewHandler_1 = __importDefault(require("./LiveStreamViewHandler"));
const VIEW_NAME_TO_CLASS = {
    'root': RootViewHandler_1.default,
    'cloudcast': CloudcastViewHandler_1.default,
    'cloudcasts': CloudcastViewHandler_1.default,
    'discover': DiscoverViewHandler_1.default,
    'featured': FeaturedViewHandler_1.default,
    'playlist': PlaylistViewHandler_1.default,
    'playlists': PlaylistViewHandler_1.default,
    'tags': TagViewHandler_1.default,
    'user': UserViewHandler_1.default,
    'users': UserViewHandler_1.default,
    'liveStream': LiveStreamViewHandler_1.default,
    'liveStreams': LiveStreamViewHandler_1.default
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