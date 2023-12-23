import mcfetch, { SearchAPI, Tag } from 'mixcloud-fetch';
import mixcloud from '../MixcloudContext';
import BaseModel, { CommonModelPaginationParams, LoopFetchResult } from './BaseModel';
import EntityConverter from '../util/EntityConverter';
import { SlugEntity } from '../entities/SlugEntity';

export interface TagModelGetTagsParams extends CommonModelPaginationParams {
  keywords: string;
}

export type GetTagsFetchResult = Awaited<ReturnType<SearchAPI['getTags']>>;

export default class TagModel extends BaseModel {

  getTags(params: TagModelGetTagsParams) {
    return this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getTagsFetchPromise.bind(this),
      getItemsFromFetchResult: this.#getTagsFromFetchResult.bind(this),
      getNextPageTokenFromFetchResult: this.#getNextPageTokenFromTagsFetchResult.bind(this),
      convertToEntity: this.#convertFetchedTagToEntity.bind(this),
      onEnd: this.#onGetTagsLoopFetchEnd.bind(this),
      pageOffset: params.pageOffset,
      pageToken: params.pageToken,
      limit: params.limit
    });
  }

  #getTagsFetchPromise(params: TagModelGetTagsParams) {
    const cacheParams: Record<string, any> = {
      keywords: params.keywords,
      limit: params.limit,
      pageToken: params.pageToken
    };
    return mixcloud.getCache().getOrSet<GetTagsFetchResult>(
      this.getCacheKeyForFetch('tags', cacheParams),
      () => mcfetch.search(params.keywords).getTags({
        limit: params.limit,
        pageToken: params.pageToken
      }));
  }

  #getTagsFromFetchResult(result: GetTagsFetchResult) {
    return result.items.slice(0);
  }

  #getNextPageTokenFromTagsFetchResult(result: GetTagsFetchResult) {
    return result.nextPageToken && result.items.length > 0 ? result.nextPageToken : null;
  }

  #convertFetchedTagToEntity(item: Tag) {
    return EntityConverter.convertSlugLike(item);
  }

  #onGetTagsLoopFetchEnd(result: LoopFetchResult<SlugEntity>, lastFetchResult: GetTagsFetchResult) {
    return {
      ...result,
      params: lastFetchResult.params
    };
  }
}
