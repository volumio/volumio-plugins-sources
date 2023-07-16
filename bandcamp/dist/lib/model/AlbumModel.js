"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _AlbumModel_instances, _AlbumModel_cacheTracks, _AlbumModel_converFetchedAlbumToEntity;
Object.defineProperty(exports, "__esModule", { value: true });
const bandcamp_fetch_1 = __importDefault(require("bandcamp-fetch"));
const BandcampContext_1 = __importDefault(require("../BandcampContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const EntityConverter_1 = __importDefault(require("../util/EntityConverter"));
class AlbumModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _AlbumModel_instances.add(this);
    }
    async getAlbum(albumUrl) {
        const queryParams = {
            albumUrl,
            albumImageFormat: this.getAlbumImageFormat(),
            artistImageFormat: this.getArtistImageFormat(),
            includeRawData: false
        };
        const album = await BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('album', queryParams), () => bandcamp_fetch_1.default.limiter.album.getInfo(queryParams));
        const albumEntity = __classPrivateFieldGet(this, _AlbumModel_instances, "m", _AlbumModel_converFetchedAlbumToEntity).call(this, album);
        __classPrivateFieldGet(this, _AlbumModel_instances, "m", _AlbumModel_cacheTracks).call(this, albumEntity.tracks);
        return albumEntity;
    }
}
exports.default = AlbumModel;
_AlbumModel_instances = new WeakSet(), _AlbumModel_cacheTracks = function _AlbumModel_cacheTracks(tracks) {
    if (!tracks) {
        return;
    }
    tracks.forEach((track) => {
        if (track.url) {
            BandcampContext_1.default.getCache().put(this.getCacheKeyForFetch('track', { trackUrl: track.url }), track);
        }
    });
}, _AlbumModel_converFetchedAlbumToEntity = function _AlbumModel_converFetchedAlbumToEntity(item) {
    return EntityConverter_1.default.convertAlbum(item);
};
//# sourceMappingURL=AlbumModel.js.map