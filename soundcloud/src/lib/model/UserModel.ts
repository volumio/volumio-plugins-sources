import { Constants, User } from 'soundcloud-fetch';
import sc from '../SoundCloudContext';
import BaseModel, { LoopFetchCallbackParams } from './BaseModel';
import UserEntity from '../entities/UserEntity';
import Mapper from './Mapper';

export interface UserModelGetUsersParams {
  search?: string;
  myFollowing?: boolean;
  pageToken?: string;
  pageOffset?: number;
  limit?: number;
}

interface GetUsersLoopFetchCallbackParams extends LoopFetchCallbackParams {
  search?: string;
  myFollowing?: boolean;
  topFeatured?: boolean;
}

export default class UserModel extends BaseModel {

  getUsers(params: UserModelGetUsersParams) {
    const getItems = this.commonGetCollectionItemsFromLoopFetchResult<User>;
    const getNextPageToken = this.commonGetNextPageTokenFromLoopFetchResult<User>;

    return this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getUsersFetchPromise.bind(this),
      getItemsFromFetchResult: getItems.bind(this),
      getNextPageTokenFromFetchResult: getNextPageToken.bind(this),
      convertToEntity: this.#convertFetchedUserToEntity.bind(this),
      pageToken: params.pageToken,
      pageOffset: params.pageOffset,
      limit: params.limit
    });
  }

  async #getUsersFetchPromise(params: GetUsersLoopFetchCallbackParams) {
    const api = this.getSoundCloudAPI();

    const continuationContents = await this.commonGetLoopFetchResultByPageToken<User>(params);
    if (continuationContents) {
      return continuationContents;
    }

    const queryParams: Record<string, any> = {
      limit: Constants.QUERY_MAX_LIMIT
    };
    if (params.search) {
      const q = params.search;
      queryParams.type = 'user';
      const cacheKeyParams = {
        search: q,
        ...queryParams
      };
      return sc.getCache().getOrSet(
        this.getCacheKeyForFetch('users', cacheKeyParams),
        () => api.search(q, {...queryParams, type: 'user'})
      );
    }
    else if (params.myFollowing) {
      const cacheKeyParams = {
        myFollowing: true,
        ...queryParams
      };
      return sc.getCache().getOrSet(
        this.getCacheKeyForFetch('users', cacheKeyParams),
        () => api.me.getFollowing(queryParams)
      );
    }
    throw Error('Missing or invalid criteria for users');
  }

  #convertFetchedUserToEntity(data: User): Promise<UserEntity> {
    return Mapper.mapUser(data);
  }

  async getUser(userId: number) {
    const info = await sc.getCache().getOrSet(
      this.getCacheKeyForFetch('user', { userId }),
      () => this.getSoundCloudAPI().getUser(userId)
    );

    if (info) {
      return Mapper.mapUser(info);
    }

    return null;
  }
}
