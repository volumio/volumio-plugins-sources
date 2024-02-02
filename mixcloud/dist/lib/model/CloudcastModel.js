"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _CloudcastModel_instances, _CloudcastModel_getCloudcastsByType, _CloudcastModel_getCloudcastsFetchPromise, _CloudcastModel_getCloudcastsFromFetchResult, _CloudcastModel_getNextPageTokenFromCloudcastsFetchResult, _CloudcastModel_convertFetchedCloudcastToEntity, _CloudcastModel_onGetCloudcastsLoopFetchEnd;
Object.defineProperty(exports, "__esModule", { value: true });
const mixcloud_fetch_1 = __importDefault(require("mixcloud-fetch"));
const MixcloudContext_1 = __importDefault(require("../MixcloudContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const EntityConverter_1 = __importDefault(require("../util/EntityConverter"));
class CloudcastModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _CloudcastModel_instances.add(this);
    }
    getCloudcasts(params) {
        if (params.username) {
            return __classPrivateFieldGet(this, _CloudcastModel_instances, "m", _CloudcastModel_getCloudcastsByType).call(this, {
                getType: 'byUser',
                ...params
            });
        }
        if (params.playlistId) {
            return __classPrivateFieldGet(this, _CloudcastModel_instances, "m", _CloudcastModel_getCloudcastsByType).call(this, {
                getType: 'byPlaylist',
                ...params
            });
        }
        if (params.keywords) {
            return __classPrivateFieldGet(this, _CloudcastModel_instances, "m", _CloudcastModel_getCloudcastsByType).call(this, {
                getType: 'bySearch',
                ...params
            });
        }
        throw Error('getCloudcasts() error: invalid params');
    }
    getCloudcast(cloudcastId) {
        return MixcloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('cloudcast', { cloudcastId }), async () => {
            const data = await mixcloud_fetch_1.default.cloudcast(cloudcastId).getInfo();
            return data ? __classPrivateFieldGet(this, _CloudcastModel_instances, "m", _CloudcastModel_convertFetchedCloudcastToEntity).call(this, data) : null;
        });
    }
    getSearchOptions() {
        return {
            dateUploaded: {
                name: MixcloudContext_1.default.getI18n('MIXCLOUD_SELECT_DATE_UPLOADED'),
                icon: 'fa fa-calendar',
                values: [
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_PAST_WEEK'), value: 'pastWeek' },
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_PAST_MONTH'), value: 'pastMonth' },
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_PAST_YEAR'), value: 'pastYear' },
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_ANY_TIME'), value: 'anyTime' }
                ]
            }
        };
    }
}
_CloudcastModel_instances = new WeakSet(), _CloudcastModel_getCloudcastsByType = async function _CloudcastModel_getCloudcastsByType(params) {
    const result = await this.loopFetch({
        callbackParams: { ...params },
        getFetchPromise: __classPrivateFieldGet(this, _CloudcastModel_instances, "m", _CloudcastModel_getCloudcastsFetchPromise).bind(this),
        getItemsFromFetchResult: (__classPrivateFieldGet(this, _CloudcastModel_instances, "m", _CloudcastModel_getCloudcastsFromFetchResult).bind(this)),
        getNextPageTokenFromFetchResult: __classPrivateFieldGet(this, _CloudcastModel_instances, "m", _CloudcastModel_getNextPageTokenFromCloudcastsFetchResult).bind(this),
        convertToEntity: __classPrivateFieldGet(this, _CloudcastModel_instances, "m", _CloudcastModel_convertFetchedCloudcastToEntity).bind(this),
        onEnd: (__classPrivateFieldGet(this, _CloudcastModel_instances, "m", _CloudcastModel_onGetCloudcastsLoopFetchEnd).bind(this)),
        pageOffset: params.pageOffset,
        pageToken: params.pageToken,
        limit: params.limit
    });
    this.cacheCloudcasts(result.items);
    return result;
}, _CloudcastModel_getCloudcastsFetchPromise = function _CloudcastModel_getCloudcastsFetchPromise(params) {
    const cacheParams = {
        limit: params.limit,
        pageToken: params.pageToken
    };
    if (params.getType === 'byUser') {
        cacheParams.username = params.username;
        cacheParams.orderBy = params.orderBy;
    }
    else if (params.getType === 'byPlaylist') {
        cacheParams.playlistId = params.playlistId;
    }
    else if (params.getType === 'bySearch') {
        cacheParams.keywords = params.keywords;
        cacheParams.dateUploaded = params.dateUploaded;
    }
    return MixcloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('cloudcasts', cacheParams), async () => {
        const paginationParams = {
            limit: params.limit,
            pageToken: params.pageToken
        };
        switch (params.getType) {
            case 'byUser':
                const fetchedByUser = await mixcloud_fetch_1.default.user(params.username).getShows({
                    orderBy: params.orderBy,
                    ...paginationParams
                });
                if (!fetchedByUser) {
                    throw Error(`User '${params.username}' not found`);
                }
                return fetchedByUser;
            case 'byPlaylist':
                const fetchedByPlaylist = await mixcloud_fetch_1.default.playlist(params.playlistId).getShows(paginationParams);
                if (!fetchedByPlaylist) {
                    throw Error(`Playlist #${params.playlistId} not found`);
                }
                return fetchedByPlaylist;
            case 'bySearch':
                return await mixcloud_fetch_1.default.search(params.keywords).getShows({
                    dateUploaded: params.dateUploaded,
                    ...paginationParams
                });
        }
    });
}, _CloudcastModel_getCloudcastsFromFetchResult = function _CloudcastModel_getCloudcastsFromFetchResult(result) {
    if (!result) {
        return [];
    }
    return result.items.slice(0);
}, _CloudcastModel_getNextPageTokenFromCloudcastsFetchResult = function _CloudcastModel_getNextPageTokenFromCloudcastsFetchResult(result) {
    return result?.nextPageToken && result.items.length > 0 ? result.nextPageToken : null;
}, _CloudcastModel_convertFetchedCloudcastToEntity = function _CloudcastModel_convertFetchedCloudcastToEntity(item) {
    return EntityConverter_1.default.convertCloudcast(item);
}, _CloudcastModel_onGetCloudcastsLoopFetchEnd = function _CloudcastModel_onGetCloudcastsLoopFetchEnd(result, lastFetchResult) {
    return {
        ...result,
        params: lastFetchResult.params
    };
};
exports.default = CloudcastModel;
//# sourceMappingURL=CloudcastModel.js.map