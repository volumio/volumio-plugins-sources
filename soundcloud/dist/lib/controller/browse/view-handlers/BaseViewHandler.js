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
var _BaseViewHandler_instances, _BaseViewHandler_uri, _BaseViewHandler_currentView, _BaseViewHandler_previousViews, _BaseViewHandler_models, _BaseViewHandler_renderers, _BaseViewHandler_constructNextUri;
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../../../SoundCloudContext"));
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
                case model_1.ModelType.Album:
                    model = model_1.default.getInstance(model_1.ModelType.Album);
                    break;
                case model_1.ModelType.Selection:
                    model = model_1.default.getInstance(model_1.ModelType.Selection);
                    break;
                case model_1.ModelType.Track:
                    model = model_1.default.getInstance(model_1.ModelType.Track);
                    break;
                case model_1.ModelType.Playlist:
                    model = model_1.default.getInstance(model_1.ModelType.Playlist);
                    break;
                case model_1.ModelType.User:
                    model = model_1.default.getInstance(model_1.ModelType.User);
                    break;
                case model_1.ModelType.History:
                    model = model_1.default.getInstance(model_1.ModelType.History);
                    break;
                case model_1.ModelType.Me:
                    model = model_1.default.getInstance(model_1.ModelType.Me);
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
                case renderers_1.RendererType.Album:
                    renderer = renderers_1.default.getInstance(renderers_1.RendererType.Album, __classPrivateFieldGet(this, _BaseViewHandler_uri, "f"), __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"), __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f"));
                    break;
                case renderers_1.RendererType.Playlist:
                    renderer = renderers_1.default.getInstance(renderers_1.RendererType.Playlist, __classPrivateFieldGet(this, _BaseViewHandler_uri, "f"), __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"), __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f"));
                    break;
                case renderers_1.RendererType.Track:
                    renderer = renderers_1.default.getInstance(renderers_1.RendererType.Track, __classPrivateFieldGet(this, _BaseViewHandler_uri, "f"), __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"), __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f"));
                    break;
                case renderers_1.RendererType.User:
                    renderer = renderers_1.default.getInstance(renderers_1.RendererType.User, __classPrivateFieldGet(this, _BaseViewHandler_uri, "f"), __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"), __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f"));
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
    constructNextPageItem(data) {
        return {
            service: 'soundcloud',
            type: 'item-no-menu',
            'title': SoundCloudContext_1.default.getI18n('SOUNDCLOUD_MORE'),
            'uri': typeof data === 'string' ? data : __classPrivateFieldGet(this, _BaseViewHandler_instances, "m", _BaseViewHandler_constructNextUri).call(this, data),
            'icon': 'fa fa-arrow-circle-right'
        };
    }
    constructPageRef(pageToken, pageOffset) {
        if (!pageToken && !pageOffset) {
            return null;
        }
        return {
            pageToken: pageToken || '',
            pageOffset: pageOffset || 0
        };
    }
    addLinkToListTitle(title = '', link, linkText) {
        if (!ViewHelper_1.default.supportsEnhancedTitles()) {
            return title;
        }
        return `<div style="display: flex; width: 100%; align-items: baseline;">
            <div>${title}</div>
            <div style="flex-grow: 1; text-align: right; font-size: small;">
            <i class="fa fa-soundcloud" style="position: relative; top: 1px; margin-right: 2px; font-size: 16px;"></i>
            <a target="_blank" style="color: #50b37d;" href="${link}">
                ${linkText}
            </a>
            </div>
        </div>
    `;
    }
    buildPageFromLoopFetchResult(result, params) {
        const { title = '' } = params;
        const listItems = result.items.reduce((result, item) => {
            let rendered = null;
            if (params.getRenderer) {
                const renderer = params.getRenderer(item);
                rendered = renderer?.renderToListItem(item) || null;
            }
            else if (params.render) {
                rendered = params.render(item);
            }
            else if (params.renderer) {
                rendered = params.renderer.renderToListItem(item);
            }
            if (rendered) {
                result.push(rendered);
            }
            return result;
        }, []);
        const nextPageRef = this.constructPageRef(result.nextPageToken, result.nextPageOffset);
        if (nextPageRef) {
            listItems.push(this.constructNextPageItem(nextPageRef));
        }
        const list = {
            title: this.currentView.title || title,
            availableListViews: ['list', 'grid'],
            items: listItems
        };
        return {
            navigation: {
                prev: { uri: this.constructPrevUri() },
                lists: [list]
            }
        };
    }
}
exports.default = BaseViewHandler;
_BaseViewHandler_uri = new WeakMap(), _BaseViewHandler_currentView = new WeakMap(), _BaseViewHandler_previousViews = new WeakMap(), _BaseViewHandler_models = new WeakMap(), _BaseViewHandler_renderers = new WeakMap(), _BaseViewHandler_instances = new WeakSet(), _BaseViewHandler_constructNextUri = function _BaseViewHandler_constructNextUri(nextPageRef) {
    const segments = __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f").map((view) => ViewHelper_1.default.constructUriSegmentFromView(view));
    const newView = {
        ...__classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"),
        pageRef: nextPageRef,
        noExplode: '1'
    };
    const prevPageRefs = __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f").prevPageRefs || [];
    if (__classPrivateFieldGet(this, _BaseViewHandler_currentView, "f").pageRef) {
        prevPageRefs.push(__classPrivateFieldGet(this, _BaseViewHandler_currentView, "f").pageRef);
    }
    if (prevPageRefs.length > 0) {
        newView.prevPageRefs = prevPageRefs;
    }
    else {
        delete newView.prevPageRefs;
    }
    segments.push(`${ViewHelper_1.default.constructUriSegmentFromView(newView, ['noExplode'])}`);
    return segments.join('/');
};
//# sourceMappingURL=BaseViewHandler.js.map