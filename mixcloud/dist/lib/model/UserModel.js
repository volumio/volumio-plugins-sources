"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _UserModel_instances, _UserModel_getUsersFetchPromise, _UserModel_getUsersFromFetchResult, _UserModel_getNextPageTokenFromUsersFetchResult, _UserModel_convertFetchedUserToEntity, _UserModel_onGetUsersLoopFetchEnd;
Object.defineProperty(exports, "__esModule", { value: true });
const mixcloud_fetch_1 = __importDefault(require("mixcloud-fetch"));
const MixcloudContext_1 = __importDefault(require("../MixcloudContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const EntityConverter_1 = __importDefault(require("../util/EntityConverter"));
class UserModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _UserModel_instances.add(this);
    }
    getUsers(params) {
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: __classPrivateFieldGet(this, _UserModel_instances, "m", _UserModel_getUsersFetchPromise).bind(this),
            getItemsFromFetchResult: __classPrivateFieldGet(this, _UserModel_instances, "m", _UserModel_getUsersFromFetchResult).bind(this),
            getNextPageTokenFromFetchResult: __classPrivateFieldGet(this, _UserModel_instances, "m", _UserModel_getNextPageTokenFromUsersFetchResult).bind(this),
            convertToEntity: __classPrivateFieldGet(this, _UserModel_instances, "m", _UserModel_convertFetchedUserToEntity).bind(this),
            onEnd: __classPrivateFieldGet(this, _UserModel_instances, "m", _UserModel_onGetUsersLoopFetchEnd).bind(this),
            pageOffset: params.pageOffset,
            pageToken: params.pageToken,
            limit: params.limit
        });
    }
    getUser(username) {
        return MixcloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('user', { username }), async () => {
            const data = await mixcloud_fetch_1.default.user(username).getInfo();
            return data ? __classPrivateFieldGet(this, _UserModel_instances, "m", _UserModel_convertFetchedUserToEntity).call(this, data) : null;
        });
    }
    getShowsOptions() {
        return {
            orderBy: {
                name: MixcloudContext_1.default.getI18n('MIXCLOUD_SELECT_ORDER_BY'),
                icon: 'fa fa-sort',
                values: [
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_ORDER_BY_TRENDING'), value: 'trending' },
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_ORDER_BY_POPULAR'), value: 'popular' },
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_ORDER_BY_LATEST'), value: 'latest' },
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_ORDER_BY_OLDEST'), value: 'oldest' }
                ]
            }
        };
    }
    getSearchOptions() {
        return {
            dateJoined: {
                name: MixcloudContext_1.default.getI18n('MIXCLOUD_SELECT_DATE_JOINED'),
                icon: 'fa fa-sign-in',
                values: [
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_PAST_WEEK'), value: 'pastWeek' },
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_PAST_MONTH'), value: 'pastMonth' },
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_PAST_YEAR'), value: 'pastYear' },
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_ANY_TIME'), value: 'anyTime' }
                ]
            },
            userType: {
                name: MixcloudContext_1.default.getI18n('MIXCLOUD_SELECT_USER_TYPE'),
                icon: 'fa fa-user',
                values: [
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_UPLOADER'), value: 'uploader' },
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_LISTENER'), value: 'listener' },
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_ANY'), value: 'any' }
                ]
            }
        };
    }
}
_UserModel_instances = new WeakSet(), _UserModel_getUsersFetchPromise = function _UserModel_getUsersFetchPromise(params) {
    const cacheParams = {
        keywords: params.keywords,
        dateJoined: params.dateJoined,
        userType: params.userType,
        limit: params.limit,
        pageToken: params.pageToken
    };
    return MixcloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('users', cacheParams), () => mixcloud_fetch_1.default.search(params.keywords).getUsers({
        dateJoined: params.dateJoined,
        userType: params.userType,
        limit: params.limit,
        pageToken: params.pageToken
    }));
}, _UserModel_getUsersFromFetchResult = function _UserModel_getUsersFromFetchResult(result) {
    return result.items.slice(0);
}, _UserModel_getNextPageTokenFromUsersFetchResult = function _UserModel_getNextPageTokenFromUsersFetchResult(result) {
    return result.nextPageToken && result.items.length > 0 ? result.nextPageToken : null;
}, _UserModel_convertFetchedUserToEntity = function _UserModel_convertFetchedUserToEntity(item) {
    return EntityConverter_1.default.convertUser(item);
}, _UserModel_onGetUsersLoopFetchEnd = function _UserModel_onGetUsersLoopFetchEnd(result, lastFetchResult) {
    return {
        ...result,
        params: lastFetchResult.params
    };
};
exports.default = UserModel;
//# sourceMappingURL=UserModel.js.map