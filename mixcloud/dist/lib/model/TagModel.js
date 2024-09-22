"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _TagModel_instances, _TagModel_getTagsFetchPromise, _TagModel_getTagsFromFetchResult, _TagModel_getNextPageTokenFromTagsFetchResult, _TagModel_convertFetchedTagToEntity, _TagModel_onGetTagsLoopFetchEnd;
Object.defineProperty(exports, "__esModule", { value: true });
const mixcloud_fetch_1 = __importDefault(require("mixcloud-fetch"));
const MixcloudContext_1 = __importDefault(require("../MixcloudContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const EntityConverter_1 = __importDefault(require("../util/EntityConverter"));
class TagModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _TagModel_instances.add(this);
    }
    getTags(params) {
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: __classPrivateFieldGet(this, _TagModel_instances, "m", _TagModel_getTagsFetchPromise).bind(this),
            getItemsFromFetchResult: __classPrivateFieldGet(this, _TagModel_instances, "m", _TagModel_getTagsFromFetchResult).bind(this),
            getNextPageTokenFromFetchResult: __classPrivateFieldGet(this, _TagModel_instances, "m", _TagModel_getNextPageTokenFromTagsFetchResult).bind(this),
            convertToEntity: __classPrivateFieldGet(this, _TagModel_instances, "m", _TagModel_convertFetchedTagToEntity).bind(this),
            onEnd: __classPrivateFieldGet(this, _TagModel_instances, "m", _TagModel_onGetTagsLoopFetchEnd).bind(this),
            pageOffset: params.pageOffset,
            pageToken: params.pageToken,
            limit: params.limit
        });
    }
}
_TagModel_instances = new WeakSet(), _TagModel_getTagsFetchPromise = function _TagModel_getTagsFetchPromise(params) {
    const cacheParams = {
        keywords: params.keywords,
        limit: params.limit,
        pageToken: params.pageToken
    };
    return MixcloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('tags', cacheParams), () => mixcloud_fetch_1.default.search(params.keywords).getTags({
        limit: params.limit,
        pageToken: params.pageToken
    }));
}, _TagModel_getTagsFromFetchResult = function _TagModel_getTagsFromFetchResult(result) {
    return result.items.slice(0);
}, _TagModel_getNextPageTokenFromTagsFetchResult = function _TagModel_getNextPageTokenFromTagsFetchResult(result) {
    return result.nextPageToken && result.items.length > 0 ? result.nextPageToken : null;
}, _TagModel_convertFetchedTagToEntity = function _TagModel_convertFetchedTagToEntity(item) {
    return EntityConverter_1.default.convertSlugLike(item);
}, _TagModel_onGetTagsLoopFetchEnd = function _TagModel_onGetTagsLoopFetchEnd(result, lastFetchResult) {
    return {
        ...result,
        params: lastFetchResult.params
    };
};
exports.default = TagModel;
//# sourceMappingURL=TagModel.js.map