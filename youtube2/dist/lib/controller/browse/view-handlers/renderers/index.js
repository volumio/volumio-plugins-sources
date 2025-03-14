"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RendererType = void 0;
const ChannelRenderer_1 = __importDefault(require("./ChannelRenderer"));
const EndpointLinkRenderer_1 = __importDefault(require("./EndpointLinkRenderer"));
const OptionRenderer_1 = __importDefault(require("./OptionRenderer"));
const OptionValueRenderer_1 = __importDefault(require("./OptionValueRenderer"));
const PlaylistRenderer_1 = __importDefault(require("./PlaylistRenderer"));
const VideoRenderer_1 = __importDefault(require("./VideoRenderer"));
var RendererType;
(function (RendererType) {
    RendererType["Channel"] = "Channel";
    RendererType["EndpointLink"] = "EndpointLink";
    RendererType["Option"] = "Option";
    RendererType["OptionValue"] = "OptionValue";
    RendererType["Playlist"] = "Playlist";
    RendererType["Video"] = "Video";
})(RendererType || (exports.RendererType = RendererType = {}));
const RENDERER_TYPE_TO_CLASS = {
    [RendererType.Channel]: ChannelRenderer_1.default,
    [RendererType.EndpointLink]: EndpointLinkRenderer_1.default,
    [RendererType.Option]: OptionRenderer_1.default,
    [RendererType.OptionValue]: OptionValueRenderer_1.default,
    [RendererType.Playlist]: PlaylistRenderer_1.default,
    [RendererType.Video]: VideoRenderer_1.default
};
class Renderer {
    static getInstance(type, uri, currentView, previousViews) {
        if (RENDERER_TYPE_TO_CLASS[type]) {
            return new RENDERER_TYPE_TO_CLASS[type](uri, currentView, previousViews);
        }
        throw Error(`Renderer not found for type ${String(RendererType)}`);
    }
}
exports.default = Renderer;
//# sourceMappingURL=index.js.map