"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _LiveStreamViewHandler_instances, _LiveStreamViewHandler_browseLiveStreams, _LiveStreamViewHandler_getLiveStreamList, _LiveStreamViewHandler_browseLiveStreamOptions;
Object.defineProperty(exports, "__esModule", { value: true });
const MixcloudContext_1 = __importDefault(require("../../../MixcloudContext"));
const model_1 = require("../../../model");
const ExplodableViewHandler_1 = __importDefault(require("./ExplodableViewHandler"));
const renderers_1 = require("./renderers");
const UIHelper_1 = __importDefault(require("../../../util/UIHelper"));
class LiveStreamViewHandler extends ExplodableViewHandler_1.default {
    constructor() {
        super(...arguments);
        _LiveStreamViewHandler_instances.add(this);
    }
    browse() {
        const view = this.currentView;
        if (view.select) {
            return __classPrivateFieldGet(this, _LiveStreamViewHandler_instances, "m", _LiveStreamViewHandler_browseLiveStreamOptions).call(this, view.select);
        }
        return __classPrivateFieldGet(this, _LiveStreamViewHandler_instances, "m", _LiveStreamViewHandler_browseLiveStreams).call(this);
    }
    async getStreamableEntitiesOnExplode() {
        const view = this.currentView;
        if (!view.username) {
            throw Error('Operation not supported');
        }
        const liveStream = await this.getModel(model_1.ModelType.LiveStream).getLiveStream(view.username);
        if (!liveStream) {
            return [];
        }
        return liveStream;
    }
}
_LiveStreamViewHandler_instances = new WeakSet(), _LiveStreamViewHandler_browseLiveStreams = async function _LiveStreamViewHandler_browseLiveStreams() {
    const view = this.currentView;
    const liveStreamParams = {
        category: view.category || '',
        limit: view.inSection ? MixcloudContext_1.default.getConfigValue('itemsPerSection') : MixcloudContext_1.default.getConfigValue('itemsPerPage')
    };
    if (view.pageRef) {
        liveStreamParams.pageToken = view.pageRef.pageToken;
        liveStreamParams.pageOffset = view.pageRef.pageOffset;
    }
    if (view.orderBy) {
        liveStreamParams.orderBy = view.orderBy;
    }
    const liveStreamModel = this.getModel(model_1.ModelType.LiveStream);
    const liveStreams = await liveStreamModel.getLiveStreams(liveStreamParams);
    const lists = [];
    if (liveStreams.items.length > 0) {
        const optionList = await this.getOptionList({
            getOptionBundle: async () => liveStreamModel.getLiveStreamsOptions(),
            currentSelected: liveStreams.params
        });
        if (optionList) {
            lists.push(optionList);
        }
        lists.push(__classPrivateFieldGet(this, _LiveStreamViewHandler_instances, "m", _LiveStreamViewHandler_getLiveStreamList).call(this, liveStreams));
        lists[0].title = UIHelper_1.default.addMixcloudIconToListTitle(MixcloudContext_1.default.getI18n('MIXCLOUD_LIVE_STREAMING_NOW'));
    }
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            lists
        }
    };
}, _LiveStreamViewHandler_getLiveStreamList = function _LiveStreamViewHandler_getLiveStreamList(liveStreams) {
    const renderer = this.getRenderer(renderers_1.RendererType.LiveStream);
    const items = liveStreams.items.reduce((result, liveStream) => {
        const rendered = renderer.renderToListItem({
            ...liveStream
        });
        if (rendered) {
            result.push(rendered);
        }
        return result;
    }, []);
    const nextPageRef = this.constructPageRef(liveStreams.nextPageToken, liveStreams.nextPageOffset);
    if (nextPageRef) {
        const nextUri = this.constructNextUri(nextPageRef);
        items.push(this.constructNextPageItem(nextUri));
    }
    return {
        availableListViews: ['list', 'grid'],
        items
    };
}, _LiveStreamViewHandler_browseLiveStreamOptions = function _LiveStreamViewHandler_browseLiveStreamOptions(option) {
    return this.browseOptionValues({
        getOptionBundle: async () => this.getModel(model_1.ModelType.LiveStream).getLiveStreamsOptions(),
        targetOption: option
    });
};
exports.default = LiveStreamViewHandler;
//# sourceMappingURL=LiveStreamViewHandler.js.map