"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _HistoryModel_instances, _HistoryModel_getPlayHistoryFetchPromise, _HistoryModel_convertFetchedPlayHistoryItemToEntity, _HistoryModel_onGetPlayHistoryLoopFetchEnd;
Object.defineProperty(exports, "__esModule", { value: true });
const BaseModel_1 = __importDefault(require("./BaseModel"));
const soundcloud_fetch_1 = require("soundcloud-fetch");
const Mapper_1 = __importDefault(require("./Mapper"));
const TrackHelper_1 = __importDefault(require("../util/TrackHelper"));
class HistoryModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _HistoryModel_instances.add(this);
    }
    getPlayHistory(params) {
        const getItems = (this.commonGetCollectionItemsFromLoopFetchResult);
        const getNextPageToken = (this.commonGetNextPageTokenFromLoopFetchResult);
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: __classPrivateFieldGet(this, _HistoryModel_instances, "m", _HistoryModel_getPlayHistoryFetchPromise).bind(this),
            getItemsFromFetchResult: getItems.bind(this),
            getNextPageTokenFromFetchResult: getNextPageToken.bind(this),
            convertToEntity: __classPrivateFieldGet(this, _HistoryModel_instances, "m", _HistoryModel_convertFetchedPlayHistoryItemToEntity).bind(this),
            onEnd: __classPrivateFieldGet(this, _HistoryModel_instances, "m", _HistoryModel_onGetPlayHistoryLoopFetchEnd).bind(this),
            pageToken: params.pageToken,
            pageOffset: params.pageOffset,
            limit: params.limit
        });
    }
}
exports.default = HistoryModel;
_HistoryModel_instances = new WeakSet(), _HistoryModel_getPlayHistoryFetchPromise = async function _HistoryModel_getPlayHistoryFetchPromise(params) {
    const api = this.getSoundCloudAPI();
    const continuationContents = await this.commonGetLoopFetchResultByPageToken(params);
    if (continuationContents) {
        return continuationContents;
    }
    const queryParams = {
        type: params.type,
        limit: soundcloud_fetch_1.Constants.QUERY_MAX_LIMIT
    };
    return api.me.getPlayHistory(queryParams);
}, _HistoryModel_convertFetchedPlayHistoryItemToEntity = async function _HistoryModel_convertFetchedPlayHistoryItemToEntity(item) {
    const wrappedItem = item.item;
    if (wrappedItem instanceof soundcloud_fetch_1.Album) {
        return Mapper_1.default.mapAlbum(wrappedItem);
    }
    else if (wrappedItem instanceof soundcloud_fetch_1.Playlist || wrappedItem instanceof soundcloud_fetch_1.SystemPlaylist) {
        return Mapper_1.default.mapPlaylist(wrappedItem);
    }
    else if (wrappedItem instanceof soundcloud_fetch_1.Track) {
        return Mapper_1.default.mapTrack(wrappedItem);
    }
    return null;
}, _HistoryModel_onGetPlayHistoryLoopFetchEnd = function _HistoryModel_onGetPlayHistoryLoopFetchEnd(result) {
    const tracks = result.items.filter((item) => item.type === 'track');
    TrackHelper_1.default.cacheTracks(tracks, this.getCacheKeyForFetch.bind(this, 'track'));
    return result;
};
//# sourceMappingURL=HistoryModel.js.map