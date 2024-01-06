"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _LiveStreamModel_instances, _LiveStreamModel_getLiveStreamsFetchPromise, _LiveStreamModel_getLiveStreamsFromFetchResult, _LiveStreamModel_getNextPageTokenFromLiveStreamsFetchResult, _LiveStreamModel_convertFetchedLiveStreamToEntity, _LiveStreamModel_onGetLiveStreamsLoopFetchEnd;
Object.defineProperty(exports, "__esModule", { value: true });
const mixcloud_fetch_1 = __importDefault(require("mixcloud-fetch"));
const MixcloudContext_1 = __importDefault(require("../MixcloudContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const EntityConverter_1 = __importDefault(require("../util/EntityConverter"));
class LiveStreamModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _LiveStreamModel_instances.add(this);
    }
    getLiveStreams(params) {
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: __classPrivateFieldGet(this, _LiveStreamModel_instances, "m", _LiveStreamModel_getLiveStreamsFetchPromise).bind(this),
            getItemsFromFetchResult: __classPrivateFieldGet(this, _LiveStreamModel_instances, "m", _LiveStreamModel_getLiveStreamsFromFetchResult).bind(this),
            getNextPageTokenFromFetchResult: __classPrivateFieldGet(this, _LiveStreamModel_instances, "m", _LiveStreamModel_getNextPageTokenFromLiveStreamsFetchResult).bind(this),
            convertToEntity: __classPrivateFieldGet(this, _LiveStreamModel_instances, "m", _LiveStreamModel_convertFetchedLiveStreamToEntity).bind(this),
            onEnd: __classPrivateFieldGet(this, _LiveStreamModel_instances, "m", _LiveStreamModel_onGetLiveStreamsLoopFetchEnd).bind(this),
            pageOffset: params.pageOffset,
            pageToken: params.pageToken,
            limit: params.limit
        });
    }
    async getLiveStream(username) {
        const data = await mixcloud_fetch_1.default.user(username).getLiveStream();
        return data ? __classPrivateFieldGet(this, _LiveStreamModel_instances, "m", _LiveStreamModel_convertFetchedLiveStreamToEntity).call(this, data) : null;
    }
    async getCategories() {
        return MixcloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('liveStreamCategories'), () => mixcloud_fetch_1.default.liveStream.getCategories());
    }
    async getLiveStreamsOptions() {
        const categories = await this.getCategories();
        const categoryValues = categories.map((category) => ({
            name: category,
            value: category
        }));
        categoryValues.unshift({
            name: MixcloudContext_1.default.getI18n('MIXCLOUD_ALL_CATEGORIES'),
            value: ''
        });
        return {
            category: {
                name: MixcloudContext_1.default.getI18n('MIXCLOUD_SELECT_CATEGORY'),
                icon: 'fa fa-music',
                values: categoryValues
            },
            orderBy: {
                name: MixcloudContext_1.default.getI18n('MIXCLOUD_SELECT_ORDER_BY'),
                icon: 'fa fa-sort',
                values: [
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_ORDER_BY_POPULAR'), value: 'popular' },
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_ORDER_BY_MOST_RECENT'), value: 'mostRecent' }
                ]
            }
        };
    }
}
_LiveStreamModel_instances = new WeakSet(), _LiveStreamModel_getLiveStreamsFetchPromise = function _LiveStreamModel_getLiveStreamsFetchPromise(params) {
    // Do not cache live stream data
    return mixcloud_fetch_1.default.liveStream.getCurrent({
        category: params.category,
        orderBy: params.orderBy,
        limit: params.limit,
        pageToken: params.pageToken
    });
}, _LiveStreamModel_getLiveStreamsFromFetchResult = function _LiveStreamModel_getLiveStreamsFromFetchResult(result) {
    return result.items.slice(0);
}, _LiveStreamModel_getNextPageTokenFromLiveStreamsFetchResult = function _LiveStreamModel_getNextPageTokenFromLiveStreamsFetchResult(result) {
    return result.nextPageToken && result.items.length > 0 ? result.nextPageToken : null;
}, _LiveStreamModel_convertFetchedLiveStreamToEntity = function _LiveStreamModel_convertFetchedLiveStreamToEntity(item) {
    return EntityConverter_1.default.convertLiveStream(item);
}, _LiveStreamModel_onGetLiveStreamsLoopFetchEnd = function _LiveStreamModel_onGetLiveStreamsLoopFetchEnd(result, lastFetchResult) {
    return {
        ...result,
        params: lastFetchResult.params
    };
};
exports.default = LiveStreamModel;
//# sourceMappingURL=LiveStreamModel.js.map