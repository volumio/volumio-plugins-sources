"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _ShowModel_instances, _ShowModel_getShowsFetchPromise, _ShowModel_getShowsFromFetchResult, _ShowModel_convertFetchedShowToEntity;
Object.defineProperty(exports, "__esModule", { value: true });
const bandcamp_fetch_1 = __importDefault(require("bandcamp-fetch"));
const BandcampContext_1 = __importDefault(require("../BandcampContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const EntityConverter_1 = __importDefault(require("../util/EntityConverter"));
class ShowModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _ShowModel_instances.add(this);
    }
    getShows(params) {
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: __classPrivateFieldGet(this, _ShowModel_instances, "m", _ShowModel_getShowsFetchPromise).bind(this),
            getItemsFromFetchResult: __classPrivateFieldGet(this, _ShowModel_instances, "m", _ShowModel_getShowsFromFetchResult).bind(this),
            convertToEntity: __classPrivateFieldGet(this, _ShowModel_instances, "m", _ShowModel_convertFetchedShowToEntity).bind(this),
            pageOffset: params.pageOffset,
            pageToken: params.pageToken,
            limit: params.limit
        });
    }
    async getShow(showUrl) {
        const queryParams = {
            showUrl,
            imageFormat: this.getAlbumImageFormat()
        };
        const show = await BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('show', queryParams), () => bandcamp_fetch_1.default.limiter.show.getShow(queryParams));
        return __classPrivateFieldGet(this, _ShowModel_instances, "m", _ShowModel_convertFetchedShowToEntity).call(this, show);
    }
}
exports.default = ShowModel;
_ShowModel_instances = new WeakSet(), _ShowModel_getShowsFetchPromise = function _ShowModel_getShowsFetchPromise() {
    const queryParams = {
        imageFormat: this.getAlbumImageFormat()
    };
    return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('shows', queryParams), () => bandcamp_fetch_1.default.limiter.show.list(queryParams));
}, _ShowModel_getShowsFromFetchResult = function _ShowModel_getShowsFromFetchResult(result) {
    return result.slice(0);
}, _ShowModel_convertFetchedShowToEntity = function _ShowModel_convertFetchedShowToEntity(item) {
    return EntityConverter_1.default.convertShow(item);
};
//# sourceMappingURL=ShowModel.js.map