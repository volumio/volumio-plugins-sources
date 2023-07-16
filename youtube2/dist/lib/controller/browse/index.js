"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _BrowseController_instances, _BrowseController_getHandler;
Object.defineProperty(exports, "__esModule", { value: true });
const YouTube2Context_1 = __importDefault(require("../../YouTube2Context"));
const ExplodeHelper_1 = __importDefault(require("../../util/ExplodeHelper"));
const ViewHandlerFactory_1 = __importDefault(require("./view-handlers/ViewHandlerFactory"));
class BrowseController {
    constructor() {
        _BrowseController_instances.add(this);
    }
    /*
     *  Uri follows a hierarchical view structure, starting with 'youtube2'.
     * - If nothing follows 'youtube2', the view would be 'root'.
     *
     * After 'youtube2/', the uri consists of segments representing the following views:
     * - generic[@endpoint=...]
     * - playlist[@endpoint=...]
     * - search[@query=...] | [@endpoint=...[@continuation=...]]
     * - (Supporting view) optionSelection[@option=...] | [@fromContinuationBundle=...@continuationBundle=...]
     * ...
     *
     */
    async browseUri(uri) {
        YouTube2Context_1.default.getLogger().info(`[youtube2-browse] browseUri: ${uri}`);
        const handler = __classPrivateFieldGet(this, _BrowseController_instances, "m", _BrowseController_getHandler).call(this, uri);
        try {
            return await handler.browse();
        }
        catch (error) {
            YouTube2Context_1.default.getLogger().error(YouTube2Context_1.default.getErrorMessage('', error, true));
            throw error;
        }
    }
    /**
     * Explodable uris:
     * - video[@explodeTrackData=...]
     * - playlist[@endpoint=...]
     * - generic[@endpoint=...]
     *
     * Legacy (pre v1.0) uris:
     * - video[@videoId=...][@fromPlaylistId=...]
     * - videos[@playlistId=...]
     * - playlists[@channelId=...]
     *
     * Legacy uris will be converted to current format
     */
    async explodeUri(uri) {
        YouTube2Context_1.default.getLogger().info(`[youtube2-browse] explodeUri: ${uri}`);
        if (!ExplodeHelper_1.default.validateExplodeUri(uri)) {
            // Try convert from legacy
            const convertedUri = await ExplodeHelper_1.default.convertLegacyExplodeUri(uri);
            if (!convertedUri) {
                YouTube2Context_1.default.getLogger().error(`[youtube2-browse] Could not explode URI: ${uri}`);
                YouTube2Context_1.default.toast('error', YouTube2Context_1.default.getI18n('YOUTUBE2_ERR_INVALID_URI'));
                throw Error(YouTube2Context_1.default.getI18n('YOUTUBE2_ERR_INVALID_URI'));
            }
            YouTube2Context_1.default.getLogger().info(`[youtube2-browse] Converted legacy explode URI to: ${convertedUri}`);
            return this.explodeUri(convertedUri);
        }
        const handler = __classPrivateFieldGet(this, _BrowseController_instances, "m", _BrowseController_getHandler).call(this, uri);
        try {
            return await handler.explode();
        }
        catch (error) {
            YouTube2Context_1.default.getLogger().error(YouTube2Context_1.default.getErrorMessage('', error, true));
            throw error;
        }
    }
}
exports.default = BrowseController;
_BrowseController_instances = new WeakSet(), _BrowseController_getHandler = function _BrowseController_getHandler(uri) {
    return ViewHandlerFactory_1.default.getHandler(uri);
};
//# sourceMappingURL=index.js.map