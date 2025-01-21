import bcfetch, { type Album, type DiscoverParams, type DiscoverResult, type DiscoverResultContinuation } from 'bandcamp-fetch';
import bandcamp from '../BandcampContext';
import BaseModel, { type LoopFetchCallbackParams, type LoopFetchResult } from './BaseModel';
import type AlbumEntity from '../entities/AlbumEntity';
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
    const queryParams = ((): DiscoverParams | DiscoverResultContinuation => {
      if (params.pageToken) {
        const parsedPageToken = JSON.parse(params.pageToken);
        const continuation = parsedPageToken?.continuation;
        if (continuation) {
          return continuation;
        }
      }
      return {
        ...params.discoverParams,
        albumImageFormat: this.getAlbumImageFormat(),
        artistImageFormat: this.getArtistImageFormat()
      };
    })();

    return bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('discover', queryParams),
      () => bcfetch.limiter.discovery.discover(queryParams));
  }

  #getDiscoverItemsFromFetchResult(result: DiscoverResult) {
    return result.items.filter((value) => value.type === 'album');
  }

  #getNextPageTokenFromDiscoverFetchResult(result: DiscoverResult, params: GetDiscoverResultLoopFetchCallbackParams) {
    let indexRef = 0;
    if (params.pageToken) {
      const parsedPageToken = JSON.parse(params.pageToken);
      indexRef = parsedPageToken?.indexRef || 0;
    }
    if (result.continuation && result.items.length > 0 && result.total > indexRef + result.items.length) {
      const nextPageToken = {
        continuation: result.continuation,
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
    return r;
  }


  getDiscoverOptions() {
    return bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('discoverOptions'),
      async () => {
        const opts = await bcfetch.limiter.discovery.getAvailableOptions();
        opts.categories = opts.categories.filter((cat) => cat.slug !== 'tshirt');
        return opts;
      }
    );
  }
}
