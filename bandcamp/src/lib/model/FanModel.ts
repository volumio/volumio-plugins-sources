import bcfetch, { Album, FanAPIGetInfoParams, FanContinuationItemsResult, FanPageItemsResult, Tag, Track, UserKind } from 'bandcamp-fetch';
import bandcamp from '../BandcampContext';
import BaseModel, { LoopFetchCallbackParams, LoopFetchResult } from './BaseModel';
import BandEntity from '../entities/BandEntity';
import AlbumEntity from '../entities/AlbumEntity';
import TrackEntity from '../entities/TrackEntity';
import TagEntity from '../entities/TagEntity';
import EntityConverter from '../util/EntityConverter';
import Model from '.';

enum FanItemType {
  Collection = 'Collection',
  Wishlist = 'Wishlist',
  FollowingArtistsAndLabels = 'FollowingArtistsAndLabels',
  FollowingGenres = 'FollowingGenres'
}

export interface FanModelGetFanItemsParams {
  username: string;
  pageToken?: string;
  pageOffset?: number;
  limit: number;
}

interface GetFanItemsLoopFetchCallbackParams extends LoopFetchCallbackParams {
  username: string;
  itemType: FanItemType;
}

type FanItem = Album | Track | UserKind | Tag;

export default class FanModel extends BaseModel {

  getInfo(username?: string) {
    const queryParams: FanAPIGetInfoParams = {
      imageFormat: this.getArtistImageFormat()
    };
    if (username) {
      queryParams.username = username;
    }
    else if (!Model.cookie) {
      throw Error('No cookie set');
    }
    return bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('fanInfo', queryParams),
      () => bcfetch.limiter.fan.getInfo(queryParams));
  }

  getCollection(params: FanModelGetFanItemsParams) {
    return this.#getFanItems(params, FanItemType.Collection);
  }

  getWishlist(params: FanModelGetFanItemsParams) {
    return this.#getFanItems(params, FanItemType.Wishlist);
  }

  getFollowingArtistsAndLabels(params: FanModelGetFanItemsParams) {
    return this.#getFanItems(params, FanItemType.FollowingArtistsAndLabels);
  }

  getFollowingGenres(params: FanModelGetFanItemsParams) {
    return this.#getFanItems(params, FanItemType.FollowingGenres);
  }

  #getFanItems(params: FanModelGetFanItemsParams, itemType: FanItemType.Collection): Promise<LoopFetchResult<AlbumEntity | TrackEntity>>;
  #getFanItems(params: FanModelGetFanItemsParams, itemType: FanItemType.Wishlist): Promise<LoopFetchResult<AlbumEntity | TrackEntity>>;
  #getFanItems(params: FanModelGetFanItemsParams, itemType: FanItemType.FollowingArtistsAndLabels): Promise<LoopFetchResult<BandEntity>>;
  #getFanItems(params: FanModelGetFanItemsParams, itemType: FanItemType.FollowingGenres): Promise<LoopFetchResult<TagEntity>>;
  #getFanItems(params: FanModelGetFanItemsParams, itemType: FanItemType): Promise<LoopFetchResult<any>> {
    return this.loopFetch({
      callbackParams: { ...params, itemType },
      getFetchPromise: this.#getFanItemsFetchPromise.bind(this),
      getItemsFromFetchResult: this.#getFanItemsFromFetchResult.bind(this),
      getNextPageTokenFromFetchResult: this.#getNextPageTokenFromFanItemsFetchResult.bind(this),
      convertToEntity: this.#convertFetchedFanItemToEntity.bind(this),
      pageOffset: params.pageOffset,
      pageToken: params.pageToken,
      limit: params.limit
    });
  }

  #getFanItemsFetchPromise(params: GetFanItemsLoopFetchCallbackParams): Promise<FanPageItemsResult<FanItem> | FanContinuationItemsResult<FanItem>> {
    const continuationToken = params.pageToken ? JSON.parse(params.pageToken) : null;
    const cacheKeyParams: Record<string, string> = {
      username: params.username
    };
    if (continuationToken) {
      cacheKeyParams.continuationToken = JSON.stringify(continuationToken);
    }
    const target = continuationToken || params.username;
    switch (params.itemType) {
      case FanItemType.Collection:
        return bandcamp.getCache().getOrSet(
          this.getCacheKeyForFetch('fanCollection', cacheKeyParams),
          () => bcfetch.limiter.fan.getCollection({
            target,
            imageFormat: this.getAlbumImageFormat()
          }));

      case FanItemType.Wishlist:
        return bandcamp.getCache().getOrSet(
          this.getCacheKeyForFetch('fanWishlist', cacheKeyParams),
          () => bcfetch.limiter.fan.getWishlist({
            target,
            imageFormat: this.getAlbumImageFormat()
          }));

      case FanItemType.FollowingArtistsAndLabels:
        return bandcamp.getCache().getOrSet(
          this.getCacheKeyForFetch('fanFollowingArtistsAndLabels', cacheKeyParams),
          () => bcfetch.limiter.fan.getFollowingArtistsAndLabels({
            target,
            imageFormat: this.getArtistImageFormat()
          }));

      default:
      case FanItemType.FollowingGenres:
        return bandcamp.getCache().getOrSet(
          this.getCacheKeyForFetch('fanFollowingGenres', cacheKeyParams),
          () => bcfetch.limiter.fan.getFollowingGenres({
            target,
            imageFormat: this.getAlbumImageFormat()
          }));
    }
  }

  #getFanItemsFromFetchResult(result: FanPageItemsResult<FanItem> | FanContinuationItemsResult<FanItem>) {
    return result.items.slice(0);
  }

  #getNextPageTokenFromFanItemsFetchResult(result: FanPageItemsResult<FanItem> | FanContinuationItemsResult<FanItem>) {
    return result.continuation ? JSON.stringify(result.continuation) : null;
  }

  #convertFetchedFanItemToEntity(item: FanItem): BandEntity | AlbumEntity | TrackEntity | TagEntity {
    switch ((item as any).type) {
      case 'album':
        return EntityConverter.convertAlbum(item as Album);
      case 'track':
        return EntityConverter.convertTrack(item as Track);
      case 'tag': // Following genres are tags
        return EntityConverter.convertTag(item as Tag);
      default: // UserKind (following artists / labels) does not have 'tag'
        return EntityConverter.convertBand(item as UserKind);
    }
  }
}
