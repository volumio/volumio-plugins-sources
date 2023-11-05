"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _BaseModel_instances, _a, _BaseModel_api, _BaseModel_hasAccessToken, _BaseModel_doGetSoundCloudAPI, _BaseModel_doLoopFetch;
Object.defineProperty(exports, "__esModule", { value: true });
const md5_1 = __importDefault(require("md5"));
const SoundCloudContext_1 = __importDefault(require("../SoundCloudContext"));
const soundcloud_fetch_1 = __importStar(require("soundcloud-fetch"));
class BaseModel {
    constructor() {
        _BaseModel_instances.add(this);
    }
    getSoundCloudAPI() {
        return __classPrivateFieldGet(BaseModel, _a, "m", _BaseModel_doGetSoundCloudAPI).call(BaseModel);
    }
    static setAccessToken(value) {
        const api = __classPrivateFieldGet(this, _a, "m", _BaseModel_doGetSoundCloudAPI).call(this);
        api.setAccessToken(value);
        __classPrivateFieldSet(this, _a, !!value, "f", _BaseModel_hasAccessToken);
    }
    hasAccessToken() {
        return __classPrivateFieldGet(BaseModel, _a, "f", _BaseModel_hasAccessToken);
    }
    static setLocale(value) {
        const api = __classPrivateFieldGet(this, _a, "m", _BaseModel_doGetSoundCloudAPI).call(this);
        api.setLocale(value);
    }
    loopFetch(params) {
        return __classPrivateFieldGet(this, _BaseModel_instances, "m", _BaseModel_doLoopFetch).call(this, { ...params });
    }
    getCacheKeyForFetch(resourceName, cacheKeyParams) {
        const prefix = `soundcloud.model.${resourceName}`;
        const params = {
            ...cacheKeyParams,
            locale: SoundCloudContext_1.default.getConfigValue('locale')
        };
        const key = Object.keys(params).sort().reduce((s, k) => {
            const p = `${k}=${encodeURIComponent(JSON.stringify(params[k]))}`;
            return `${s}@${p}`;
        }, prefix);
        return (0, md5_1.default)(key);
    }
    commonGetCollectionItemsFromLoopFetchResult(result) {
        return result.items;
    }
    commonGetNextPageTokenFromLoopFetchResult(result) {
        const items = result.items;
        if (items.length > 0 && result.continuation) {
            return soundcloud_fetch_1.CollectionContinuation.stringify(result.continuation);
        }
        return null;
    }
    async commonGetLoopFetchResultByPageToken(params) {
        if (params.pageToken) {
            const api = this.getSoundCloudAPI();
            const continuation = soundcloud_fetch_1.CollectionContinuation.parse(params.pageToken);
            if (continuation) {
                return api.getContinuation(continuation);
            }
        }
        return null;
    }
}
exports.default = BaseModel;
_a = BaseModel, _BaseModel_instances = new WeakSet(), _BaseModel_doGetSoundCloudAPI = function _BaseModel_doGetSoundCloudAPI() {
    if (!__classPrivateFieldGet(BaseModel, _a, "f", _BaseModel_api)) {
        __classPrivateFieldSet(BaseModel, _a, new soundcloud_fetch_1.default(), "f", _BaseModel_api);
    }
    return __classPrivateFieldGet(BaseModel, _a, "f", _BaseModel_api);
}, _BaseModel_doLoopFetch = async function _BaseModel_doLoopFetch(params, currentList = [], iteration = 1) {
    const pageOffset = params.pageOffset || 0;
    const limit = params.limit || 47;
    const callbackParams = { ...params.callbackParams };
    if (params.pageToken) {
        callbackParams.pageToken = params.pageToken;
    }
    const fetchResult = await params.getFetchPromise(callbackParams);
    let items = [...params.getItemsFromFetchResult(fetchResult, callbackParams)];
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
    const entities = await Promise.all(currentList.map((item) => params.convertToEntity(item, callbackParams)));
    const result = {
        items: entities.filter((entity) => entity),
        nextPageToken: maxFetchIterationsReached ? null : nextPageToken,
        nextPageOffset: maxFetchIterationsReached ? 0 : nextPageOffset
    };
    if (params.onEnd) {
        return params.onEnd(result, fetchResult, callbackParams);
    }
    return result;
};
BaseModel.queryMaxLimit = 50;
_BaseModel_api = { value: void 0 };
_BaseModel_hasAccessToken = { value: false };
//# sourceMappingURL=BaseModel.js.map