"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _ArticleModel_instances, _ArticleModel_getArticlesFetchPromise, _ArticleModel_getArticlesFromFetchResult, _ArticleModel_getNextPageTokenFromArticlesFetchResult, _ArticleModel_convertFetchedArticleListItemToEntity, _ArticleModel_convertFetchedArticleToEntity;
Object.defineProperty(exports, "__esModule", { value: true });
const bandcamp_fetch_1 = __importDefault(require("bandcamp-fetch"));
const BandcampContext_1 = __importDefault(require("../BandcampContext"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const EntityConverter_1 = __importDefault(require("../util/EntityConverter"));
class ArticleModel extends BaseModel_1.default {
    constructor() {
        super(...arguments);
        _ArticleModel_instances.add(this);
    }
    getArticles(params) {
        return this.loopFetch({
            callbackParams: { ...params },
            getFetchPromise: __classPrivateFieldGet(this, _ArticleModel_instances, "m", _ArticleModel_getArticlesFetchPromise).bind(this),
            getItemsFromFetchResult: __classPrivateFieldGet(this, _ArticleModel_instances, "m", _ArticleModel_getArticlesFromFetchResult).bind(this),
            getNextPageTokenFromFetchResult: __classPrivateFieldGet(this, _ArticleModel_instances, "m", _ArticleModel_getNextPageTokenFromArticlesFetchResult).bind(this),
            convertToEntity: __classPrivateFieldGet(this, _ArticleModel_instances, "m", _ArticleModel_convertFetchedArticleListItemToEntity).bind(this),
            pageOffset: params.pageOffset,
            pageToken: params.pageToken,
            limit: params.limit
        });
    }
    async getArticle(articleUrl) {
        const queryParams = {
            articleUrl,
            albumImageFormat: this.getAlbumImageFormat(),
            artistImageFormat: this.getArtistImageFormat()
        };
        const article = await BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('article', queryParams), () => bandcamp_fetch_1.default.limiter.article.getArticle(queryParams));
        return __classPrivateFieldGet(this, _ArticleModel_instances, "m", _ArticleModel_convertFetchedArticleToEntity).call(this, article);
    }
    getArticleCategories() {
        return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('articleCategories'), () => bandcamp_fetch_1.default.limiter.article.getCategories());
    }
}
exports.default = ArticleModel;
_ArticleModel_instances = new WeakSet(), _ArticleModel_getArticlesFetchPromise = function _ArticleModel_getArticlesFetchPromise(params) {
    let page = 1;
    if (params.pageToken) {
        const parsedPageToken = JSON.parse(params.pageToken);
        page = parsedPageToken?.page || 1;
    }
    const queryParams = {
        page,
        imageFormat: this.getAlbumImageFormat()
    };
    if (params.categoryUrl) {
        queryParams.categoryUrl = params.categoryUrl;
    }
    return BandcampContext_1.default.getCache().getOrSet(this.getCacheKeyForFetch('articles', queryParams), () => bandcamp_fetch_1.default.limiter.article.list(queryParams));
}, _ArticleModel_getArticlesFromFetchResult = function _ArticleModel_getArticlesFromFetchResult(result) {
    return result.articles.slice(0);
}, _ArticleModel_getNextPageTokenFromArticlesFetchResult = function _ArticleModel_getNextPageTokenFromArticlesFetchResult(result, params) {
    let page = 1, indexRef = 0;
    if (params.pageToken) {
        const parsedPageToken = JSON.parse(params.pageToken);
        page = parsedPageToken?.page || 1;
        indexRef = parsedPageToken?.indexRef || 0;
    }
    if (result.articles.length > 0 && result.total > indexRef + result.articles.length) {
        const nextPageToken = {
            page: page + 1,
            indexRef: indexRef + result.articles.length
        };
        return JSON.stringify(nextPageToken);
    }
    return null;
}, _ArticleModel_convertFetchedArticleListItemToEntity = function _ArticleModel_convertFetchedArticleListItemToEntity(item) {
    return EntityConverter_1.default.convertArticleListItem(item);
}, _ArticleModel_convertFetchedArticleToEntity = function _ArticleModel_convertFetchedArticleToEntity(item) {
    return EntityConverter_1.default.convertArticle(item);
};
//# sourceMappingURL=ArticleModel.js.map