"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _DiscoverModel_instances, _DiscoverModel_getDiscoverFetchPromise, _DiscoverModel_getCloudcastsFromFetchResult, _DiscoverModel_getNextPageTokenFromDiscoverFetchResult, _DiscoverModel_convertFetchedCloudcastToEntity, _DiscoverModel_onDiscoverLoopFetchEnd;
Object.defineProperty(exports, "__esModule", { value: true });
const mixcloud_fetch_1 = __importDefault(require("mixcloud-fetch"));
const MixcloudContext_1 = __importDefault(require("../MixcloudContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const EntityConverter_1 = __importDefault(require("../util/EntityConverter"));
class DiscoverModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _DiscoverModel_instances.add(this);
    }
    getDiscoverResults(params) {
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: (__classPrivateFieldGet(this, _DiscoverModel_instances, "m", _DiscoverModel_getDiscoverFetchPromise).bind(this)),
            getItemsFromFetchResult: __classPrivateFieldGet(this, _DiscoverModel_instances, "m", _DiscoverModel_getCloudcastsFromFetchResult).bind(this),
            getNextPageTokenFromFetchResult: __classPrivateFieldGet(this, _DiscoverModel_instances, "m", _DiscoverModel_getNextPageTokenFromDiscoverFetchResult).bind(this),
            convertToEntity: __classPrivateFieldGet(this, _DiscoverModel_instances, "m", _DiscoverModel_convertFetchedCloudcastToEntity).bind(this),
            onEnd: (__classPrivateFieldGet(this, _DiscoverModel_instances, "m", _DiscoverModel_onDiscoverLoopFetchEnd).bind(this)),
            pageOffset: params.pageOffset,
            pageToken: params.pageToken,
            limit: params.limit
        });
    }
    async getCategories() {
        const data = await MixcloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('categories'), () => mixcloud_fetch_1.default.misc.getCategories());
        const result = {};
        for (const [section, categories] of Object.entries(data)) {
            result[section] = categories.map((c) => EntityConverter_1.default.convertSlugLike(c));
        }
        return result;
    }
    getCountries() {
        return MixcloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('countries'), () => mixcloud_fetch_1.default.misc.getCountries());
    }
    async getDiscoverOptions(target) {
        let orderBy;
        switch (target.list) {
            case 'all':
                orderBy = [
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_ORDER_BY_TRENDING'), value: 'trending' },
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_ORDER_BY_POPULAR'), value: 'popular' },
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_ORDER_BY_LATEST'), value: 'latest' }
                ];
                break;
            case 'featured':
                orderBy = [
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_ORDER_BY_POPULAR'), value: 'popular' },
                    { name: MixcloudContext_1.default.getI18n('MIXCLOUD_ORDER_BY_LATEST'), value: 'latest' }
                ];
                break;
            default:
                throw Error('getDiscoverOptions() error: bad target type');
        }
        const slug = [];
        for (const categories of Object.values(await this.getCategories())) {
            slug.push(...categories.map((c) => ({
                name: c.name,
                value: c.slug
            })));
        }
        if (target.list === 'featured') {
            slug.unshift({
                name: MixcloudContext_1.default.getI18n('MIXCLOUD_ALL_CATEGORIES'),
                value: ''
            });
        }
        let country;
        if (target.list === 'all' && target.orderBy === 'trending') {
            country = (await this.getCountries()).available.map((c) => ({
                name: c.name,
                value: c.code
            }));
        }
        else {
            country = [];
        }
        return {
            slug: {
                name: MixcloudContext_1.default.getI18n('MIXCLOUD_SELECT_SLUG'),
                icon: 'fa fa-music',
                values: slug
            },
            orderBy: {
                name: MixcloudContext_1.default.getI18n('MIXCLOUD_SELECT_ORDER_BY'),
                icon: 'fa fa-sort',
                values: orderBy
            },
            country: {
                name: MixcloudContext_1.default.getI18n('MIXCLOUD_SELECT_COUNTRY'),
                icon: 'fa fa-map-marker',
                values: country
            }
        };
    }
}
_DiscoverModel_instances = new WeakSet(), _DiscoverModel_getDiscoverFetchPromise = function _DiscoverModel_getDiscoverFetchPromise(params) {
    const cacheParams = {
        list: params.list,
        slug: params.slug,
        orderBy: params.orderBy,
        limit: params.limit,
        pageToken: params.pageToken
    };
    if (params.list === 'all') {
        cacheParams.country = params.country;
    }
    return MixcloudContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('cloudcasts', cacheParams), async () => {
        const paginationParams = {
            limit: params.limit,
            pageToken: params.pageToken
        };
        switch (params.list) {
            case 'all':
                const fetchedAll = await mixcloud_fetch_1.default.tag(params.slug || '').getShows({
                    orderBy: params.orderBy,
                    country: params.country,
                    ...paginationParams
                });
                if (!fetchedAll) {
                    throw Error(`Tag '${params.slug}' not found`);
                }
                return fetchedAll;
            case 'featured':
                const fetchedFeatured = await mixcloud_fetch_1.default.tag(params.slug || '').getFeatured({
                    orderBy: params.orderBy,
                    ...paginationParams
                });
                if (!fetchedFeatured) {
                    throw Error(`Tag '${params.slug}' not found`);
                }
                return fetchedFeatured;
        }
    });
}, _DiscoverModel_getCloudcastsFromFetchResult = function _DiscoverModel_getCloudcastsFromFetchResult(result) {
    return result.items.slice(0);
}, _DiscoverModel_getNextPageTokenFromDiscoverFetchResult = function _DiscoverModel_getNextPageTokenFromDiscoverFetchResult(result) {
    return result.nextPageToken && result.items.length > 0 ? result.nextPageToken : null;
}, _DiscoverModel_convertFetchedCloudcastToEntity = function _DiscoverModel_convertFetchedCloudcastToEntity(item) {
    return EntityConverter_1.default.convertCloudcast(item);
}, _DiscoverModel_onDiscoverLoopFetchEnd = function _DiscoverModel_onDiscoverLoopFetchEnd(result, lastFetchResult) {
    return {
        ...result,
        params: lastFetchResult.params,
        selectedTags: lastFetchResult.selectedTags.map((tag) => EntityConverter_1.default.convertSlugLike(tag))
    };
};
exports.default = DiscoverModel;
//# sourceMappingURL=DiscoverModel.js.map