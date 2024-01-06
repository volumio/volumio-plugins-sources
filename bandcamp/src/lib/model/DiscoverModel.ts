import bcfetch, { Album, DiscoverParams, DiscoverResult } from 'bandcamp-fetch';
import bandcamp from '../BandcampContext';
import BaseModel, { LoopFetchCallbackParams, LoopFetchResult } from './BaseModel';
import AlbumEntity from '../entities/AlbumEntity';
import EntityConverter from '../util/EntityConverter';

export interface DiscoveryModelGetDiscoverResultParams {
  discoverParams: DiscoverParams;
  pageToken?: string;
  pageOffset?: number;
  limit: number;
}

interface GetDiscoverResultLoopFetchCallbackParams extends LoopFetchCallbackParams {
  discoverParams: DiscoverParams;
}

export interface DiscoverLoopFetchResult extends LoopFetchResult<AlbumEntity> {
  params: DiscoverParams;
}

export default class DiscoverModel extends BaseModel {

  getDiscoverResult(params: DiscoveryModelGetDiscoverResultParams) {
    return this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getDiscoverResultFetchPromise.bind(this),
      getItemsFromFetchResult: this.#getDiscoverItemsFromFetchResult.bind(this),
      getNextPageTokenFromFetchResult: this.#getNextPageTokenFromDiscoverFetchResult.bind(this),
      convertToEntity: this.#convertFetchedDiscoverItemToEntity.bind(this),
      onEnd: this.#onDiscoverLoopFetchEnd.bind(this),
      pageOffset: params.pageOffset,
      pageToken: params.pageToken,
      limit: params.limit
    });
  }

  #getDiscoverResultFetchPromise(params: GetDiscoverResultLoopFetchCallbackParams) {
    let page = 0;
    if (params.pageToken) {
      const parsedPageToken = JSON.parse(params.pageToken);
      page = parsedPageToken?.page || 0;
    }

    const queryParams: DiscoverParams = {
      ...params.discoverParams,
      page,
      albumImageFormat: this.getAlbumImageFormat(),
      artistImageFormat: this.getArtistImageFormat()
    };

    return bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('discover', queryParams),
      () => bcfetch.limiter.discovery.discover(queryParams));
  }

  #getDiscoverItemsFromFetchResult(result: DiscoverResult) {
    return result.items.slice(0);
  }

  #getNextPageTokenFromDiscoverFetchResult(result: DiscoverResult, params: GetDiscoverResultLoopFetchCallbackParams) {
    let page = 0, indexRef = 0;
    if (params.pageToken) {
      const parsedPageToken = JSON.parse(params.pageToken);
      page = parsedPageToken?.page || 0;
      indexRef = parsedPageToken?.indexRef || 0;
    }
    if (result.items.length > 0 && result.total > indexRef + result.items.length) {
      const nextPageToken = {
        page: page + 1,
        indexRef: indexRef + result.items.length
      };
      return JSON.stringify(nextPageToken);
    }

    return null;
  }

  #convertFetchedDiscoverItemToEntity(item: Album): AlbumEntity {
    return EntityConverter.convertAlbum(item);
  }

  #onDiscoverLoopFetchEnd(result: LoopFetchResult<AlbumEntity>, lastFetchResult: DiscoverResult) {
    const r: DiscoverLoopFetchResult = {
      ...result,
      params: lastFetchResult.params
    };
    delete r.params.page;
    return r;
  }


  getDiscoverOptions() {
    return bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('discoverOptions'),
      () => bcfetch.limiter.discovery.getAvailableOptions());
  }
}
