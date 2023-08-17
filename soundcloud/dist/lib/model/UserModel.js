"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _UserModel_instances, _UserModel_getUsersFetchPromise, _UserModel_convertFetchedUserToEntity;
Object.defineProperty(exports, "__esModule", { value: true });
const soundcloud_fetch_1 = require("soundcloud-fetch");
const SoundCloudContext_1 = __importDefault(require("../SoundCloudContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const Mapper_1 = __importDefault(require("./Mapper"));
class UserModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _UserModel_instances.add(this);
    }
    getUsers(params) {
        const getItems = (this.commonGetCollectionItemsFromLoopFetchResult);
        const getNextPageToken = (this.commonGetNextPageTokenFromLoopFetchResult);
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: __classPrivateFieldGet(this, _UserModel_instances, "m", _UserModel_getUsersFetchPromise).bind(this),
            getItemsFromFetchResult: getItems.bind(this),
            getNextPageTokenFromFetchResult: getNextPageToken.bind(this),
            convertToEntity: __classPrivateFieldGet(this, _UserModel_instances, "m", _UserModel_convertFetchedUserToEntity).bind(this),
            pageToken: params.pageToken,
            pageOffset: params.pageOffset,
            limit: params.limit
        });
    }
    async getUser(userId) {
        const info = await SoundCloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('user', { userId }), () => this.getSoundCloudAPI().getUser(userId));
        if (info) {
            return Mapper_1.default.mapUser(info);
        }
        return null;
    }
}
exports.default = UserModel;
_UserModel_instances = new WeakSet(), _UserModel_getUsersFetchPromise = async function _UserModel_getUsersFetchPromise(params) {
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
        queryParams.type = 'user';
        const cacheKeyParams = {
            search: q,
            ...queryParams
        };
        return SoundCloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('users', cacheKeyParams), () => api.search(q, { ...queryParams, type: 'user' }));
    }
    else if (params.myFollowing) {
        const cacheKeyParams = {
            myFollowing: true,
            ...queryParams
        };
        return SoundCloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('users', cacheKeyParams), () => api.me.getFollowing(queryParams));
    }
    throw Error('Missing or invalid criteria for users');
}, _UserModel_convertFetchedUserToEntity = function _UserModel_convertFetchedUserToEntity(data) {
    return Mapper_1.default.mapUser(data);
};
//# sourceMappingURL=UserModel.js.map