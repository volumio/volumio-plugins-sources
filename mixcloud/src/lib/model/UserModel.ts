import mcfetch, { SearchAPI, SearchAPIGetUsersParams, User, UserAPIGetShowsParams } from 'mixcloud-fetch';
import mixcloud from '../MixcloudContext';
import BaseModel, { CommonModelPaginationParams, LoopFetchResult, OptionBundle } from './BaseModel';
import EntityConverter from '../util/EntityConverter';
import { UserEntity } from '../entities/UserEntity';

export type UserOrderBy = NonNullable<UserAPIGetShowsParams['orderBy']>;
export type UserDateJoined = NonNullable<SearchAPIGetUsersParams['dateJoined']>;
export type UserType = NonNullable<SearchAPIGetUsersParams['userType']>;

export interface UserShowOptionValues {
  orderBy: UserOrderBy;
}

export interface UserSearchOptionValues {
  dateJoined: UserDateJoined;
  userType: UserType;
}

export interface UserModelGetUsersParams extends CommonModelPaginationParams {
  keywords: string;
  dateJoined?: UserDateJoined;
  userType?: UserType;
}

export type GetUsersFetchResult = Awaited<ReturnType<SearchAPI['getUsers']>>;

export interface GetUsersLoopFetchResult extends LoopFetchResult<UserEntity> {
  params: GetUsersFetchResult['params'];
}

export default class UserModel extends BaseModel {

  getUsers(params: UserModelGetUsersParams) {
    return this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getUsersFetchPromise.bind(this),
      getItemsFromFetchResult: this.#getUsersFromFetchResult.bind(this),
      getNextPageTokenFromFetchResult: this.#getNextPageTokenFromUsersFetchResult.bind(this),
      convertToEntity: this.#convertFetchedUserToEntity.bind(this),
      onEnd: this.#onGetUsersLoopFetchEnd.bind(this),
      pageOffset: params.pageOffset,
      pageToken: params.pageToken,
      limit: params.limit
    });
  }

  #getUsersFetchPromise(params: UserModelGetUsersParams) {
    const cacheParams: Record<string, any> = {
      keywords: params.keywords,
      dateJoined: params.dateJoined,
      userType: params.userType,
      limit: params.limit,
      pageToken: params.pageToken
    };
    return mixcloud.getCache().getOrSet<GetUsersFetchResult>(
      this.getCacheKeyForFetch('users', cacheParams),
      () => mcfetch.search(params.keywords).getUsers({
        dateJoined: params.dateJoined,
        userType: params.userType,
        limit: params.limit,
        pageToken: params.pageToken
      }));
  }

  #getUsersFromFetchResult(result: GetUsersFetchResult) {
    return result.items.slice(0);
  }

  #getNextPageTokenFromUsersFetchResult(result: GetUsersFetchResult) {
    return result.nextPageToken && result.items.length > 0 ? result.nextPageToken : null;
  }

  #convertFetchedUserToEntity(item: User) {
    return EntityConverter.convertUser(item);
  }

  #onGetUsersLoopFetchEnd(result: LoopFetchResult<UserEntity>, lastFetchResult: GetUsersFetchResult): GetUsersLoopFetchResult {
    return {
      ...result,
      params: lastFetchResult.params
    };
  }

  getUser(username: string) {
    return mixcloud.getCache().getOrSet(
      this.getCacheKeyForFetch('user', { username }),
      async () => {
        const data = await mcfetch.user(username).getInfo();
        return data ? this.#convertFetchedUserToEntity(data) : null;
      });
  }

  getShowsOptions(): OptionBundle<UserShowOptionValues> {
    return {
      orderBy: {
        name: mixcloud.getI18n('MIXCLOUD_SELECT_ORDER_BY'),
        icon: 'fa fa-sort',
        values: [
          { name: mixcloud.getI18n('MIXCLOUD_ORDER_BY_TRENDING'), value: 'trending' },
          { name: mixcloud.getI18n('MIXCLOUD_ORDER_BY_POPULAR'), value: 'popular' },
          { name: mixcloud.getI18n('MIXCLOUD_ORDER_BY_LATEST'), value: 'latest' },
          { name: mixcloud.getI18n('MIXCLOUD_ORDER_BY_OLDEST'), value: 'oldest' }
        ]
      }
    };
  }

  getSearchOptions(): OptionBundle<UserSearchOptionValues> {
    return {
      dateJoined: {
        name: mixcloud.getI18n('MIXCLOUD_SELECT_DATE_JOINED'),
        icon: 'fa fa-sign-in',
        values: [
          { name: mixcloud.getI18n('MIXCLOUD_PAST_WEEK'), value: 'pastWeek' },
          { name: mixcloud.getI18n('MIXCLOUD_PAST_MONTH'), value: 'pastMonth' },
          { name: mixcloud.getI18n('MIXCLOUD_PAST_YEAR'), value: 'pastYear' },
          { name: mixcloud.getI18n('MIXCLOUD_ANY_TIME'), value: 'anyTime' }
        ]
      },
      userType: {
        name: mixcloud.getI18n('MIXCLOUD_SELECT_USER_TYPE'),
        icon: 'fa fa-user',
        values: [
          { name: mixcloud.getI18n('MIXCLOUD_UPLOADER'), value: 'uploader' },
          { name: mixcloud.getI18n('MIXCLOUD_LISTENER'), value: 'listener' },
          { name: mixcloud.getI18n('MIXCLOUD_ANY'), value: 'any' }
        ]
      }
    };
  }
}
