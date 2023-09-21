"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _SearchModel_instances, _SearchModel_getSearchResultsFetchPromise, _SearchModel_getSearchResultItemsFromFetchResult, _SearchModel_getNextPageTokenFromSearchFetchResult, _SearchModel_filterSearchResultItem, _SearchModel_convertFetchedSearchResultItemToEntity;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchItemType = void 0;
const bandcamp_fetch_1 = __importDefault(require("bandcamp-fetch"));
const BandcampContext_1 = __importDefault(require("../BandcampContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const EntityConverter_1 = __importDefault(require("../util/EntityConverter"));
var SearchItemType;
(function (SearchItemType) {
    SearchItemType["All"] = "All";
    SearchItemType["ArtistsAndLabels"] = "ArtistsAndLabels";
    SearchItemType["Albums"] = "Albums";
    SearchItemType["Tracks"] = "Tracks";
})(SearchItemType = exports.SearchItemType || (exports.SearchItemType = {}));
class SearchModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _SearchModel_instances.add(this);
    }
    getSearchResults(params) {
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: __classPrivateFieldGet(this, _SearchModel_instances, "m", _SearchModel_getSearchResultsFetchPromise).bind(this),
            getItemsFromFetchResult: __classPrivateFieldGet(this, _SearchModel_instances, "m", _SearchModel_getSearchResultItemsFromFetchResult).bind(this),
            getNextPageTokenFromFetchResult: __classPrivateFieldGet(this, _SearchModel_instances, "m", _SearchModel_getNextPageTokenFromSearchFetchResult).bind(this),
            filterFetchedItem: __classPrivateFieldGet(this, _SearchModel_instances, "m", _SearchModel_filterSearchResultItem).bind(this),
            convertToEntity: __classPrivateFieldGet(this, _SearchModel_instances, "m", _SearchModel_convertFetchedSearchResultItemToEntity).bind(this),
            pageOffset: params.pageOffset,
            pageToken: params.pageToken,
            limit: params.limit
        });
    }
}
exports.default = SearchModel;
_SearchModel_instances = new WeakSet(), _SearchModel_getSearchResultsFetchPromise = function _SearchModel_getSearchResultsFetchPromise(params) {
    const page = params.pageToken ? parseInt(params.pageToken, 10) : 1;
    const queryParams = {
        page,
        query: params.query,
        albumImageFormat: this.getAlbumImageFormat(),
        artistImageFormat: this.getArtistImageFormat()
    };
    switch (params.itemType) {
        case SearchItemType.ArtistsAndLabels:
            return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('searchArtistsAndLabels', queryParams), () => bandcamp_fetch_1.default.limiter.search.artistsAndLabels(queryParams));
        case SearchItemType.Albums:
            return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('searchAlbums', queryParams), () => bandcamp_fetch_1.default.limiter.search.albums(queryParams));
        case SearchItemType.Tracks:
            return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('searchTracks', queryParams), () => bandcamp_fetch_1.default.limiter.search.tracks(queryParams));
        default:
        case SearchItemType.All:
            return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('searchAll', queryParams), () => bandcamp_fetch_1.default.limiter.search.all(queryParams));
    }
}, _SearchModel_getSearchResultItemsFromFetchResult = function _SearchModel_getSearchResultItemsFromFetchResult(result) {
    return result.items.slice(0);
}, _SearchModel_getNextPageTokenFromSearchFetchResult = function _SearchModel_getNextPageTokenFromSearchFetchResult(result, params) {
    const page = params.pageToken ? parseInt(params.pageToken, 10) : 1;
    if (page < result.totalPages) {
        return (page + 1).toString();
    }
    return null;
}, _SearchModel_filterSearchResultItem = function _SearchModel_filterSearchResultItem(item, params) {
    switch (params.itemType) {
        case SearchItemType.ArtistsAndLabels:
            return item.type === 'artist' || item.type === 'label';
        case SearchItemType.Albums:
            return item.type === 'album';
        case SearchItemType.Tracks:
            return item.type === 'track';
        case SearchItemType.All:
            return item.type === 'album' || item.type === 'artist' || item.type === 'label' || item.type === 'track';
        default:
            return false;
    }
}, _SearchModel_convertFetchedSearchResultItemToEntity = function _SearchModel_convertFetchedSearchResultItemToEntity(item) {
    if (item.type === 'album' || item.type === 'artist' || item.type === 'label' || item.type === 'track') {
        return EntityConverter_1.default.convertSearchResultItem(item);
    }
    return null;
};
//# sourceMappingURL=SearchModel.js.map