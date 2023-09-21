"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ConnectionManager_1 = __importDefault(require("../../../connection/ConnectionManager"));
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
const JellyfinContext_1 = __importDefault(require("../../../JellyfinContext"));
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
        let connection = null;
        if (currentView.serverId) {
            if (connectionTarget instanceof ConnectionManager_1.default) {
                let username = currentView.username || '';
                let targetServer;
                const isLegacyUri = !username;
                if (isLegacyUri) {
                    const onlineServers = JellyfinContext_1.default.get('onlineServers', []);
                    targetServer = onlineServers.find((server) => server.id === currentView.serverId) || null;
                }
                else {
                    targetServer = ServerHelper_1.default.getOnlineServerByIdAndUsername(currentView.serverId, username);
                }
                if (!targetServer) {
                    throw Error('Server unavailable');
                }
                if (isLegacyUri) {
                    // Fetch username from server config
                    const matchUrl = targetServer.connectionUrl;
                    const serverConfEntries = ServerHelper_1.default.getServersFromConfig();
                    const serverConf = serverConfEntries.find((conf) => ServerHelper_1.default.getConnectionUrl(conf.url) === matchUrl);
                    if (serverConf) {
                        username = serverConf.username;
                    }
                    else {
                        throw Error('Could not obtain default username for legacy URI (no matching server config found)');
                    }
                }
                connection = await connectionTarget.getAuthenticatedConnection(targetServer, username, ServerHelper_1.default.fetchPasswordFromConfig.bind(ServerHelper_1.default));
            }
            else {
                connection = connectionTarget;
            }
        }
        return new VIEW_NAME_TO_CLASS[currentView.name](uri, currentView, previousViews, connection);
    }
}
exports.default = ViewHandlerFactory;
//# sourceMappingURL=ViewHandlerFactory.js.map