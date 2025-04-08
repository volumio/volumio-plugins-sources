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
const MixcloudContext_1 = __importDefault(require("../../MixcloudContext"));
const ViewHandlerFactory_1 = __importDefault(require("./view-handlers/ViewHandlerFactory"));
class BrowseController {
    constructor() {
        _BrowseController_instances.add(this);
    }
    /**
     *  Uri follows a hierarchical view structure, starting with 'mixcloud'.
     * - If nothing follows 'mixcloud', the view would be 'root'.
     *
     * After 'mixcloud/', the uri consists of segments representing the following views:
     * - discover[@slug=...][@orderBy=...][@country=...]
     * - featured[@slug=...][@orderBy=...]
     * - user[@username=...]
     * - cloudcasts[@username=...[@orderBy=...]][@playlistId=...]
     * - cloudcast[@cloudcastId=...][@showMoreFromUser=1]
     * ...
     */
    async browseUri(uri) {
        MixcloudContext_1.default.getLogger().info(`[mixcloud] browseUri: ${uri}`);
        const handler = __classPrivateFieldGet(this, _BrowseController_instances, "m", _BrowseController_getHandler).call(this, uri);
        return handler.browse();
    }
    /**
     * Explodable uris:
     * - cloudcast[@cloudcastId=...][@owner=...]
     * - liveStream[@username=...]
     */
    explodeUri(uri) {
        MixcloudContext_1.default.getLogger().info(`[mixcloud] explodeUri: ${uri}`);
        const handler = __classPrivateFieldGet(this, _BrowseController_instances, "m", _BrowseController_getHandler).call(this, uri);
        return handler.explode();
    }
}
_BrowseController_instances = new WeakSet(), _BrowseController_getHandler = function _BrowseController_getHandler(uri) {
    return ViewHandlerFactory_1.default.getHandler(uri);
};
exports.default = BrowseController;
//# sourceMappingURL=index.js.map