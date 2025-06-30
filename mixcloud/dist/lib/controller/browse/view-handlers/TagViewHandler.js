"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _TagViewHandler_instances, _TagViewHandler_browseSearchResults, _TagViewHandler_getTagList;
Object.defineProperty(exports, "__esModule", { value: true });
const MixcloudContext_1 = __importDefault(require("../../../MixcloudContext"));
const model_1 = require("../../../model");
const UIHelper_1 = __importDefault(require("../../../util/UIHelper"));
const renderers_1 = require("./renderers");
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
class TagViewHandler extends BaseViewHandler_1.default {
    constructor() {
        super(...arguments);
        _TagViewHandler_instances.add(this);
    }
    browse() {
        const view = this.currentView;
        if (view.keywords) {
            return __classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_browseSearchResults).call(this, view.keywords);
        }
        throw Error('Operation not supported');
    }
}
_TagViewHandler_instances = new WeakSet(), _TagViewHandler_browseSearchResults = async function _TagViewHandler_browseSearchResults(keywords) {
    const view = this.currentView;
    const tagParams = {
        keywords,
        limit: view.inSection ? MixcloudContext_1.default.getConfigValue('itemsPerSection') : MixcloudContext_1.default.getConfigValue('itemsPerPage')
    };
    if (view.pageRef) {
        tagParams.pageToken = view.pageRef.pageToken;
        tagParams.pageOffset = view.pageRef.pageOffset;
    }
    const tags = await this.getModel(model_1.ModelType.Tag).getTags(tagParams);
    const lists = [__classPrivateFieldGet(this, _TagViewHandler_instances, "m", _TagViewHandler_getTagList).call(this, tags)];
    let title;
    if (this.currentView.inSection) {
        title = MixcloudContext_1.default.getI18n(UIHelper_1.default.supportsEnhancedTitles() ? 'MIXCLOUD_TAGS' : 'MIXCLOUD_TAGS_FULL');
    }
    else {
        title = MixcloudContext_1.default.getI18n(UIHelper_1.default.supportsEnhancedTitles() ? 'MIXCLOUD_TAGS_MATCHING' : 'MIXCLOUD_TAGS_MATCHING_FULL', keywords);
    }
    lists[0].title = UIHelper_1.default.addMixcloudIconToListTitle(title);
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            lists
        }
    };
}, _TagViewHandler_getTagList = function _TagViewHandler_getTagList(tags) {
    const renderer = this.getRenderer(renderers_1.RendererType.Slug);
    const items = tags.items.reduce((result, tag) => {
        const rendered = renderer.renderToListItem(tag);
        if (rendered) {
            result.push(rendered);
        }
        return result;
    }, []);
    const nextPageRef = this.constructPageRef(tags.nextPageToken, tags.nextPageOffset);
    if (nextPageRef) {
        const nextUri = this.constructNextUri(nextPageRef);
        items.push(this.constructNextPageItem(nextUri));
    }
    return {
        availableListViews: ['list', 'grid'],
        items
    };
};
exports.default = TagViewHandler;
//# sourceMappingURL=TagViewHandler.js.map