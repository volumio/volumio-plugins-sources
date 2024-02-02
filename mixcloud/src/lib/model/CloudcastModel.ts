import mcfetch, { Cloudcast, PlaylistAPI, SearchAPI, SearchAPIGetShowsParams, UserAPI, UserAPIGetShowsParams } from 'mixcloud-fetch';
import mixcloud from '../MixcloudContext';
import BaseModel, { CommonModelPaginationParams, LoopFetchResult, OptionBundle } from './BaseModel';
import EntityConverter from '../util/EntityConverter';
import { CloudcastEntity } from '../entities/CloudcastEntity';

export type GetCloudcastsType = 'byUser' | 'byPlaylist' | 'bySearch';

// Only available when fetching by user
export type CloudcastOrderby = NonNullable<UserAPIGetShowsParams['orderBy']>;

// Only available for searches
export type CloudcastDateUploaded = NonNullable<SearchAPIGetShowsParams['dateUploaded']>;

export interface CloudcastSearchOptionValues {
  dateUploaded: CloudcastDateUploaded;
}

export type CloudcastModelGetCloudcastsParams =
  CommonModelPaginationParams & ({
    username: string;
    orderBy?: CloudcastOrderby;
    playlistId?: undefined;
    keywords?: undefined;
    dateUploaded?: undefined;
  } | {
    playlistId: string;
    username?: undefined;
    keywords?: undefined;
    orderBy?: undefined;
    dateUploaded?: undefined;
  } | {
    keywords: string;
    dateUploaded?: CloudcastDateUploaded;
    username?: undefined;
    playlistId?: undefined;
    orderBy?: undefined;
  });

type GetCloudcastsParamsByType<T extends GetCloudcastsType> =
  CommonModelPaginationParams &
  (
    T extends 'byUser' ? {
      getType: 'byUser';
      username: string;
      orderBy?: CloudcastOrderby;
    } :
    T extends 'byPlaylist' ? {
      getType: 'byPlaylist';
      playlistId: string;
    } :
    T extends 'bySearch' ? {
      getType: 'bySearch';
      keywords: string;
      dateUploaded?: CloudcastDateUploaded;
    } :
    never
  );

export type GetCloudcastsFetchResult<T extends GetCloudcastsType> =
  T extends 'byUser' ? NonNullable<Awaited<ReturnType<UserAPI['getShows']>>> :
  T extends 'byPlaylist' ? NonNullable<Awaited<ReturnType<PlaylistAPI['getShows']>>> :
  T extends 'bySearch' ? NonNullable<Awaited<ReturnType<SearchAPI['getShows']>>> :
  never;

export interface GetCloudcastsLoopFetchResult<T extends GetCloudcastsType> extends LoopFetchResult<CloudcastEntity> {
  params: GetCloudcastsFetchResult<T>['params'];
}

export default class CloudcastModel extends BaseModel {

