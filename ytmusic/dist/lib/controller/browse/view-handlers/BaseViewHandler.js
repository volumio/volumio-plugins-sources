"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var _BaseViewHandler_instances, _BaseViewHandler_uri, _BaseViewHandler_currentView, _BaseViewHandler_previousViews, _BaseViewHandler_models, _BaseViewHandler_renderers, _BaseViewHandler_constructContinuationUri;
Object.defineProperty(exports, "__esModule", { value: true });
const YTMusicContext_1 = __importDefault(require("../../../YTMusicContext"));
const model_1 = __importStar(require("../../../model"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const renderers_1 = __importStar(require("./renderers"));
class BaseViewHandler {
    constructor(uri, currentView, previousViews) {
        _BaseViewHandler_instances.add(this);
        _BaseViewHandler_uri.set(this, void 0);
        _BaseViewHandler_currentView.set(this, void 0);
        _BaseViewHandler_previousViews.set(this, void 0);
        _BaseViewHandler_models.set(this, void 0);
        _BaseViewHandler_renderers.set(this, void 0);
        __classPrivateFieldSet(this, _BaseViewHandler_uri, uri, "f");
        __classPrivateFieldSet(this, _BaseViewHandler_currentView, currentView, "f");
        __classPrivateFieldSet(this, _BaseViewHandler_previousViews, previousViews, "f");
        __classPrivateFieldSet(this, _BaseViewHandler_models, {}, "f");
        __classPrivateFieldSet(this, _BaseViewHandler_renderers, {}, "f");
    }
    async browse() {
        return {};
    }
    explode() {
        throw Error('Operation not supported');
    }
    get uri() {
        return __classPrivateFieldGet(this, _BaseViewHandler_uri, "f");
    }
    get currentView() {
        return __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f");
    }
    get previousViews() {
        return __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f");
    }
    getModel(type) {
        if (!__classPrivateFieldGet(this, _BaseViewHandler_models, "f")[type]) {
            let model;
            switch (type) {
                case model_1.ModelType.Account:
                    model = model_1.default.getInstance(model_1.ModelType.Account);
                    break;
                case model_1.ModelType.Config:
                    model = model_1.default.getInstance(model_1.ModelType.Config);
                    break;
                case model_1.ModelType.Endpoint:
                    model = model_1.default.getInstance(model_1.ModelType.Endpoint);
                    break;
                case model_1.ModelType.Playlist:
                    model = model_1.default.getInstance(model_1.ModelType.Playlist);
                    break;
                case model_1.ModelType.Search:
                    model = model_1.default.getInstance(model_1.ModelType.Search);
                    break;
                case model_1.ModelType.MusicItem:
                    model = model_1.default.getInstance(model_1.ModelType.MusicItem);
                    break;
                default:
                    throw Error(`Unknown model type: ${type}`);
            }
            __classPrivateFieldGet(this, _BaseViewHandler_models, "f")[type] = model;
        }
        return __classPrivateFieldGet(this, _BaseViewHandler_models, "f")[type];
    }
    getRenderer(type) {
        if (!__classPrivateFieldGet(this, _BaseViewHandler_renderers, "f")[type]) {
            let renderer;
            switch (type) {
                case renderers_1.RendererType.Channel:
                    renderer = renderers_1.default.getInstance(renderers_1.RendererType.Channel, __classPrivateFieldGet(this, _BaseViewHandler_uri, "f"), __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"), __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f"));
                    break;
                case renderers_1.RendererType.EndpointLink:
                    renderer = renderers_1.default.getInstance(renderers_1.RendererType.EndpointLink, __classPrivateFieldGet(this, _BaseViewHandler_uri, "f"), __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"), __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f"));
                    break;
                case renderers_1.RendererType.Option:
                    renderer = renderers_1.default.getInstance(renderers_1.RendererType.Option, __classPrivateFieldGet(this, _BaseViewHandler_uri, "f"), __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"), __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f"));
                    break;
                case renderers_1.RendererType.OptionValue:
                    renderer = renderers_1.default.getInstance(renderers_1.RendererType.OptionValue, __classPrivateFieldGet(this, _BaseViewHandler_uri, "f"), __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"), __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f"));
                    break;
                case renderers_1.RendererType.Album:
                    renderer = renderers_1.default.getInstance(renderers_1.RendererType.Album, __classPrivateFieldGet(this, _BaseViewHandler_uri, "f"), __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"), __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f"));
                    break;
                case renderers_1.RendererType.Playlist:
                    renderer = renderers_1.default.getInstance(renderers_1.RendererType.Playlist, __classPrivateFieldGet(this, _BaseViewHandler_uri, "f"), __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"), __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f"));
                    break;
                case renderers_1.RendererType.MusicItem:
                    renderer = renderers_1.default.getInstance(renderers_1.RendererType.MusicItem, __classPrivateFieldGet(this, _BaseViewHandler_uri, "f"), __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"), __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f"));
                    break;
                default:
                    throw Error(`Unknown renderer type: ${type}`);
            }
            __classPrivateFieldGet(this, _BaseViewHandler_renderers, "f")[type] = renderer;
        }
        return __classPrivateFieldGet(this, _BaseViewHandler_renderers, "f")[type];
    }
    constructPrevUri() {
        return ViewHelper_1.default.constructPrevUri(__classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"), __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f"));
    }
    constructContinuationItem(data) {
        return {
            service: 'ytmusic',
            type: 'item-no-menu',
            'title': data.continuation.text || YTMusicContext_1.default.getI18n('YTMUSIC_MORE'),
            'uri': __classPrivateFieldGet(this, _BaseViewHandler_instances, "m", _BaseViewHandler_constructContinuationUri).call(this, data),
            'icon': 'fa fa-arrow-circle-right'
        };
    }
}
exports.default = BaseViewHandler;
_BaseViewHandler_uri = new WeakMap(), _BaseViewHandler_currentView = new WeakMap(), _BaseViewHandler_previousViews = new WeakMap(), _BaseViewHandler_models = new WeakMap(), _BaseViewHandler_renderers = new WeakMap(), _BaseViewHandler_instances = new WeakSet(), _BaseViewHandler_constructContinuationUri = function _BaseViewHandler_constructContinuationUri(data) {
    const { continuation, prevItemCount, bundle } = data;
    const endpoint = continuation.endpoint;
    const segments = __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f").map((view) => ViewHelper_1.default.constructUriSegmentFromView(view));
    const newView = {
        ...__classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"),
        continuation: { endpoint, prevItemCount }
    };
    const prevContinuations = __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f").prevContinuations || [];
    if (__classPrivateFieldGet(this, _BaseViewHandler_currentView, "f").continuation) {
        prevContinuations.push(__classPrivateFieldGet(this, _BaseViewHandler_currentView, "f").continuation);
    }
    if (prevContinuations.length > 0) {
        newView.prevContinuations = prevContinuations;
    }
    else {
        delete newView.prevContinuations;
    }
    if (bundle) {
        newView.continuationBundle = bundle;
    }
    segments.push(`${ViewHelper_1.default.constructUriSegmentFromView(newView)}@noExplode=1`);
    return segments.join('/');
};
//# sourceMappingURL=BaseViewHandler.js.map