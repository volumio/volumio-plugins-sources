import md5 from 'md5';
import { CloudcastEntity } from '../entities/CloudcastEntity';
import mixcloud from '../MixcloudContext';

/*Export type OptionBundle<T extends any> =
  T extends { [K in keyof T]: { icon: string; values: any } } ? { [K in keyof T]: OptionBundleEntry<T[K]['values']> } : any;*/

export type OptionBundle<T extends Record<string, any>> = {
  [K in keyof T]: OptionBundleEntry<T[K]>;
};

export interface OptionBundleEntry<T> {
  name: string;
  icon: string;
  values: { name: string; value: T; }[];
}

export interface CommonModelPaginationParams {
  pageToken?: string;
  pageOffset?: number;
  limit: number;
}

export interface LoopFetchParams<R, I, C extends LoopFetchCallbackParams, E, F extends LoopFetchResult<E>> extends LoopFetchCallbackParams {
  callbackParams?: C;
  getFetchPromise: (params: C) => Promise<R>;
  getItemsFromFetchResult: (fetchResult: R, params: C) => I[];
  filterFetchedItem?: (item: I, params: C) => boolean;
  getNextPageTokenFromFetchResult?: (fetchResult: R, params: C) => string | null;
  convertToEntity: (item: I, params: C) => E | null;
  onEnd?:(result: LoopFetchResult<E>, lastFetchResult: R, params: C) => F;
  maxIterations?: number;
  pageOffset?: number;
  limit?: number;
}

export interface LoopFetchCallbackParams {
  pageToken?: string;
}

export interface LoopFetchResult<E> {
  items: E[];
  nextPageToken: string | null;
  nextPageOffset: number;
}

export default class BaseModel {

  async #doLoopFetch<R, I, C extends LoopFetchCallbackParams, E, F extends LoopFetchResult<E>>(
    params: LoopFetchParams<R, I, C, E, F> & { onEnd: undefined }, currentList?: I[], iteration?: number): Promise<LoopFetchResult<E>>;
  async #doLoopFetch<R, I, C extends LoopFetchCallbackParams, E, F extends LoopFetchResult<E>>(
    params: LoopFetchParams<R, I, C, E, F>, currentList?: I[], iteration?: number): Promise<F>;
  async #doLoopFetch<R, I, C extends LoopFetchCallbackParams, E, F extends LoopFetchResult<E>>(
    params: LoopFetchParams<R, I, C, E, F>, currentList: I[] = [], iteration = 1): Promise<LoopFetchResult<E> | F> {

    const pageOffset = params.pageOffset || 0;
    const limit = params.limit || 47;
    const callbackParams = { ...params.callbackParams } as C;
    if (params.pageToken) {
      callbackParams.pageToken = params.pageToken;
    }

    const fetchResult = await params.getFetchPromise(callbackParams);

    let items = params.getItemsFromFetchResult(fetchResult, callbackParams);
    if (pageOffset) {
      items.splice(0, pageOffset);
    }
    // Number of items to add before hitting limit
    const itemCountToLimit = limit - currentList.length;

    let nextPageOffset = 0;
    const filter = params.filterFetchedItem;
    if (items.length > 0 && filter) {
      let itemOffset = 0;
      let includeCount = 0;
      const filtered = items.filter((item) => {
        if (includeCount >= itemCountToLimit) {
          return false;
        }
        const inc = filter(item, callbackParams);
        if (inc) {
          includeCount++;
        }
        itemOffset++;
        return inc;
      });
      if (itemOffset === items.length) {
        nextPageOffset = 0;
      }
      else {
        nextPageOffset = itemOffset + pageOffset;
      }
      items = filtered;
    }
    else if (items) {
      if (items.length > itemCountToLimit) {
        items.splice(itemCountToLimit);
        nextPageOffset = items.length + pageOffset;
      }
      else {
        nextPageOffset = 0;
      }
    }
    currentList = [ ...currentList, ...items ];

    let nextPageToken;
    if (nextPageOffset > 0 && params.pageToken) {
      nextPageToken = params.pageToken;
    }
    else if (nextPageOffset === 0 && params.getNextPageTokenFromFetchResult) {
      nextPageToken = params.getNextPageTokenFromFetchResult(fetchResult, callbackParams);
    }
    else {
      nextPageToken = null;
    }

    iteration++;
    const maxFetchIterationsReached = params.maxIterations !== undefined && iteration > params.maxIterations;
    if (!maxFetchIterationsReached && currentList.length < limit && nextPageToken) { // Get more items
      params.pageToken = nextPageToken;
      params.pageOffset = 0;
      return await this.#doLoopFetch(params, currentList, iteration);
    }

    const result: LoopFetchResult<E> = {
      items: currentList.reduce<E[]>((reduced, item) => {
        const entity = params.convertToEntity(item, callbackParams);
        if (entity) {
          reduced.push(entity);
        }
        return reduced;
      }, []),
      nextPageToken: maxFetchIterationsReached ? null : nextPageToken,
      nextPageOffset: maxFetchIterationsReached ? 0 : nextPageOffset
    };
    if (params.onEnd) {
      return params.onEnd(result, fetchResult, callbackParams);
    }
    return result;

  }

  loopFetch<R, I, C extends LoopFetchCallbackParams, E, F extends LoopFetchResult<E>>(params: LoopFetchParams<R, I, C, E, F>) {
    return this.#doLoopFetch({ ...params });
  }

  protected getCacheKeyForFetch(resourceName: string, cacheKeyParams?: Record<string, any>) {
    const prefix = `mixcloud.model.${resourceName}`;

    if (!cacheKeyParams) {
      return md5(prefix);
    }

    const key = Object.keys(cacheKeyParams).sort().reduce((s, k) => {
      const p = `${k}=${encodeURIComponent(JSON.stringify(cacheKeyParams[k]))}`;
      return `${s}@${p}`;
    }, prefix);

    return md5(key);
  }

  protected cacheCloudcasts(cloudcasts: CloudcastEntity[]) {
    for (const cloudcast of cloudcasts) {
      mixcloud.getCache().put(
        this.getCacheKeyForFetch('cloudcast', { cloudcastId: cloudcast.id }), cloudcast);
    }
  }
}
