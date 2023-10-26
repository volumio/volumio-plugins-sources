"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _SearchController_instances, _SearchController_connectionManager, _SearchController_getListsFromSearchUri;
Object.defineProperty(exports, "__esModule", { value: true });
const JellyfinContext_1 = __importDefault(require("../../JellyfinContext"));
const ViewHandlerFactory_1 = __importDefault(require("../browse/view-handlers/ViewHandlerFactory"));
const ServerHelper_1 = __importDefault(require("../../util/ServerHelper"));
const ViewHelper_1 = __importDefault(require("../browse/view-handlers/ViewHelper"));
class SearchController {
    constructor(connectionManager) {
        _SearchController_instances.add(this);
        _SearchController_connectionManager.set(this, void 0);
        __classPrivateFieldSet(this, _SearchController_connectionManager, connectionManager, "f");
    }
    async search(query) {
        if (!query) {
            return [];
        }
        const searchAlbums = JellyfinContext_1.default.getConfigValue('searchAlbums');
        const searchArtists = JellyfinContext_1.default.getConfigValue('searchArtists');
        const searchSongs = JellyfinContext_1.default.getConfigValue('searchSongs');
        if (!searchAlbums && !searchArtists && !searchSongs) {
            return [];
        }
        const serverConfEntries = ServerHelper_1.default.getServersFromConfig();
        const onlineServers = JellyfinContext_1.default.get('onlineServers', []);
        const searchedConnectionIds = [];
        const searchUris = serverConfEntries.reduce((uris, conf) => {
            const server = onlineServers.find((server) => ServerHelper_1.default.getConnectionUrl(conf.url) === server.connectionUrl);
            if (server) {
                const targetConnectionId = ServerHelper_1.default.generateConnectionId(conf.username, server);
                if (!searchedConnectionIds.includes(targetConnectionId)) {
                    const baseView = {
                        search: query.value,
                        collatedSearchResults: '1'
                    };
                    if (searchAlbums) {
                        uris.push(`jellyfin/${targetConnectionId}/${ViewHelper_1.default.constructUriSegmentFromView({ ...baseView, name: 'albums' })}`);
                    }
                    if (searchArtists) {
                        uris.push(`jellyfin/${targetConnectionId}/${ViewHelper_1.default.constructUriSegmentFromView({ ...baseView, name: 'artists' })}`);
                    }
                    if (searchSongs) {
                        uris.push(`jellyfin/${targetConnectionId}/${ViewHelper_1.default.constructUriSegmentFromView({ ...baseView, name: 'songs' })}`);
                    }
                    searchedConnectionIds.push(targetConnectionId);
                }
            }
            return uris;
        }, []);
        const searchResultListsPromises = searchUris.map((uri) => __classPrivateFieldGet(this, _SearchController_instances, "m", _SearchController_getListsFromSearchUri).call(this, uri));
        const searchResultLists = (await Promise.all(searchResultListsPromises)).reduce((result, lists) => {
            lists.forEach((list) => {
                if (list.items.length > 0) {
                    result.push(list);
                }
            });
            return result;
        }, []);
        return searchResultLists;
    }
}
exports.default = SearchController;
_SearchController_connectionManager = new WeakMap(), _SearchController_instances = new WeakSet(), _SearchController_getListsFromSearchUri = async function _SearchController_getListsFromSearchUri(uri) {
    try {
        const handler = await ViewHandlerFactory_1.default.getHandler(uri, __classPrivateFieldGet(this, _SearchController_connectionManager, "f"));
        const searchResultsPage = await handler.browse();
        return searchResultsPage.navigation?.lists || [];
    }
    catch (error) {
        return [];
    }
};
//# sourceMappingURL=SearchController.js.map