"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AlbumViewHandler_1 = __importDefault(require("./AlbumViewHandler"));
const ArtistViewHandler_1 = __importDefault(require("./ArtistViewHandler"));
const CollectionViewHandler_1 = __importDefault(require("./CollectionViewHandler"));
const FilterSelectionViewHandler_1 = __importDefault(require("./FilterSelectionViewHandler"));
const FolderViewHandler_1 = __importDefault(require("./FolderViewHandler"));
const GenreViewHandler_1 = __importDefault(require("./GenreViewHandler"));
const LibraryViewHandler_1 = __importDefault(require("./LibraryViewHandler"));
const PlaylistViewHandler_1 = __importDefault(require("./PlaylistViewHandler"));
const RootViewHandler_1 = __importDefault(require("./RootViewHandler"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const UserViewViewHandler_1 = __importDefault(require("./UserViewViewHandler"));
const SongViewHandler_1 = __importDefault(require("./SongViewHandler"));
const CollectionsViewHandler_1 = __importDefault(require("./CollectionsViewHandler"));
const ServerHelper_1 = __importDefault(require("../../../util/ServerHelper"));
const VIEW_NAME_TO_CLASS = {
    'root': RootViewHandler_1.default,
    'userViews': UserViewViewHandler_1.default,
    'library': LibraryViewHandler_1.default,
    'albums': AlbumViewHandler_1.default,
    'albumArtists': ArtistViewHandler_1.default,
    'artists': ArtistViewHandler_1.default,
    'playlists': PlaylistViewHandler_1.default,
    'genres': GenreViewHandler_1.default,
    'songs': SongViewHandler_1.default,
    'song': SongViewHandler_1.default,
    'collections': CollectionsViewHandler_1.default,
    'collection': CollectionViewHandler_1.default,
    'folder': FolderViewHandler_1.default,
    'filter.az': FilterSelectionViewHandler_1.default,
    'filter.genre': FilterSelectionViewHandler_1.default,
    'filter.year': FilterSelectionViewHandler_1.default,
    'filter.filter': FilterSelectionViewHandler_1.default,
    'filter.sort': FilterSelectionViewHandler_1.default
};
class ViewHandlerFactory {
    static async getHandler(uri, connectionTarget) {
        const views = ViewHelper_1.default.getViewsFromUri(uri);
        const currentView = views.pop();
        const previousViews = views;
        if (!currentView) {
            throw Error('Invalid URI: no parseable view.');
        }
        const connection = await ServerHelper_1.default.getConnectionByView(currentView, connectionTarget);
        return new VIEW_NAME_TO_CLASS[currentView.name](uri, currentView, previousViews, connection);
    }
}
exports.default = ViewHandlerFactory;
//# sourceMappingURL=ViewHandlerFactory.js.map