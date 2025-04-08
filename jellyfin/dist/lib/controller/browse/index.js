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
var _BrowseController_instances, _BrowseController_connectionManager, _BrowseController_getHandler;
Object.defineProperty(exports, "__esModule", { value: true });
const JellyfinContext_1 = __importDefault(require("../../JellyfinContext"));
const ViewHandlerFactory_1 = __importDefault(require("./view-handlers/ViewHandlerFactory"));
class BrowseController {
    constructor(connectionManager) {
        _BrowseController_instances.add(this);
        _BrowseController_connectionManager.set(this, void 0);
        __classPrivateFieldSet(this, _BrowseController_connectionManager, connectionManager, "f");
    }
    /*
     *  Uri follows a hierarchical view structure, starting with 'jellyfin'.
     * - If nothing follows 'jellyfin', the view would be 'root' (show server list)
     * - The next segment that follows is 'serverId', i.e. 'jellyfin/{username}@{serverId}'. If there are no further segments, the view would be 'userViews' (shows user views for the server specified by serverId)
     *
     * After 'jellyfin/{username}@{serverId}', the uri consists of segments representing the following views:
     * - library[@parentId=...]: shows 'Albums', 'Artists'...for the specified library
     * - albums[@parentId=...][@artistId=...| @albumArtistId=...| @genreId=...][@startIndex=...][@viewType=latest|favorite][@search=...]: shows albums under the item specified by parentId, optionally filtered by artistId, albumArtistId, genreId...
     * - artists[@parentId=...][@startIndex=...][@viewType=favorite][@search=...]
     * - albumArtists[@parentId=...][@startIndex=...][@viewType=favorite]
     * - playlists[@startIndex=...]
     * - genres[@parentId=...][@startIndex=...]
     * - songs[@albumId=...] | [ [@playlistId=...| @parentId=...][@startIndex=...] ][@viewType=recentlyPlayed|frequentlyPlayed|favorite][@search=...]
     * - folder[@parentId=...][@startIndex=...]: lists contents of specified folder. Folders are shown in userViews when 'folder view' is enabled in Jellyfin.
     *
     */
    async browseUri(uri) {
        JellyfinContext_1.default.getLogger().info(`[jellyfin-browse] browseUri: ${uri}`);
        const handler = await __classPrivateFieldGet(this, _BrowseController_instances, "m", _BrowseController_getHandler).call(this, uri);
        return handler.browse();
    }
    /**
     * Explodable uris:
     * - song[@songId=...]
     * - songs[@albumId=...] | [ [@playlistId=...| @parentId=...] ]
     * - albums[@parentId=...][@genreId=...| @artistId=...| @albumArtistId=...]
     *
     */
    async explodeUri(uri) {
        JellyfinContext_1.default.getLogger().info(`[jellyfin-browse] explodeUri: ${uri}`);
        const handler = await __classPrivateFieldGet(this, _BrowseController_instances, "m", _BrowseController_getHandler).call(this, uri);
        return handler.explode();
    }
}
exports.default = BrowseController;
_BrowseController_connectionManager = new WeakMap(), _BrowseController_instances = new WeakSet(), _BrowseController_getHandler = function _BrowseController_getHandler(uri) {
    return ViewHandlerFactory_1.default.getHandler(uri, __classPrivateFieldGet(this, _BrowseController_connectionManager, "f"));
};
//# sourceMappingURL=index.js.map