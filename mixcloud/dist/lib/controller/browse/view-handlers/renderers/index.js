"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RendererType = void 0;
const CloudcastRenderer_1 = __importDefault(require("./CloudcastRenderer"));
const LiveStreamRenderer_1 = __importDefault(require("./LiveStreamRenderer"));
const PlaylistRenderer_1 = __importDefault(require("./PlaylistRenderer"));
const SlugRenderer_1 = __importDefault(require("./SlugRenderer"));
const UserRenderer_1 = __importDefault(require("./UserRenderer"));
var RendererType;
(function (RendererType) {
    RendererType["Cloudcast"] = "Cloudcast";
    RendererType["Playlist"] = "Playlist";
    RendererType["Slug"] = "Slug";
    RendererType["User"] = "User";
    RendererType["LiveStream"] = "LiveStream";
})(RendererType || (exports.RendererType = RendererType = {}));
const RENDERER_TYPE_TO_CLASS = {
    [RendererType.Cloudcast]: CloudcastRenderer_1.default,
    [RendererType.Playlist]: PlaylistRenderer_1.default,
    [RendererType.Slug]: SlugRenderer_1.default,
    [RendererType.User]: UserRenderer_1.default,
    [RendererType.LiveStream]: LiveStreamRenderer_1.default
};
class Renderer {
    static getInstance(type, uri, currentView, previousViews) {
        if (RENDERER_TYPE_TO_CLASS[type]) {
            return new RENDERER_TYPE_TO_CLASS[type](uri, currentView, previousViews);
        }
        throw Error(`Renderer not found for type ${RendererType}`);
    }
}
exports.default = Renderer;
//# sourceMappingURL=index.js.map