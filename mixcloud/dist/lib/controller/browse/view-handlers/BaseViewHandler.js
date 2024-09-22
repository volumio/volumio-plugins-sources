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
var _BaseViewHandler_instances, _BaseViewHandler_uri, _BaseViewHandler_currentView, _BaseViewHandler_previousViews, _BaseViewHandler_models, _BaseViewHandler_renderers, _BaseViewHandler_constructSelectOptionValueUri;
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = __importStar(require("../../../model"));
const UIHelper_1 = __importStar(require("../../../util/UIHelper"));
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
                case model_1.ModelType.Cloudcast:
                    model = model_1.default.getInstance(model_1.ModelType.Cloudcast);
                    break;
                case model_1.ModelType.Discover:
                    model = model_1.default.getInstance(model_1.ModelType.Discover);
                    break;
                case model_1.ModelType.Playlist:
                    model = model_1.default.getInstance(model_1.ModelType.Playlist);
                    break;
                case model_1.ModelType.Tag:
                    model = model_1.default.getInstance(model_1.ModelType.Tag);
                    break;
                case model_1.ModelType.User:
                    model = model_1.default.getInstance(model_1.ModelType.User);
                    break;
                case model_1.ModelType.LiveStream:
                    model = model_1.default.getInstance(model_1.ModelType.LiveStream);
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
                case renderers_1.RendererType.Cloudcast:
                    renderer = renderers_1.default.getInstance(renderers_1.RendererType.Cloudcast, __classPrivateFieldGet(this, _BaseViewHandler_uri, "f"), __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"), __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f"));
                    break;
                case renderers_1.RendererType.Playlist:
                    renderer = renderers_1.default.getInstance(renderers_1.RendererType.Playlist, __classPrivateFieldGet(this, _BaseViewHandler_uri, "f"), __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"), __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f"));
                    break;
                case renderers_1.RendererType.Slug:
                    renderer = renderers_1.default.getInstance(renderers_1.RendererType.Slug, __classPrivateFieldGet(this, _BaseViewHandler_uri, "f"), __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"), __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f"));
                    break;
                case renderers_1.RendererType.User:
                    renderer = renderers_1.default.getInstance(renderers_1.RendererType.User, __classPrivateFieldGet(this, _BaseViewHandler_uri, "f"), __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"), __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f"));
                    break;
                case renderers_1.RendererType.LiveStream:
                    renderer = renderers_1.default.getInstance(renderers_1.RendererType.LiveStream, __classPrivateFieldGet(this, _BaseViewHandler_uri, "f"), __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f"), __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f"));
                    break;
                default:
                    throw Error(`Unknown renderer type: ${type}`);
            }
            __classPrivateFieldGet(this, _BaseViewHandler_renderers, "f")[type] = renderer;
        }
        return __classPrivateFieldGet(this, _BaseViewHandler_renderers, "f")[type];
    }
    constructPrevUri() {
        const segments = __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f").map(((view) => ViewHelper_1.default.constructUriSegmentFromView(view)));
        const currentView = __classPrivateFieldGet(this, _BaseViewHandler_currentView, "f");
        if (currentView.pageRef) {
            const newView = { ...currentView };
            delete newView.pageRef;
            delete newView.prevPageRefs;
            if (currentView.prevPageRefs) {
                const prevPageRefs = [...currentView.prevPageRefs];
                const prevPageRef = prevPageRefs.pop();
                if (prevPageRef && prevPageRefs.length > 0) {
                    newView.prevPageRefs = prevPageRefs;
                }
                if (prevPageRef) {
                    newView.pageRef = prevPageRef;
                }
            }
            segments.push(ViewHelper_1.default.constructUriSegmentFromView(newView));
        }
        return segments.join('/');
    }
    constructNextUri(nextPageRef) {
        const segments = __classPrivateFieldGet(this, _BaseViewHandler_previousViews, "f").map(((view) => ViewHelper_1.default.constructUriSegmentFromView(view)));
        const newView = { ...__classPrivateFieldGet(this, _BaseViewHandler_currentView, "f") };
        if (__classPrivateFieldGet(this, _BaseViewHandler_currentView, "f").prevPageRefs) {
            newView.prevPageRefs = [...__classPrivateFieldGet(this, _BaseViewHandler_currentView, "f").prevPageRefs];
        }
        else {
            newView.prevPageRefs = [];
        }
        if (newView.pageRef) {
            newView.prevPageRefs.push(newView.pageRef);
        }
        newView.pageRef = nextPageRef;
        segments.push(ViewHelper_1.default.constructUriSegmentFromView(newView));
        return segments.join('/');
    }
    constructNextPageItem(nextUri, title) {
        if (!title) {
            title = UIHelper_1.default.getMoreText();
        }
        return {
            service: 'mixcloud',
            type: 'item-no-menu',
            title,
            uri: `${nextUri}@noExplode=1`,
            icon: 'fa fa-arrow-circle-right'
        };
    }
    constructPrevViewLink(text) {
        const backUri = ViewHelper_1.default.constructUriFromViews(this.previousViews);
        const icon = {
            type: 'fa',
            class: 'fa fa-arrow-circle-left',
            color: '#54c688'
        };
        return UIHelper_1.default.constructBrowsePageLink(text, backUri, icon);
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
    constructGoToViewLink(text, uri) {
        const icon = {
            type: 'fa',
            class: 'fa fa-arrow-circle-right',
            float: 'right',
            color: '#54c688'
        };
        return UIHelper_1.default.constructBrowsePageLink(text, uri, icon);
    }
    getCloudcastList(cloudcasts, showMoreFromUser = false) {
        const renderer = this.getRenderer(renderers_1.RendererType.Cloudcast);
        const items = cloudcasts.items.reduce((result, cloudcast) => {
            const rendered = renderer.renderToListItem(cloudcast, 'folder', showMoreFromUser);
            if (rendered) {
                result.push(rendered);
            }
            return result;
        }, []);
        const nextPageRef = this.constructPageRef(cloudcasts.nextPageToken, cloudcasts.nextPageOffset);
        if (nextPageRef) {
            const nextUri = this.constructNextUri(nextPageRef);
            items.push(this.constructNextPageItem(nextUri));
        }
        return {
            availableListViews: ['list', 'grid'],
            items
        };
    }
    async browseOptionValues(params) {
        const option = params.targetOption;
        const bundle = await params.getOptionBundle();
        const optBundleEntry = bundle[option];
        if (!optBundleEntry) {
            throw Error(`Option ${option} not found!`);
        }
        const currentValue = this.currentView[option];
        const items = optBundleEntry.values.reduce((result, opt) => {
            const isSelected = opt.value === currentValue;
            const title = isSelected ? UIHelper_1.default.styleText(opt.name, UIHelper_1.UI_STYLES.LIST_ITEM_SELECTED) : opt.name;
            result.push({
                service: 'mixcloud',
                type: 'item-no-menu',
                title,
                icon: isSelected ? 'fa fa-check' : 'fa',
                uri: __classPrivateFieldGet(this, _BaseViewHandler_instances, "m", _BaseViewHandler_constructSelectOptionValueUri).call(this, option, opt.value)
            });
            return result;
        }, []);
        let listTitle = optBundleEntry.name;
        listTitle = UIHelper_1.default.addIconToListTitle(optBundleEntry.icon, listTitle);
        const lists = [{
                title: listTitle,
                availableListViews: ['list'],
                items
            }];
        return {
            navigation: {
                prev: { uri: this.constructPrevUri() },
                lists
            }
        };
    }
    async getOptionList(params) {
        const baseUri = ViewHelper_1.default.constructUriFromViews([
            ...this.previousViews,
            { ...this.currentView, ...params.currentSelected }
        ]);
        const items = [];
        const bundle = await params.getOptionBundle();
        for (const optKey of Object.keys(bundle)) {
            const currentValue = params.currentSelected[optKey];
            if (currentValue !== undefined) {
                const optBundleEntry = bundle[optKey];
                const currentOptFromBundle = optBundleEntry.values.find((opt) => opt.value === currentValue);
                if (currentOptFromBundle) {
                    let title = currentOptFromBundle.name;
                    if (params.showOptionName && params.showOptionName(optKey)) {
                        title = UIHelper_1.default.addTextBefore(title, `${optBundleEntry.name}: `, UIHelper_1.UI_STYLES.PARAMS_LIST_ITEM_NAME);
                    }
                    items.push({
                        service: 'mixcloud',
                        type: 'item-no-menu',
                        title,
                        icon: optBundleEntry.icon,
                        uri: `${baseUri}@select=${optKey}`
                    });
                }
            }
        }
        if (items.length > 0) {
            return {
                availableListViews: ['list'],
                items
            };
        }
        return null;
    }
}
_BaseViewHandler_uri = new WeakMap(), _BaseViewHandler_currentView = new WeakMap(), _BaseViewHandler_previousViews = new WeakMap(), _BaseViewHandler_models = new WeakMap(), _BaseViewHandler_renderers = new WeakMap(), _BaseViewHandler_instances = new WeakSet(), _BaseViewHandler_constructSelectOptionValueUri = function _BaseViewHandler_constructSelectOptionValueUri(option, value) {
    const newView = { ...this.currentView };
    if (newView[option] !== value) {
        delete newView.pageRef;
        delete newView.prevPageRefs;
        newView[option] = value;
    }
    delete newView.select;
    return ViewHelper_1.default.constructUriFromViews([...this.previousViews, newView]);
};
exports.default = BaseViewHandler;
//# sourceMappingURL=BaseViewHandler.js.map