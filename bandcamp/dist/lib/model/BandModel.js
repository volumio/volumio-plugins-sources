"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _BandModel_instances, _BandModel_getLabelArtistsFetchPromise, _BandModel_getLabelArtistsFromFetchResult, _BandModel_convertFetchedLabelArtistToEntity, _BandModel_getDiscographyFetchPromise, _BandModel_getDiscographyItemsFromFetchResult, _BandModel_convertFetchedDiscographyItemToEntity;
Object.defineProperty(exports, "__esModule", { value: true });
const bandcamp_fetch_1 = __importDefault(require("bandcamp-fetch"));
const BandcampContext_1 = __importDefault(require("../BandcampContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const EntityConverter_1 = __importDefault(require("../util/EntityConverter"));
class BandModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _BandModel_instances.add(this);
    }
    getLabelArtists(params) {
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: __classPrivateFieldGet(this, _BandModel_instances, "m", _BandModel_getLabelArtistsFetchPromise).bind(this),
            getItemsFromFetchResult: __classPrivateFieldGet(this, _BandModel_instances, "m", _BandModel_getLabelArtistsFromFetchResult).bind(this),
            convertToEntity: __classPrivateFieldGet(this, _BandModel_instances, "m", _BandModel_convertFetchedLabelArtistToEntity).bind(this),
            pageOffset: params.pageOffset,
            pageToken: params.pageToken,
            limit: params.limit
        });
    }
    getDiscography(params) {
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: __classPrivateFieldGet(this, _BandModel_instances, "m", _BandModel_getDiscographyFetchPromise).bind(this),
            getItemsFromFetchResult: __classPrivateFieldGet(this, _BandModel_instances, "m", _BandModel_getDiscographyItemsFromFetchResult).bind(this),
            convertToEntity: __classPrivateFieldGet(this, _BandModel_instances, "m", _BandModel_convertFetchedDiscographyItemToEntity).bind(this),
            pageOffset: params.pageOffset,
            pageToken: params.pageToken,
            limit: params.limit
        });
    }
    async getBand(bandUrl) {
        const queryParams = {
            bandUrl,
            imageFormat: this.getArtistImageFormat()
        };
        const band = await BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('band', queryParams), () => bandcamp_fetch_1.default.limiter.band.getInfo(queryParams));
        if (band.type === 'artist') {
            return EntityConverter_1.default.convertArtist(band);
        }
        return EntityConverter_1.default.convertLabel(band);
    }
}
exports.default = BandModel;
_BandModel_instances = new WeakSet(), _BandModel_getLabelArtistsFetchPromise = function _BandModel_getLabelArtistsFetchPromise(params) {
    const queryParams = {
        labelUrl: params.labelUrl,
        imageFormat: this.getArtistImageFormat()
    };
    return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('artists', queryParams), () => bandcamp_fetch_1.default.limiter.band.getLabelArtists(queryParams));
}, _BandModel_getLabelArtistsFromFetchResult = function _BandModel_getLabelArtistsFromFetchResult(result) {
    return result.slice(0);
}, _BandModel_convertFetchedLabelArtistToEntity = function _BandModel_convertFetchedLabelArtistToEntity(item) {
    return EntityConverter_1.default.convertArtist(item);
}, _BandModel_getDiscographyFetchPromise = function _BandModel_getDiscographyFetchPromise(params) {
    const queryParams = {
        bandUrl: params.bandUrl,
        imageFormat: this.getAlbumImageFormat()
    };
    return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('discography', queryParams), () => bandcamp_fetch_1.default.limiter.band.getDiscography(queryParams));
}, _BandModel_getDiscographyItemsFromFetchResult = function _BandModel_getDiscographyItemsFromFetchResult(result) {
    return result.slice(0);
}, _BandModel_convertFetchedDiscographyItemToEntity = function _BandModel_convertFetchedDiscographyItemToEntity(item) {
    if (item.type === 'album') {
        return EntityConverter_1.default.convertAlbum(item);
    }
    return EntityConverter_1.default.convertTrack(item);
};
//# sourceMappingURL=BandModel.js.map