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
const YTMusicContext_1 = __importDefault(require("../../YTMusicContext"));
const ExplodeHelper_1 = __importDefault(require("../../util/ExplodeHelper"));
const ViewHandlerFactory_1 = __importDefault(require("./view-handlers/ViewHandlerFactory"));
class BrowseController {
    constructor() {
        _BrowseController_instances.add(this);
    }
    /*
     *  Uri follows a hierarchical view structure, starting with 'ytmusic'.
     *  ytmusic/[viewName@param1=....@param2=...]/[viewName@param1=...@param2=...]
     *
     *  See ViewHandlerFactory for defined Views. See corresponding ViewHandler
     *  for View params.
     */
    async browseUri(uri) {
        YTMusicContext_1.default.getLogger().info(`[ytmusic-browse] browseUri: ${uri}`);
        const handler = __classPrivateFieldGet(this, _BrowseController_instances, "m", _BrowseController_getHandler).call(this, uri);
        try {
            return await handler.browse();
        }
        catch (error) {
            YTMusicContext_1.default.getLogger().error(YTMusicContext_1.default.getErrorMessage('', error, true));
            throw error;
        }
    }
    /**
     * Explodable uris:
     * - video[@explodeTrackData=...]
     * - song[@explodeTrackData=...]
     * - playlist[@endpoints=...]
     * - generic[@endpoint=...]
     *
     * Legacy (pre v1.0) uris:
     * - song[@explodeTrackData=...]
     * - video[@explodeTrackData=...]
     * - album[@albumId=...]
     * - artist[@artistId=...]
     * - playlist[@playlistId=...]
     * - generic[@endpoint=...] (endpoint must be of type 'watch_playlist')
     *
     * Legacy uris will be converted to current format
     */
    async explodeUri(uri) {
        YTMusicContext_1.default.getLogger().info(`[ytmusic-browse] explodeUri: ${uri}`);
        if (!ExplodeHelper_1.default.validateExplodeUri(uri)) {
            // Try convert from legacy
            const convertedUri = await ExplodeHelper_1.default.convertLegacyExplodeUri(uri);
            if (!convertedUri) {
                YTMusicContext_1.default.getLogger().error(`[ytmusic-browse] Could not explode URI: ${uri}`);
                YTMusicContext_1.default.toast('error', YTMusicContext_1.default.getI18n('YTMUSIC_ERR_INVALID_URI'));
                throw Error(YTMusicContext_1.default.getI18n('YTMUSIC_ERR_INVALID_URI'));
            }
            YTMusicContext_1.default.getLogger().info(`[ytmusic-browse] Converted legacy explode URI to: ${convertedUri}`);
            return this.explodeUri(convertedUri);
        }
        const handler = __classPrivateFieldGet(this, _BrowseController_instances, "m", _BrowseController_getHandler).call(this, uri);
        try {
            return await handler.explode();
        }
        catch (error) {
            YTMusicContext_1.default.getLogger().error(YTMusicContext_1.default.getErrorMessage('', error, true));
            throw error;
        }
    }
}
exports.default = BrowseController;
_BrowseController_instances = new WeakSet(), _BrowseController_getHandler = function _BrowseController_getHandler(uri) {
    return ViewHandlerFactory_1.default.getHandler(uri);
};
//# sourceMappingURL=BrowseController.js.map