import bcfetch, { Article, ArticleAPIListParams, ArticleList, ArticleListItem } from 'bandcamp-fetch';
import bandcamp from '../BandcampContext';
import BaseModel, { LoopFetchCallbackParams } from './BaseModel';
import ArticleEntity from '../entities/ArticleEntity';
import EntityConverter from '../util/EntityConverter';

export interface ArticleModelGetArticlesParams {
  categoryUrl?: string;
  pageToken?: string;
  pageOffset?: number;
  limit: number;
}

interface GetArticlesLoopFetchCallbackParams extends LoopFetchCallbackParams {
  categoryUrl?: string;
}

export default class ArticleModel extends BaseModel {

  getArticles(params: ArticleModelGetArticlesParams) {
    return this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getArticlesFetchPromise.bind(this),
      getItemsFromFetchResult: this.#getArticlesFromFetchResult.bind(this),
      getNextPageTokenFromFetchResult: this.#getNextPageTokenFromArticlesFetchResult.bind(this),
      convertToEntity: this.#convertFetchedArticleListItemToEntity.bind(this),
      pageOffset: params.pageOffset,
      pageToken: params.pageToken,
      limit: params.limit
    });
  }

  #getArticlesFetchPromise(params: GetArticlesLoopFetchCallbackParams) {
    let page = 1;
    if (params.pageToken) {
      const parsedPageToken = JSON.parse(params.pageToken);
      page = parsedPageToken?.page || 1;
    }

    const queryParams: ArticleAPIListParams = {
      page,
      imageFormat: this.getAlbumImageFormat()
    };
    if (params.categoryUrl) {
      queryParams.categoryUrl = params.categoryUrl;
    }

    return bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('articles', queryParams),
      () => bcfetch.limiter.article.list(queryParams));
  }

  #getArticlesFromFetchResult(result: ArticleList) {
    return result.articles.slice(0);
  }

  #getNextPageTokenFromArticlesFetchResult(result: ArticleList, params: GetArticlesLoopFetchCallbackParams) {
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

  }

  #convertFetchedArticleListItemToEntity(item: ArticleListItem): ArticleEntity {
    return EntityConverter.convertArticleListItem(item);
  }

  async getArticle(articleUrl: string) {
    const queryParams = {
      articleUrl,
      albumImageFormat: this.getAlbumImageFormat(),
      artistImageFormat: this.getArtistImageFormat()
    };
    const article = await bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('article', queryParams),
      () => bcfetch.limiter.article.getArticle(queryParams));

    return this.#convertFetchedArticleToEntity(article);
  }

  getArticleCategories() {
    return bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('articleCategories'),
      () => bcfetch.limiter.article.getCategories());
  }

  #convertFetchedArticleToEntity(item: Article): ArticleEntity {
    return EntityConverter.convertArticle(item);
  }
}
