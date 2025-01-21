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
        return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('discoverOptions'), async () => {
            const opts = await bandcamp_fetch_1.default.limiter.discovery.getAvailableOptions();
            opts.categories = opts.categories.filter((cat) => cat.slug !== 'tshirt');
            return opts;
        });
    }
}
_DiscoverModel_instances = new WeakSet(), _DiscoverModel_getDiscoverResultFetchPromise = function _DiscoverModel_getDiscoverResultFetchPromise(params) {
    const queryParams = (() => {
        if (params.pageToken) {
            const parsedPageToken = JSON.parse(params.pageToken);
            const continuation = parsedPageToken?.continuation;
            if (continuation) {
                return continuation;
            }
        }
        return {
            ...params.discoverParams,
            albumImageFormat: this.getAlbumImageFormat(),
            artistImageFormat: this.getArtistImageFormat()
        };
    })();
    return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('discover', queryParams), () => bandcamp_fetch_1.default.limiter.discovery.discover(queryParams));
}, _DiscoverModel_getDiscoverItemsFromFetchResult = function _DiscoverModel_getDiscoverItemsFromFetchResult(result) {
    return result.items.filter((value) => value.type === 'album');
}, _DiscoverModel_getNextPageTokenFromDiscoverFetchResult = function _DiscoverModel_getNextPageTokenFromDiscoverFetchResult(result, params) {
    let indexRef = 0;
    if (params.pageToken) {
        const parsedPageToken = JSON.parse(params.pageToken);
        indexRef = parsedPageToken?.indexRef || 0;
    }
    if (result.continuation && result.items.length > 0 && result.total > indexRef + result.items.length) {
        const nextPageToken = {
            continuation: result.continuation,
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
    return r;
};
exports.default = DiscoverModel;
//# sourceMappingURL=DiscoverModel.js.map