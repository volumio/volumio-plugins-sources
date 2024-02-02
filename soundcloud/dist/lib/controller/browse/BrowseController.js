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
const SoundCloudContext_1 = __importDefault(require("../../SoundCloudContext"));
const ViewHandlerFactory_1 = __importDefault(require("./view-handlers/ViewHandlerFactory"));
class BrowseController {
    constructor() {
        _BrowseController_instances.add(this);
    }
    /*
     * `uri` follows a hierarchical view structure, starting with 'soundcloud'.
     * - If nothing follows 'soundcloud', the view would be 'root' (show root items)
     *
     * After 'soundcloud', the uri consists of segments representing the following views:
     * - selections[@selectionId=...][@pageRef=...][@prevPageRefs=...]
     * - users[@userId=...|@search=...][@title=...][@pageRef=...][@prevPageRefs=...]
     * - playlists[@playlistId=...[@type=...]|@userId=...|@search=...][@title=...][@pageRef=...][@prevPageRefs=...]
     * - albums[@albumId=...|@userId=...|@search=...][@title=...][@pageRef=...][@prevPageRefs=...]
     * - tracks[@userId=...|@search=...|@topFeatured=1][@title=...][@pageRef=...][@prevPageRefs=...]
     */
    async browseUri(uri) {
        SoundCloudContext_1.default.getLogger().info(`[soundcloud] browseUri: ${uri}`);
        const handler = __classPrivateFieldGet(this, _BrowseController_instances, "m", _BrowseController_getHandler).call(this, uri);
        try {
            return await handler.browse();
        }
        catch (error) {
            SoundCloudContext_1.default.getLogger().error(SoundCloudContext_1.default.getErrorMessage('[soundcloud] browseUri error:', error, true));
            /**
             * Toast error message despite chance it might not show up because Volumio
             * pushes its generic 'No Results' toast which might overlay this one.
             */
            SoundCloudContext_1.default.toast('error', SoundCloudContext_1.default.getErrorMessage('', error, false));
            throw error;
        }
    }
    /**
     * Explodable uris:
     * - track[@trackId=...]
     * - playlists[@playlistId=...]
     * - albums[@albumId=...]
     * - users[@userId=...]
     */
    async explodeUri(uri) {
        SoundCloudContext_1.default.getLogger().info(`[soundcloud] explodeUri: ${uri}`);
        const handler = __classPrivateFieldGet(this, _BrowseController_instances, "m", _BrowseController_getHandler).call(this, uri);
        try {
            return await handler.explode();
        }
        catch (error) {
            SoundCloudContext_1.default.getLogger().error(SoundCloudContext_1.default.getErrorMessage('[soundcloud] explodeUri error:', error, true));
            throw error;
        }
    }
}
exports.default = BrowseController;
_BrowseController_instances = new WeakSet(), _BrowseController_getHandler = function _BrowseController_getHandler(uri) {
    return ViewHandlerFactory_1.default.getHandler(uri);
};
//# sourceMappingURL=BrowseController.js.map