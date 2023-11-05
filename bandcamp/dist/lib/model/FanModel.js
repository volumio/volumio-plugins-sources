"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _FanModel_instances, _FanModel_getFanItems, _FanModel_getFanItemsFetchPromise, _FanModel_getFanItemsFromFetchResult, _FanModel_getNextPageTokenFromFanItemsFetchResult, _FanModel_convertFetchedFanItemToEntity;
Object.defineProperty(exports, "__esModule", { value: true });
const bandcamp_fetch_1 = __importDefault(require("bandcamp-fetch"));
const BandcampContext_1 = __importDefault(require("../BandcampContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const EntityConverter_1 = __importDefault(require("../util/EntityConverter"));
const _1 = __importDefault(require("."));
var FanItemType;
(function (FanItemType) {
    FanItemType["Collection"] = "Collection";
    FanItemType["Wishlist"] = "Wishlist";
    FanItemType["FollowingArtistsAndLabels"] = "FollowingArtistsAndLabels";
    FanItemType["FollowingGenres"] = "FollowingGenres";
})(FanItemType || (FanItemType = {}));
class FanModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _FanModel_instances.add(this);
    }
    getInfo(username) {
        const queryParams = {
            imageFormat: this.getArtistImageFormat()
        };
        if (username) {
            queryParams.username = username;
        }
        else if (!_1.default.cookie) {
            throw Error('No cookie set');
        }
        return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('fanInfo', queryParams), () => bandcamp_fetch_1.default.limiter.fan.getInfo(queryParams));
    }
    getCollection(params) {
        return __classPrivateFieldGet(this, _FanModel_instances, "m", _FanModel_getFanItems).call(this, params, FanItemType.Collection);
    }
    getWishlist(params) {
        return __classPrivateFieldGet(this, _FanModel_instances, "m", _FanModel_getFanItems).call(this, params, FanItemType.Wishlist);
    }
    getFollowingArtistsAndLabels(params) {
        return __classPrivateFieldGet(this, _FanModel_instances, "m", _FanModel_getFanItems).call(this, params, FanItemType.FollowingArtistsAndLabels);
    }
    getFollowingGenres(params) {
        return __classPrivateFieldGet(this, _FanModel_instances, "m", _FanModel_getFanItems).call(this, params, FanItemType.FollowingGenres);
    }
}
exports.default = FanModel;
_FanModel_instances = new WeakSet(), _FanModel_getFanItems = function _FanModel_getFanItems(params, itemType) {
    return this.loopFetch({
        callbackParams: { ...params, itemType },
        getFetchPromise: __classPrivateFieldGet(this, _FanModel_instances, "m", _FanModel_getFanItemsFetchPromise).bind(this),
        getItemsFromFetchResult: __classPrivateFieldGet(this, _FanModel_instances, "m", _FanModel_getFanItemsFromFetchResult).bind(this),
        getNextPageTokenFromFetchResult: __classPrivateFieldGet(this, _FanModel_instances, "m", _FanModel_getNextPageTokenFromFanItemsFetchResult).bind(this),
        convertToEntity: __classPrivateFieldGet(this, _FanModel_instances, "m", _FanModel_convertFetchedFanItemToEntity).bind(this),
        pageOffset: params.pageOffset,
        pageToken: params.pageToken,
        limit: params.limit
    });
}, _FanModel_getFanItemsFetchPromise = function _FanModel_getFanItemsFetchPromise(params) {
    const continuationToken = params.pageToken ? JSON.parse(params.pageToken) : null;
    const cacheKeyParams = {
        username: params.username
    };
    if (continuationToken) {
        cacheKeyParams.continuationToken = JSON.stringify(continuationToken);
    }
    const target = continuationToken || params.username;
    switch (params.itemType) {
        case FanItemType.Collection:
            return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('fanCollection', cacheKeyParams), () => bandcamp_fetch_1.default.limiter.fan.getCollection({
                target,
                imageFormat: this.getAlbumImageFormat()
            }));
        case FanItemType.Wishlist:
            return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('fanWishlist', cacheKeyParams), () => bandcamp_fetch_1.default.limiter.fan.getWishlist({
                target,
                imageFormat: this.getAlbumImageFormat()
            }));
        case FanItemType.FollowingArtistsAndLabels:
            return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('fanFollowingArtistsAndLabels', cacheKeyParams), () => bandcamp_fetch_1.default.limiter.fan.getFollowingArtistsAndLabels({
                target,
                imageFormat: this.getArtistImageFormat()
            }));
        default:
        case FanItemType.FollowingGenres:
            return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('fanFollowingGenres', cacheKeyParams), () => bandcamp_fetch_1.default.limiter.fan.getFollowingGenres({
                target,
                imageFormat: this.getAlbumImageFormat()
            }));
    }
}, _FanModel_getFanItemsFromFetchResult = function _FanModel_getFanItemsFromFetchResult(result) {
    return result.items.slice(0);
}, _FanModel_getNextPageTokenFromFanItemsFetchResult = function _FanModel_getNextPageTokenFromFanItemsFetchResult(result) {
    return result.continuation ? JSON.stringify(result.continuation) : null;
}, _FanModel_convertFetchedFanItemToEntity = function _FanModel_convertFetchedFanItemToEntity(item) {
    switch (item.type) {
        case 'album':
            return EntityConverter_1.default.convertAlbum(item);
        case 'track':
            return EntityConverter_1.default.convertTrack(item);
        case 'tag': // Following genres are tags
            return EntityConverter_1.default.convertTag(item);
        default: // UserKind (following artists / labels) does not have 'tag'
            return EntityConverter_1.default.convertBand(item);
    }
};
//# sourceMappingURL=FanModel.js.map