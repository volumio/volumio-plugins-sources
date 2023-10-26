"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AlbumViewHandler_1 = __importDefault(require("./AlbumViewHandler"));
const HistoryViewHandler_1 = __importDefault(require("./HistoryViewHandler"));
const LibraryViewHandler_1 = __importDefault(require("./LibraryViewHandler"));
const PlaylistViewHandler_1 = __importDefault(require("./PlaylistViewHandler"));
const RootViewHandler_1 = __importDefault(require("./RootViewHandler"));
const SelectionViewHandler_1 = __importDefault(require("./SelectionViewHandler"));
const TrackViewHandler_1 = __importDefault(require("./TrackViewHandler"));
const UserViewHandler_1 = __importDefault(require("./UserViewHandler"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const VIEW_NAME_TO_CLASS = {
    'root': RootViewHandler_1.default,
    'selections': SelectionViewHandler_1.default,
    'users': UserViewHandler_1.default,
    'albums': AlbumViewHandler_1.default,
    'playlists': PlaylistViewHandler_1.default,
    'tracks': TrackViewHandler_1.default,
    'track': TrackViewHandler_1.default,
    'history': HistoryViewHandler_1.default,
    'library': LibraryViewHandler_1.default
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