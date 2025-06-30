"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _TrackModel_instances, _TrackModel_doGetTrack, _TrackModel_convertFetchedTrackToEntity;
Object.defineProperty(exports, "__esModule", { value: true });
const bandcamp_fetch_1 = __importDefault(require("bandcamp-fetch"));
const BandcampContext_1 = __importDefault(require("../BandcampContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const EntityConverter_1 = __importDefault(require("../util/EntityConverter"));
class TrackModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _TrackModel_instances.add(this);
    }
    getTrack(trackUrl) {
        // Unlike other resources, tracks are converted to TrackEntitys
        // Before being cached. See also AlbumModel#getAlbum(), where we
        // Cache an album's tracks that have been converted to entities.
        return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('track', { trackUrl }), () => __classPrivateFieldGet(this, _TrackModel_instances, "m", _TrackModel_doGetTrack).call(this, trackUrl));
    }
}
exports.default = TrackModel;
_TrackModel_instances = new WeakSet(), _TrackModel_doGetTrack = async function _TrackModel_doGetTrack(trackUrl) {
    const queryParams = {
        trackUrl,
        albumImageFormat: this.getAlbumImageFormat(),
        artistImageFormat: this.getArtistImageFormat(),
        includeRawData: false
    };
    const trackInfo = await bandcamp_fetch_1.default.limiter.track.getInfo(queryParams);
    return __classPrivateFieldGet(this, _TrackModel_instances, "m", _TrackModel_convertFetchedTrackToEntity).call(this, trackInfo);
}, _TrackModel_convertFetchedTrackToEntity = function _TrackModel_convertFetchedTrackToEntity(item) {
    return EntityConverter_1.default.convertTrack(item);
};
//# sourceMappingURL=TrackModel.js.map