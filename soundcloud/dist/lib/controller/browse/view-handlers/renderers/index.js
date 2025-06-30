"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RendererType = void 0;
const AlbumRenderer_1 = __importDefault(require("./AlbumRenderer"));
const PlaylistRenderer_1 = __importDefault(require("./PlaylistRenderer"));
const TrackRenderer_1 = __importDefault(require("./TrackRenderer"));
const UserRenderer_1 = __importDefault(require("./UserRenderer"));
var RendererType;
(function (RendererType) {
    RendererType["Album"] = "Album";
    RendererType["Playlist"] = "Playlist";
    RendererType["Track"] = "Track";
    RendererType["User"] = "User";
})(RendererType = exports.RendererType || (exports.RendererType = {}));
const RENDERER_TYPE_TO_CLASS = {
    [RendererType.Album]: AlbumRenderer_1.default,
    [RendererType.Playlist]: PlaylistRenderer_1.default,
    [RendererType.Track]: TrackRenderer_1.default,
    [RendererType.User]: UserRenderer_1.default
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