  getCloudcasts(params: CloudcastModelGetCloudcastsParams & { username: string }): Promise<GetCloudcastsLoopFetchResult<'byUser'>>;
  getCloudcasts(params: CloudcastModelGetCloudcastsParams & { playlistId: string }): Promise<GetCloudcastsLoopFetchResult<'byPlaylist'>>;
  getCloudcasts(params: CloudcastModelGetCloudcastsParams & { keywords: string }): Promise<GetCloudcastsLoopFetchResult<'bySearch'>>;
  getCloudcasts(params: CloudcastModelGetCloudcastsParams) {
    if (params.username) {
      return this.#getCloudcastsByType({
        getType: 'byUser',
        ...params
      });
    }
    if (params.playlistId) {
      return this.#getCloudcastsByType({
        getType: 'byPlaylist',
        ...params
      });
    }
    if (params.keywords) {
      return this.#getCloudcastsByType({
        getType: 'bySearch',
        ...params
      });
    }
    throw Error('getCloudcasts() error: invalid params');
  }

  async #getCloudcastsByType<T extends GetCloudcastsType>(params: GetCloudcastsParamsByType<T>) {
    const result = await this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getCloudcastsFetchPromise.bind(this),
      getItemsFromFetchResult: this.#getCloudcastsFromFetchResult.bind(this)<T>,
      getNextPageTokenFromFetchResult: this.#getNextPageTokenFromCloudcastsFetchResult.bind(this),
      convertToEntity: this.#convertFetchedCloudcastToEntity.bind(this),
      onEnd: this.#onGetCloudcastsLoopFetchEnd.bind(this)<T>,
      pageOffset: params.pageOffset,
      pageToken: params.pageToken,
      limit: params.limit
    });

    this.cacheCloudcasts(result.items);

    return result;
  }

  #getCloudcastsFetchPromise<T extends GetCloudcastsType>(params: GetCloudcastsParamsByType<T>): Promise<GetCloudcastsFetchResult<T>>;
  #getCloudcastsFetchPromise<T extends GetCloudcastsType>(params: GetCloudcastsParamsByType<T>) {
    const cacheParams: Record<string, any> = {
      limit: params.limit,
      pageToken: params.pageToken
    };
    if (params.getType === 'byUser') {
      cacheParams.username = params.username;
      cacheParams.orderBy = params.orderBy;
    }
    else if (params.getType === 'byPlaylist') {
      cacheParams.playlistId = params.playlistId;
    }
    else if (params.getType === 'bySearch') {
      cacheParams.keywords = params.keywords;
      cacheParams.dateUploaded = params.dateUploaded;
    }

    return mixcloud.getCache().getOrSet(
      this.getCacheKeyForFetch('cloudcasts', cacheParams),
      async () => {
        const paginationParams = {
          limit: params.limit,
          pageToken: params.pageToken
        };
        switch (params.getType) {
          case 'byUser':
            const fetchedByUser = await mcfetch.user(params.username).getShows({
              orderBy: params.orderBy,
              ...paginationParams
            });
            if (!fetchedByUser) {
              throw Error(`User '${params.username}' not found`);
            }
            return fetchedByUser;

          case 'byPlaylist':
            const fetchedByPlaylist = await mcfetch.playlist(params.playlistId).getShows(paginationParams);
            if (!fetchedByPlaylist) {
              throw Error(`Playlist #${params.playlistId} not found`);
            }
            return fetchedByPlaylist;

          case 'bySearch':
            return await mcfetch.search(params.keywords).getShows({
              dateUploaded: params.dateUploaded,
              ...paginationParams
            });
        }
      });
  }

  #getCloudcastsFromFetchResult<T extends GetCloudcastsType>(result: GetCloudcastsFetchResult<T> | null) {
    if (!result) {
      return [];
    }
    return result.items.slice(0);
  }

  #getNextPageTokenFromCloudcastsFetchResult<T extends GetCloudcastsType>(result: GetCloudcastsFetchResult<T> | null) {
    return result?.nextPageToken && result.items.length > 0 ? result.nextPageToken : null;
  }

  #convertFetchedCloudcastToEntity(item: Cloudcast): CloudcastEntity {
    return EntityConverter.convertCloudcast(item);
  }

  #onGetCloudcastsLoopFetchEnd<T extends GetCloudcastsType>(result: LoopFetchResult<CloudcastEntity>, lastFetchResult: GetCloudcastsFetchResult<T>): GetCloudcastsLoopFetchResult<T> {
    return {
      ...result,
      params: lastFetchResult.params
    };
  }

  getCloudcast(cloudcastId: string) {
    return mixcloud.getCache().getOrSet(
      this.getCacheKeyForFetch('cloudcast', { cloudcastId }),
      async () => {
        const data = await mcfetch.cloudcast(cloudcastId).getInfo();
        return data ? this.#convertFetchedCloudcastToEntity(data) : null;
      });
  }

  getSearchOptions(): OptionBundle<CloudcastSearchOptionValues> {
    return {
      dateUploaded: {
        name: mixcloud.getI18n('MIXCLOUD_SELECT_DATE_UPLOADED'),
        icon: 'fa fa-calendar',
        values: [
          { name: mixcloud.getI18n('MIXCLOUD_PAST_WEEK'), value: 'pastWeek' },
          { name: mixcloud.getI18n('MIXCLOUD_PAST_MONTH'), value: 'pastMonth' },
          { name: mixcloud.getI18n('MIXCLOUD_PAST_YEAR'), value: 'pastYear' },
          { name: mixcloud.getI18n('MIXCLOUD_ANY_TIME'), value: 'anyTime' }
        ]
      }
    };
  }
}
