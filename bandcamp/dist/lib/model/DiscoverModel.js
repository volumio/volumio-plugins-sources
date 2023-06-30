"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _DiscoverModel_instances, _DiscoverModel_getDiscoverResultFetchPromise, _DiscoverModel_getDiscoverItemsFromFetchResult, _DiscoverModel_getNextPageTokenFromDiscoverFetchResult, _DiscoverModel_convertFetchedDiscoverItemToEntity, _DiscoverModel_onDiscoverLoopFetchEnd;
Object.defineProperty(exports, "__esModule", { value: true });
const bandcamp_fetch_1 = __importDefault(require("bandcamp-fetch"));
const BandcampContext_1 = __importDefault(require("../BandcampContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const EntityConverter_1 = __importDefault(require("../util/EntityConverter"));
class DiscoverModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _DiscoverModel_instances.add(this);
    }
    getDiscoverResult(params) {
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: __classPrivateFieldGet(this, _DiscoverModel_instances, "m", _DiscoverModel_getDiscoverResultFetchPromise).bind(this),
            getItemsFromFetchResult: __classPrivateFieldGet(this, _DiscoverModel_instances, "m", _DiscoverModel_getDiscoverItemsFromFetchResult).bind(this),
            getNextPageTokenFromFetchResult: __classPrivateFieldGet(this, _DiscoverModel_instances, "m", _DiscoverModel_getNextPageTokenFromDiscoverFetchResult).bind(this),
            convertToEntity: __classPrivateFieldGet(this, _DiscoverModel_instances, "m", _DiscoverModel_convertFetchedDiscoverItemToEntity).bind(this),
            onEnd: __classPrivateFieldGet(this, _DiscoverModel_instances, "m", _DiscoverModel_onDiscoverLoopFetchEnd).bind(this),
            pageOffset: params.pageOffset,
            pageToken: params.pageToken,
            limit: params.limit
        });
    }
    getDiscoverOptions() {
        return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('discoverOptions'), () => bandcamp_fetch_1.default.limiter.discovery.getAvailableOptions());
    }
}
exports.default = DiscoverModel;
_DiscoverModel_instances = new WeakSet(), _DiscoverModel_getDiscoverResultFetchPromise = function _DiscoverModel_getDiscoverResultFetchPromise(params) {
    let page = 0;
    if (params.pageToken) {
        const parsedPageToken = JSON.parse(params.pageToken);
        page = parsedPageToken?.page || 0;
    }
    const queryParams = {
        ...params.discoverParams,
        page,
        albumImageFormat: this.getAlbumImageFormat(),
        artistImageFormat: this.getArtistImageFormat()
    };
    return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('discover', queryParams), () => bandcamp_fetch_1.default.limiter.discovery.discover(queryParams));
}, _DiscoverModel_getDiscoverItemsFromFetchResult = function _DiscoverModel_getDiscoverItemsFromFetchResult(result) {
    return result.items.slice(0);
}, _DiscoverModel_getNextPageTokenFromDiscoverFetchResult = function _DiscoverModel_getNextPageTokenFromDiscoverFetchResult(result, params) {
    let page = 0, indexRef = 0;
    if (params.pageToken) {
        const parsedPageToken = JSON.parse(params.pageToken);
        page = parsedPageToken?.page || 0;
        indexRef = parsedPageToken?.indexRef || 0;
    }
    if (result.items.length > 0 && result.total > indexRef + result.items.length) {
        const nextPageToken = {
            page: page + 1,
            indexRef: indexRef + result.items.length
        };
        return JSON.stringify(nextPageToken);
    }
    return null;
}, _DiscoverModel_convertFetchedDiscoverItemToEntity = function _DiscoverModel_convertFetchedDiscoverItemToEntity(item) {
    return EntityConverter_1.default.convertAlbum(item);
}, _DiscoverModel_onDiscoverLoopFetchEnd = function _DiscoverModel_onDiscoverLoopFetchEnd(result, lastFetchResult) {
    const r = {
        ...result,
        params: lastFetchResult.params
    };
    delete r.params.page;
    return r;
};
//# sourceMappingURL=DiscoverModel.js.map