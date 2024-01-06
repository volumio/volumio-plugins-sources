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
const BandcampContext_1 = __importDefault(require("../../BandcampContext"));
const ViewHandlerFactory_1 = __importDefault(require("./view-handlers/ViewHandlerFactory"));
class BrowseController {
    constructor() {
        _BrowseController_instances.add(this);
    }
    /*
     *  Uri follows a hierarchical view structure, starting with 'bandcamp'.
     * - If nothing follows 'bandcamp', the view would be 'root'.
     *
     * After 'bandcamp/', the uri consists of segments representing the following views:
     * - discover[@genre=...][@subgenre=...][@sortBy=...][@artistRecommendationType=...][@location=...][@format=...][@time=...][@pageRef=...]
     * - album[@albumUrl=...]
     * - search[@query=...][@itemType=...][@pageRef=...]
     * - band[@bandUrl=...][band.type==='label': @view=artists|discography][@pageRef=...]*
     * - track[@trackUrl=...]
     * - shows[@showUrl=...|@pageRef=...][@view=tracks|albums]
     * - tag[@tagUrl=...][@select=...][@format=...][@location=...][@sort=...][@pageRef=...]
     * - fan[@username=...][@view=collection|wishlist|followingArtistsAndLabels|followingGenres][@pageRef=...]
     *
     * *Replaces obsolete 'artist' and 'label' views
     */
    async browseUri(uri) {
        BandcampContext_1.default.getLogger().info(`[bandcamp-browse] browseUri: ${uri}`);
        const handler = __classPrivateFieldGet(this, _BrowseController_instances, "m", _BrowseController_getHandler).call(this, uri);
        return handler.browse();
    }
    /**
     * Explodable uris:
     * - track[@trackUrl=...]
     * - album[@albumUrl=...]
     * - shows[@showUrl=...]
     */
    explodeUri(uri) {
        BandcampContext_1.default.getLogger().info(`[bandcamp-browse] explodeUri: ${uri}`);
        const handler = __classPrivateFieldGet(this, _BrowseController_instances, "m", _BrowseController_getHandler).call(this, uri);
        return handler.explode();
    }
}
exports.default = BrowseController;
_BrowseController_instances = new WeakSet(), _BrowseController_getHandler = function _BrowseController_getHandler(uri) {
    return ViewHandlerFactory_1.default.getHandler(uri);
};
//# sourceMappingURL=index.js.map