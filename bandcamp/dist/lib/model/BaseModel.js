"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _BaseModel_instances, _BaseModel_doLoopFetch;
Object.defineProperty(exports, "__esModule", { value: true });
const md5_1 = __importDefault(require("md5"));
class BaseModel {
    constructor() {
        _BaseModel_instances.add(this);
    }
    loopFetch(params) {
        return __classPrivateFieldGet(this, _BaseModel_instances, "m", _BaseModel_doLoopFetch).call(this, { ...params });
    }
    getCacheKeyForFetch(resourceName, cacheKeyParams) {
        const prefix = `bandcamp.model.${resourceName}`;
        if (!cacheKeyParams) {
            return (0, md5_1.default)(prefix);
        }
        const key = Object.keys(cacheKeyParams).sort().reduce((s, k) => {
            const p = `${k}=${encodeURIComponent(JSON.stringify(cacheKeyParams[k]))}`;
            return `${s}@${p}`;
        }, prefix);
        return (0, md5_1.default)(key);
    }
    getAlbumImageFormat() {
        return 'art_app_large';
    }
    getArtistImageFormat() {
        return 'bio_app';
    }
}
exports.default = BaseModel;
_BaseModel_instances = new WeakSet(), _BaseModel_doLoopFetch = async function _BaseModel_doLoopFetch(params, currentList = [], iteration = 1) {
    const pageOffset = params.pageOffset || 0;
    const limit = params.limit || 47;
    const callbackParams = { ...params.callbackParams };
    if (params.pageToken) {
        callbackParams.pageToken = params.pageToken;
    }
    const fetchResult = await params.getFetchPromise(callbackParams);
    let items = params.getItemsFromFetchResult(fetchResult, callbackParams);
    if (pageOffset) {
        items.splice(0, pageOffset);
    }
    // Number of items to add before hitting limit
    const itemCountToLimit = limit - currentList.length;
    let nextPageOffset = 0;
    const filter = params.filterFetchedItem;
    if (items.length > 0 && filter) {
        let itemOffset = 0;
        let includeCount = 0;
        const filtered = items.filter((item) => {
            if (includeCount >= itemCountToLimit) {
                return false;
            }
            const inc = filter(item, callbackParams);
            if (inc) {
                includeCount++;
            }
            itemOffset++;
            return inc;
        });
        if (itemOffset === items.length) {
            nextPageOffset = 0;
        }
        else {
            nextPageOffset = itemOffset + pageOffset;
        }
        items = filtered;
    }
    else if (items) {
        if (items.length > itemCountToLimit) {
            items.splice(itemCountToLimit);
            nextPageOffset = items.length + pageOffset;
        }
        else {
            nextPageOffset = 0;
        }
    }
    currentList = [...currentList, ...items];
    let nextPageToken;
    if (nextPageOffset > 0 && params.pageToken) {
        nextPageToken = params.pageToken;
    }
    else if (nextPageOffset === 0 && params.getNextPageTokenFromFetchResult) {
        nextPageToken = params.getNextPageTokenFromFetchResult(fetchResult, callbackParams);
    }
    else {
        nextPageToken = null;
    }
    iteration++;
    const maxFetchIterationsReached = params.maxIterations !== undefined && iteration > params.maxIterations;
    if (!maxFetchIterationsReached && currentList.length < limit && nextPageToken) { // Get more items
        params.pageToken = nextPageToken;
        params.pageOffset = 0;
        return await __classPrivateFieldGet(this, _BaseModel_instances, "m", _BaseModel_doLoopFetch).call(this, params, currentList, iteration);
    }
    const result = {
        items: currentList.reduce((reduced, item) => {
            const entity = params.convertToEntity(item, callbackParams);
            if (entity) {
                reduced.push(entity);
            }
            return reduced;
        }, []),
        nextPageToken: maxFetchIterationsReached ? null : nextPageToken,
        nextPageOffset: maxFetchIterationsReached ? 0 : nextPageOffset
    };
    if (params.onEnd) {
        return params.onEnd(result, fetchResult, callbackParams);
    }
    return result;
};
//# sourceMappingURL=BaseModel.js.map