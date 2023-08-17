'use strict';
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _TrackModel_instances, _TrackModel_getTracksFetchPromise, _TrackModel_convertFetchedTrackToEntity, _TrackModel_onGetTracksLoopFetchEnd, _TrackModel_doGetTrack;
Object.defineProperty(exports, "__esModule", { value: true });
const soundcloud_fetch_1 = require("soundcloud-fetch");
const BaseModel_1 = __importDefault(require("./BaseModel"));
const SoundCloudContext_1 = __importDefault(require("../SoundCloudContext"));
const Mapper_1 = __importDefault(require("./Mapper"));
const TrackHelper_1 = __importDefault(require("../util/TrackHelper"));
class TrackModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _TrackModel_instances.add(this);
    }
    getTracks(params) {
        const getItems = (this.commonGetCollectionItemsFromLoopFetchResult);
        const getNextPageToken = (this.commonGetNextPageTokenFromLoopFetchResult);
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: __classPrivateFieldGet(this, _TrackModel_instances, "m", _TrackModel_getTracksFetchPromise).bind(this),
            getItemsFromFetchResult: getItems.bind(this),
            getNextPageTokenFromFetchResult: getNextPageToken.bind(this),
            convertToEntity: __classPrivateFieldGet(this, _TrackModel_instances, "m", _TrackModel_convertFetchedTrackToEntity).bind(this),
            onEnd: __classPrivateFieldGet(this, _TrackModel_instances, "m", _TrackModel_onGetTracksLoopFetchEnd).bind(this),
            pageToken: params.pageToken,
            pageOffset: params.pageOffset,
            limit: params.limit
        });
    }
    getTrack(trackId) {
        // Unlike other resources, tracks are mapped to TrackEntity objects before being cached.
        return SoundCloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('track', { trackId }), () => __classPrivateFieldGet(this, _TrackModel_instances, "m", _TrackModel_doGetTrack).call(this, trackId));
    }
    getStreamingUrl(transcodingUrl) {
        return this.getSoundCloudAPI().getStreamingUrl(transcodingUrl);
    }
}
exports.default = TrackModel;
_TrackModel_instances = new WeakSet(), _TrackModel_getTracksFetchPromise = async function _TrackModel_getTracksFetchPromise(params) {
    const api = this.getSoundCloudAPI();
    const continuationContents = await this.commonGetLoopFetchResultByPageToken(params);
    if (continuationContents) {
        return continuationContents;
    }
    const queryParams = {
        limit: soundcloud_fetch_1.Constants.QUERY_MAX_LIMIT
    };
    if (params.search) {
        const q = params.search;
        queryParams.type = 'track';
        const cacheKeyParams = {
            search: q,
            ...queryParams
        };
        return SoundCloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('tracks', cacheKeyParams), () => api.search(q, { ...queryParams, type: 'track' }));
    }
    else if (params.userId !== undefined) {
        const userId = params.userId;
        const cacheKeyParams = {
            userId,
            ...queryParams
        };
        return SoundCloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('tracks', cacheKeyParams), () => api.getTracksByUser(userId, queryParams));
    }
    else if (params.topFeatured) {
        const cacheKeyParams = {
            topFeatured: true,
            ...queryParams
        };
        return SoundCloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('tracks', cacheKeyParams), () => api.getTopFeaturedTracks(queryParams));
    }
    throw Error('Missing or invalid criteria for tracks');
}, _TrackModel_convertFetchedTrackToEntity = function _TrackModel_convertFetchedTrackToEntity(data) {
    return Mapper_1.default.mapTrack(data);
}, _TrackModel_onGetTracksLoopFetchEnd = function _TrackModel_onGetTracksLoopFetchEnd(result) {
    TrackHelper_1.default.cacheTracks(result.items, this.getCacheKeyForFetch.bind(this, 'track'));
    return result;
}, _TrackModel_doGetTrack = async function _TrackModel_doGetTrack(trackId) {
    const trackData = await this.getSoundCloudAPI().getTrack(trackId);
    if (trackData) {
        return Mapper_1.default.mapTrack(trackData);
    }
    return null;
};
//# sourceMappingURL=TrackModel.js.map