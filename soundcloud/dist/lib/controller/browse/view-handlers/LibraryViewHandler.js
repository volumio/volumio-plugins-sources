"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _LibraryViewHandler_instances, _LibraryViewHandler_getRenderer, _LibraryViewHandler_getTitle;
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../../../SoundCloudContext"));
const model_1 = require("../../../model");
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const renderers_1 = require("./renderers");
class LibraryViewHandler extends BaseViewHandler_1.default {
    constructor() {
        super(...arguments);
        _LibraryViewHandler_instances.add(this);
    }
    async browse() {
        const { type, pageRef } = this.currentView;
        const pageToken = pageRef?.pageToken;
        const pageOffset = pageRef?.pageOffset;
        const modelParams = {
            type,
            limit: SoundCloudContext_1.default.getConfigValue('itemsPerPage')
        };
        if (pageToken) {
            modelParams.pageToken = pageRef.pageToken;
        }
        if (pageOffset) {
            modelParams.pageOffset = pageRef.pageOffset;
        }
        const items = await this.getModel(model_1.ModelType.Me).getLibraryItems(modelParams);
        const page = this.buildPageFromLoopFetchResult(items, __classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getRenderer).bind(this), __classPrivateFieldGet(this, _LibraryViewHandler_instances, "m", _LibraryViewHandler_getTitle).call(this));
        return page;
    }
}
exports.default = LibraryViewHandler;
_LibraryViewHandler_instances = new WeakSet(), _LibraryViewHandler_getRenderer = function _LibraryViewHandler_getRenderer(item) {
    if (item.type === 'album') {
        return this.getRenderer(renderers_1.RendererType.Album);
    }
    else if (item.type === 'playlist' || item.type === 'system-playlist') {
        return this.getRenderer(renderers_1.RendererType.Playlist);
    }
    return null;
}, _LibraryViewHandler_getTitle = function _LibraryViewHandler_getTitle() {
    const { type } = this.currentView;
    if (type === 'album') {
        return SoundCloudContext_1.default.getI18n('SOUNDCLOUD_ALBUMS');
    }
    else if (type === 'playlist') {
        return SoundCloudContext_1.default.getI18n('SOUNDCLOUD_PLAYLISTS');
    }
    else if (type === 'station') {
        return SoundCloudContext_1.default.getI18n('SOUNDCLOUD_STATIONS');
    }
    return undefined;
};
//# sourceMappingURL=LibraryViewHandler.js.map