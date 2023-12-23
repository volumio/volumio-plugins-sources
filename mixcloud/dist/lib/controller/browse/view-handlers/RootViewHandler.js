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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _RootViewHandler_instances, _RootViewHandler_getCategories, _RootViewHandler_getFeatured, _RootViewHandler_getLiveStreams;
Object.defineProperty(exports, "__esModule", { value: true });
const MixcloudContext_1 = __importDefault(require("../../../MixcloudContext"));
const model_1 = require("../../../model");
const UIHelper_1 = __importStar(require("../../../util/UIHelper"));
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const ViewHandlerFactory_1 = __importDefault(require("./ViewHandlerFactory"));
const renderers_1 = require("./renderers");
class RootViewHandler extends BaseViewHandler_1.default {
    constructor() {
        super(...arguments);
        _RootViewHandler_instances.add(this);
    }
    async browse() {
        const [liveStreams, categories, featured] = await Promise.all([
            __classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_getLiveStreams).call(this),
            __classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_getCategories).call(this),
            __classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_getFeatured).call(this)
        ]);
        return {
            navigation: {
                prev: { uri: '/' },
                lists: [
                    ...liveStreams,
                    ...categories,
                    ...featured
                ]
            }
        };
    }
}
_RootViewHandler_instances = new WeakSet(), _RootViewHandler_getCategories = async function _RootViewHandler_getCategories() {
    const categories = await this.getModel(model_1.ModelType.Discover).getCategories();
    const renderer = this.getRenderer(renderers_1.RendererType.Slug);
    const lists = [];
    const sections = Object.keys(categories);
    for (const section of sections) {
        const items = categories[section].reduce((result, category) => {
            const rendered = renderer.renderToListItem(category);
            if (rendered) {
                result.push(rendered);
            }
            return result;
        }, []);
        let title = MixcloudContext_1.default.getI18n('MIXCLOUD_DISCOVER_SHOWS', section);
        if (UIHelper_1.default.supportsEnhancedTitles()) {
            title = UIHelper_1.default.styleText(title, UIHelper_1.UI_STYLES.TITLE_CASE);
            title = UIHelper_1.default.addMixcloudIconToListTitle(title);
        }
        lists.push({
            title,
            availableListViews: ['list', 'grid'],
            items
        });
    }
    return lists;
}, _RootViewHandler_getFeatured = async function _RootViewHandler_getFeatured() {
    const uri = `${this.uri}/featured@inSection=1`;
    const handler = ViewHandlerFactory_1.default.getHandler(uri);
    const page = await handler.browse();
    return page.navigation?.lists || [];
}, _RootViewHandler_getLiveStreams = async function _RootViewHandler_getLiveStreams() {
    const uri = `${this.uri}/liveStreams@inSection=1`;
    const handler = ViewHandlerFactory_1.default.getHandler(uri);
    const page = await handler.browse();
    return page.navigation?.lists || [];
};
exports.default = RootViewHandler;
//# sourceMappingURL=RootViewHandler.js.map