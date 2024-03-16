import mcfetch, { LiveStreamAPI, LiveStreamAPIGetCurrentParams, LiveStream } from 'mixcloud-fetch';
import mixcloud from '../MixcloudContext';
import BaseModel, { CommonModelPaginationParams, LoopFetchResult, OptionBundle } from './BaseModel';
import EntityConverter from '../util/EntityConverter';
import { LiveStreamEntity } from '../entities/LiveStreamEntity';

export type LiveStreamOrderBy = NonNullable<LiveStreamAPIGetCurrentParams['orderBy']>;

export interface LiveStreamOptionValues {
  orderBy: LiveStreamOrderBy;
  category: string;
}

export interface LiveStreamModelGetLiveStreamsParams extends CommonModelPaginationParams {
  orderBy?: LiveStreamOrderBy;
  category?: string;
}

export type GetLiveStreamsFetchResult = Awaited<ReturnType<LiveStreamAPI['getCurrent']>>;

export interface GetLiveStreamsLoopFetchResult extends LoopFetchResult<LiveStreamEntity> {
  params: GetLiveStreamsFetchResult['params'];
}

export default class LiveStreamModel extends BaseModel {

  getLiveStreams(params: LiveStreamModelGetLiveStreamsParams) {
    return this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getLiveStreamsFetchPromise.bind(this),
      getItemsFromFetchResult: this.#getLiveStreamsFromFetchResult.bind(this),
      getNextPageTokenFromFetchResult: this.#getNextPageTokenFromLiveStreamsFetchResult.bind(this),
      convertToEntity: this.#convertFetchedLiveStreamToEntity.bind(this),
      onEnd: this.#onGetLiveStreamsLoopFetchEnd.bind(this),
      pageOffset: params.pageOffset,
      pageToken: params.pageToken,
      limit: params.limit
    });
  }

  #getLiveStreamsFetchPromise(params: LiveStreamModelGetLiveStreamsParams) {
    // Do not cache live stream data
    return mcfetch.liveStream.getCurrent({
      category: params.category,
      orderBy: params.orderBy,
      limit: params.limit,
      pageToken: params.pageToken
    });
  }

  #getLiveStreamsFromFetchResult(result: GetLiveStreamsFetchResult) {
    return result.items.slice(0);
  }

  #getNextPageTokenFromLiveStreamsFetchResult(result: GetLiveStreamsFetchResult) {
    return result.nextPageToken && result.items.length > 0 ? result.nextPageToken : null;
  }

  #convertFetchedLiveStreamToEntity(item: LiveStream) {
    return EntityConverter.convertLiveStream(item);
  }

  #onGetLiveStreamsLoopFetchEnd(result: LoopFetchResult<LiveStreamEntity>, lastFetchResult: GetLiveStreamsFetchResult): GetLiveStreamsLoopFetchResult {
    return {
      ...result,
      params: lastFetchResult.params
    };
  }

  async getLiveStream(username: string) {
    const data = await mcfetch.user(username).getLiveStream();
    return data ? this.#convertFetchedLiveStreamToEntity(data) : null;
  }

  async getCategories() {
    return mixcloud.getCache().getOrSet(
      this.getCacheKeyForFetch('liveStreamCategories'),
      () => mcfetch.liveStream.getCategories()
    );
  }

  async getLiveStreamsOptions(): Promise<OptionBundle<LiveStreamOptionValues>> {
    const categories = await this.getCategories();
    const categoryValues = categories.map((category) => ({
      name: category,
      value: category
    }));
    categoryValues.unshift({
      name: mixcloud.getI18n('MIXCLOUD_ALL_CATEGORIES'),
      value: ''
    });

    return {
      category: {
        name: mixcloud.getI18n('MIXCLOUD_SELECT_CATEGORY'),
        icon: 'fa fa-music',
        values: categoryValues
      },
      orderBy: {
        name: mixcloud.getI18n('MIXCLOUD_SELECT_ORDER_BY'),
        icon: 'fa fa-sort',
        values: [
          { name: mixcloud.getI18n('MIXCLOUD_ORDER_BY_POPULAR'), value: 'popular' },
          { name: mixcloud.getI18n('MIXCLOUD_ORDER_BY_MOST_RECENT'), value: 'mostRecent' }
        ]
      }
    };
  }
}
