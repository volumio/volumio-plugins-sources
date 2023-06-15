"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _TagModel_instances, _TagModel_getReleasesFetchPromise, _TagModel_getReleasesFromFetchResult, _TagModel_getNextPageTokenFromReleasesFetchResult, _TagModel_convertFetchedReleaseToEntity, _TagModel_onGetReleasesLoopFetchEnd;
Object.defineProperty(exports, "__esModule", { value: true });
const bandcamp_fetch_1 = __importDefault(require("bandcamp-fetch"));
const BandcampContext_1 = __importDefault(require("../BandcampContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const EntityConverter_1 = __importDefault(require("../util/EntityConverter"));
class TagModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _TagModel_instances.add(this);
    }
    getReleases(params) {
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: __classPrivateFieldGet(this, _TagModel_instances, "m", _TagModel_getReleasesFetchPromise).bind(this),
            getItemsFromFetchResult: __classPrivateFieldGet(this, _TagModel_instances, "m", _TagModel_getReleasesFromFetchResult).bind(this),
            getNextPageTokenFromFetchResult: __classPrivateFieldGet(this, _TagModel_instances, "m", _TagModel_getNextPageTokenFromReleasesFetchResult).bind(this),
            convertToEntity: __classPrivateFieldGet(this, _TagModel_instances, "m", _TagModel_convertFetchedReleaseToEntity).bind(this),
            onEnd: __classPrivateFieldGet(this, _TagModel_instances, "m", _TagModel_onGetReleasesLoopFetchEnd).bind(this),
            pageOffset: params.pageOffset,
            pageToken: params.pageToken,
            limit: params.limit
        });
    }
    async getTag(tagUrl) {
        const tag = await BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('tag', { tagUrl }), () => bandcamp_fetch_1.default.limiter.tag.getInfo(tagUrl));
        return EntityConverter_1.default.convertTag(tag);
    }
    async getTags() {
        const tags = await BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('tags'), () => bandcamp_fetch_1.default.limiter.tag.list());
        return {
            tags: tags.tags.map((tag) => EntityConverter_1.default.convertTag({ ...tag, type: 'tag' })),
            locations: tags.locations.map((tag) => EntityConverter_1.default.convertTag({ ...tag, type: 'tag' }))
        };
    }
    getReleasesAvailableFilters(tagUrl) {
        return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('releasesByTagFilterOptions', { tagUrl }), () => bandcamp_fetch_1.default.limiter.tag.getReleasesAvailableFilters(tagUrl));
    }
}
exports.default = TagModel;
_TagModel_instances = new WeakSet(), _TagModel_getReleasesFetchPromise = function _TagModel_getReleasesFetchPromise(params) {
    const page = params.pageToken ? parseInt(params.pageToken, 10) : 1;
    const queryParams = {
        tagUrl: params.tagUrl,
        page,
        filters: params.filters,
        imageFormat: this.getAlbumImageFormat()
    };
    return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('releasesByTag', queryParams), () => bandcamp_fetch_1.default.limiter.tag.getReleases(queryParams));
}, _TagModel_getReleasesFromFetchResult = function _TagModel_getReleasesFromFetchResult(result) {
    return result.items.slice(0);
}, _TagModel_getNextPageTokenFromReleasesFetchResult = function _TagModel_getNextPageTokenFromReleasesFetchResult(result, params) {
    const page = params.pageToken ? parseInt(params.pageToken) : 1;
    if (result.items.length > 0 && result.hasMore) {
        return (page + 1).toString();
    }
    return null;
}, _TagModel_convertFetchedReleaseToEntity = function _TagModel_convertFetchedReleaseToEntity(item) {
    if (item.type === 'album') {
        return EntityConverter_1.default.convertAlbum(item);
    }
    return EntityConverter_1.default.convertTrack(item);
}, _TagModel_onGetReleasesLoopFetchEnd = function _TagModel_onGetReleasesLoopFetchEnd(result, lastFetchResult) {
    const r = {
        ...result,
        filters: lastFetchResult.filters
    };
    return r;
};
//# sourceMappingURL=TagModel.js.map