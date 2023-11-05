"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _HistoryViewHandler_instances, _HistoryViewHandler_browseType, _HistoryViewHandler_getRenderer;
Object.defineProperty(exports, "__esModule", { value: true });
const SoundCloudContext_1 = __importDefault(require("../../../SoundCloudContext"));
const model_1 = require("../../../model");
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const ViewHandlerFactory_1 = __importDefault(require("./ViewHandlerFactory"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const renderers_1 = require("./renderers");
class HistoryViewHandler extends BaseViewHandler_1.default {
    constructor() {
        super(...arguments);
        _HistoryViewHandler_instances.add(this);
    }
    async browse() {
        const { type, inSection } = this.currentView;
        if (type) {
            return __classPrivateFieldGet(this, _HistoryViewHandler_instances, "m", _HistoryViewHandler_browseType).call(this, type, !!inSection);
        }
        const setsView = {
            name: 'history',
            type: 'set',
            inSection: '1'
        };
        const setsUri = `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(setsView, true)}`;
        const tracksView = {
            name: 'history',
            type: 'track',
            inSection: '1'
        };
        const tracksUri = `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(tracksView, true)}`;
        const pages = await Promise.all([
            ViewHandlerFactory_1.default.getHandler(setsUri).browse(),
            ViewHandlerFactory_1.default.getHandler(tracksUri).browse()
        ]);
        return {
            navigation: {
                prev: { uri: this.constructPrevUri() },
                lists: [
                    ...(pages[0].navigation?.lists || []),
                    ...(pages[1].navigation?.lists || [])
                ]
            }
        };
    }
}
exports.default = HistoryViewHandler;
_HistoryViewHandler_instances = new WeakSet(), _HistoryViewHandler_browseType = async function _HistoryViewHandler_browseType(type, inSection) {
    const { pageRef } = this.currentView;
    const pageToken = pageRef?.pageToken;
    const pageOffset = pageRef?.pageOffset;
    const modelParams = { type };
    if (pageToken) {
        modelParams.pageToken = pageRef.pageToken;
    }
    if (pageOffset) {
        modelParams.pageOffset = pageRef.pageOffset;
    }
    if (inSection) {
        modelParams.limit = SoundCloudContext_1.default.getConfigValue('itemsPerSection');
    }
    else {
        modelParams.limit = SoundCloudContext_1.default.getConfigValue('itemsPerPage');
    }
    const items = await this.getModel(model_1.ModelType.History).getPlayHistory(modelParams);
    const page = this.buildPageFromLoopFetchResult(items, {
        getRenderer: __classPrivateFieldGet(this, _HistoryViewHandler_instances, "m", _HistoryViewHandler_getRenderer).bind(this),
        title: type === 'track' ? SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_RECENTLY_PLAYED_TRACKS') : SoundCloudContext_1.default.getI18n('SOUNDCLOUD_LIST_TITLE_RECENTLY_PLAYED')
    });
    return page;
}, _HistoryViewHandler_getRenderer = function _HistoryViewHandler_getRenderer(item) {
    if (item.type === 'album') {
        return this.getRenderer(renderers_1.RendererType.Album);
    }
    else if (item.type === 'playlist' || item.type === 'system-playlist') {
        return this.getRenderer(renderers_1.RendererType.Playlist);
    }
    else if (item.type === 'track') {
        return this.getRenderer(renderers_1.RendererType.Track);
    }
    return null;
};
//# sourceMappingURL=HistoryViewHandler.js.map