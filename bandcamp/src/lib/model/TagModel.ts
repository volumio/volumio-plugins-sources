import bcfetch, { Album, ReleasesByTag, TagAPIGetReleasesParams, Track } from 'bandcamp-fetch';
import bandcamp from '../BandcampContext';
import BaseModel, { LoopFetchCallbackParams, LoopFetchResult } from './BaseModel';
import EntityConverter from '../util/EntityConverter';
import AlbumEntity from '../entities/AlbumEntity';
import TrackEntity from '../entities/TrackEntity';

export interface TagModelGetReleasesParams {
  tagUrl: string;
  filters: TagAPIGetReleasesParams['filters'];
  pageToken?: string;
  pageOffset?: number;
  limit: number;
}

interface GetReleasesLoopFetchCallbackParams extends LoopFetchCallbackParams {
  tagUrl: string;
  filters: TagAPIGetReleasesParams['filters'];
}

export interface ReleasesLoopFetchResult extends LoopFetchResult<AlbumEntity | TrackEntity> {
  filters: ReleasesByTag['filters'];
}

export default class TagModel extends BaseModel {

  getReleases(params: TagModelGetReleasesParams) {
    return this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getReleasesFetchPromise.bind(this),
      getItemsFromFetchResult: this.#getReleasesFromFetchResult.bind(this),
      getNextPageTokenFromFetchResult: this.#getNextPageTokenFromReleasesFetchResult.bind(this),
      convertToEntity: this.#convertFetchedReleaseToEntity.bind(this),
      onEnd: this.#onGetReleasesLoopFetchEnd.bind(this),
      pageOffset: params.pageOffset,
      pageToken: params.pageToken,
      limit: params.limit
    });
  }

  #getReleasesFetchPromise(params: GetReleasesLoopFetchCallbackParams) {
    const page = params.pageToken ? parseInt(params.pageToken, 10) : 1;
    const queryParams = {
      tagUrl: params.tagUrl,
      page,
      filters: params.filters,
      imageFormat: this.getAlbumImageFormat()
    };
    return bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('releasesByTag', queryParams),
      () => bcfetch.limiter.tag.getReleases(queryParams));
  }

  #getReleasesFromFetchResult(result: ReleasesByTag) {
    return result.items.slice(0);
  }

  #getNextPageTokenFromReleasesFetchResult(result: ReleasesByTag, params: GetReleasesLoopFetchCallbackParams) {
    const page = params.pageToken ? parseInt(params.pageToken) : 1;
    if (result.items.length > 0 && result.hasMore) {
      return (page + 1).toString();
    }

    return null;

  }

  #convertFetchedReleaseToEntity(item: Album | Track): AlbumEntity | TrackEntity {
    if (item.type === 'album') {
      return EntityConverter.convertAlbum(item);
    }

    return EntityConverter.convertTrack(item);
  }

  #onGetReleasesLoopFetchEnd(result: LoopFetchResult<AlbumEntity| TrackEntity>, lastFetchResult: ReleasesByTag) {
    const r: ReleasesLoopFetchResult = {
      ...result,
      filters: lastFetchResult.filters
    };
    return r;
  }

  async getTag(tagUrl: string) {
    const tag = await bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('tag', { tagUrl }),
      () => bcfetch.limiter.tag.getInfo(tagUrl));

    return EntityConverter.convertTag(tag);
  }

  async getTags() {
    const tags = await bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('tags'),
      () => bcfetch.limiter.tag.list());

    return {
      tags: tags.tags.map((tag) => EntityConverter.convertTag({ ...tag, type: 'tag' })),
      locations: tags.locations.map((tag) => EntityConverter.convertTag({ ...tag, type: 'tag' }))
    };
  }

  getReleasesAvailableFilters(tagUrl: string) {
    return bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('releasesByTagFilterOptions', { tagUrl }),
      () => bcfetch.limiter.tag.getReleasesAvailableFilters(tagUrl));
  }
}
