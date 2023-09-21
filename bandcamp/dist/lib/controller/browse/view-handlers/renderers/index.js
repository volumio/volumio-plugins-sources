"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RendererType = void 0;
const AlbumRenderer_1 = __importDefault(require("./AlbumRenderer"));
const ArticleRenderer_1 = __importDefault(require("./ArticleRenderer"));
const BandRenderer_1 = __importDefault(require("./BandRenderer"));
const SearchResultParser_1 = __importDefault(require("./SearchResultParser"));
const ShowRenderer_1 = __importDefault(require("./ShowRenderer"));
const TagRenderer_1 = __importDefault(require("./TagRenderer"));
const TrackRenderer_1 = __importDefault(require("./TrackRenderer"));
var RendererType;
(function (RendererType) {
    RendererType["Album"] = "Album";
    RendererType["Article"] = "Article";
    RendererType["Band"] = "Band";
    RendererType["SearchResult"] = "Discover";
    RendererType["Show"] = "Fan";
    RendererType["Tag"] = "Search";
    RendererType["Track"] = "Show";
})(RendererType = exports.RendererType || (exports.RendererType = {}));
const RENDERER_TYPE_TO_CLASS = {
    [RendererType.Album]: AlbumRenderer_1.default,
    [RendererType.Article]: ArticleRenderer_1.default,
    [RendererType.Band]: BandRenderer_1.default,
    [RendererType.SearchResult]: SearchResultParser_1.default,
    [RendererType.Show]: ShowRenderer_1.default,
    [RendererType.Tag]: TagRenderer_1.default,
    [RendererType.Track]: TrackRenderer_1.default
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