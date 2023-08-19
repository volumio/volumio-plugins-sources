import md5 from 'md5';
import sc from '../SoundCloudContext';
import SoundCloud, { Collection, CollectionContinuation, EntityType } from 'soundcloud-fetch';

export interface LoopFetchParams<R, I, C extends LoopFetchCallbackParams, E, F extends LoopFetchResult<E>> extends LoopFetchCallbackParams {
  callbackParams?: C;
  getFetchPromise: (params: C) => Promise<R>;
  getItemsFromFetchResult: (fetchResult: R, params: C) => I[];
  filterFetchedItem?: (item: I, params: C) => boolean;
  getNextPageTokenFromFetchResult?: (fetchResult: R, params: C) => string | null;
  convertToEntity: (item: I, params: C) => Promise<E | null>;
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

export default abstract class BaseModel {

  static queryMaxLimit = 50;

  static #api: SoundCloud;
  static #hasAccessToken = false;

  protected getSoundCloudAPI() {
    return BaseModel.#doGetSoundCloudAPI();
  }

  static #doGetSoundCloudAPI() {
    if (!BaseModel.#api) {
      BaseModel.#api = new SoundCloud();
    }
    return BaseModel.#api;
  }

  static setAccessToken(value: string) {
    const api = this.#doGetSoundCloudAPI();
    api.setAccessToken(value);
    this.#hasAccessToken = !!value;
  }

  hasAccessToken() {
    return BaseModel.#hasAccessToken;
  }

  static setLocale(value: string) {
    const api = this.#doGetSoundCloudAPI();
    api.setLocale(value);
  }

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

    let items = [ ...params.getItemsFromFetchResult(fetchResult, callbackParams) ];
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

    const entities = await Promise.all(currentList.map((item) => params.convertToEntity(item, callbackParams)));
    const result: LoopFetchResult<E> = {
      items: entities.filter((entity) => entity) as E[],
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

  protected getCacheKeyForFetch(resourceName: string, cacheKeyParams: Record<string, any>) {
    const prefix = `soundcloud.model.${resourceName}`;
    const params: Record<string, any> = {
      ...cacheKeyParams,
      locale: sc.getConfigValue('locale')
    };
    const key = Object.keys(params).sort().reduce((s, k) => {
      const p = `${k}=${encodeURIComponent(JSON.stringify(params[k]))}`;
      return `${s}@${p}`;
    }, prefix);

    return md5(key);
  }

  protected commonGetCollectionItemsFromLoopFetchResult<T extends EntityType>(result: Collection<T>): T[] {
    return result.items;
  }

  protected commonGetNextPageTokenFromLoopFetchResult<T extends EntityType>(result: Collection<T>) {
    const items = result.items;
    if (items.length > 0 && result.continuation) {
      return CollectionContinuation.stringify(result.continuation);
    }
    return null;
  }

  protected async commonGetLoopFetchResultByPageToken<T extends EntityType>(params: LoopFetchCallbackParams): Promise<Collection<T> | null> {
    if (params.pageToken) {
      const api = this.getSoundCloudAPI();
      const continuation = CollectionContinuation.parse(params.pageToken) as CollectionContinuation<T>;
      if (continuation) {
        return api.getContinuation(continuation);
      }
    }
    return null;
  }
}
