import bcfetch, { SearchAPISearchParams, SearchResultAny, SearchResults } from 'bandcamp-fetch';
import bandcamp from '../BandcampContext';
import BaseModel, { LoopFetchCallbackParams, LoopFetchResult } from './BaseModel';
import EntityConverter from '../util/EntityConverter';
import ArtistEntity from '../entities/ArtistEntity';
import LabelEntity from '../entities/LabelEntity';
import AlbumEntity from '../entities/AlbumEntity';
import TrackEntity from '../entities/TrackEntity';

export enum SearchItemType {
  All = 'All',
  ArtistsAndLabels = 'ArtistsAndLabels',
  Albums = 'Albums',
  Tracks = 'Tracks'
}

export interface SearchModelGetSearchResultsParams {
  query: string;
  itemType: SearchItemType;
  pageToken?: string;
  pageOffset?: number;
  limit: number;
}

interface GetSearchResultsLoopFetchCallbackParams extends LoopFetchCallbackParams {
  query: string;
  itemType: SearchItemType;
}

export default class SearchModel extends BaseModel {

  getSearchResults(params: SearchModelGetSearchResultsParams & { itemType: SearchItemType.All }): Promise<LoopFetchResult<ArtistEntity | LabelEntity | AlbumEntity | TrackEntity>>;
  getSearchResults(params: SearchModelGetSearchResultsParams & { itemType: SearchItemType.ArtistsAndLabels }): Promise<LoopFetchResult<ArtistEntity | LabelEntity>>;
  getSearchResults(params: SearchModelGetSearchResultsParams & { itemType: SearchItemType.Albums }): Promise<LoopFetchResult<AlbumEntity>>;
  getSearchResults(params: SearchModelGetSearchResultsParams & { itemType: SearchItemType.Tracks }): Promise<LoopFetchResult<TrackEntity>>;
  getSearchResults(params: SearchModelGetSearchResultsParams & { itemType: SearchItemType }): Promise<LoopFetchResult<ArtistEntity | LabelEntity | AlbumEntity | TrackEntity>>;
  getSearchResults(params: SearchModelGetSearchResultsParams): Promise<LoopFetchResult<ArtistEntity | LabelEntity | AlbumEntity | TrackEntity>> {
    return this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getSearchResultsFetchPromise.bind(this),
      getItemsFromFetchResult: this.#getSearchResultItemsFromFetchResult.bind(this),
      getNextPageTokenFromFetchResult: this.#getNextPageTokenFromSearchFetchResult.bind(this),
      filterFetchedItem: this.#filterSearchResultItem.bind(this),
      convertToEntity: this.#convertFetchedSearchResultItemToEntity.bind(this),
      pageOffset: params.pageOffset,
      pageToken: params.pageToken,
      limit: params.limit
    });
  }

  #getSearchResultsFetchPromise(params: GetSearchResultsLoopFetchCallbackParams) {
    const page = params.pageToken ? parseInt(params.pageToken, 10) : 1;
    const queryParams: SearchAPISearchParams = {
      page,
      query: params.query,
      albumImageFormat: this.getAlbumImageFormat(),
      artistImageFormat: this.getArtistImageFormat()
    };
    switch (params.itemType) {
      case SearchItemType.ArtistsAndLabels:
        return bandcamp.getCache().getOrSet(
          this.getCacheKeyForFetch('searchArtistsAndLabels', queryParams),
          () => bcfetch.limiter.search.artistsAndLabels(queryParams));

      case SearchItemType.Albums:
        return bandcamp.getCache().getOrSet(
          this.getCacheKeyForFetch('searchAlbums', queryParams),
          () => bcfetch.limiter.search.albums(queryParams));

      case SearchItemType.Tracks:
        return bandcamp.getCache().getOrSet(
          this.getCacheKeyForFetch('searchTracks', queryParams),
          () => bcfetch.limiter.search.tracks(queryParams));

      default:
      case SearchItemType.All:
        return bandcamp.getCache().getOrSet(
          this.getCacheKeyForFetch('searchAll', queryParams),
          () => bcfetch.limiter.search.all(queryParams));
    }
  }

  #getSearchResultItemsFromFetchResult(result: SearchResults<SearchResultAny>) {
    return result.items.slice(0);
  }

  #getNextPageTokenFromSearchFetchResult(result: SearchResults<SearchResultAny>, params: GetSearchResultsLoopFetchCallbackParams) {
    const page = params.pageToken ? parseInt(params.pageToken, 10) : 1;
    if (page < result.totalPages) {
      return (page + 1).toString();
    }

    return null;
  }

  #filterSearchResultItem(item: SearchResultAny, params: GetSearchResultsLoopFetchCallbackParams) {
    switch (params.itemType) {
      case SearchItemType.ArtistsAndLabels:
        return item.type === 'artist' || item.type === 'label';
      case SearchItemType.Albums:
        return item.type === 'album';
      case SearchItemType.Tracks:
        return item.type === 'track';
      case SearchItemType.All:
        return item.type === 'album' || item.type === 'artist' || item.type === 'label' || item.type === 'track';
      default:
        return false;
    }
  }

  #convertFetchedSearchResultItemToEntity(item: SearchResultAny) {
    if (item.type === 'album' || item.type === 'artist' || item.type === 'label' || item.type === 'track') {
      return EntityConverter.convertSearchResultItem(item);
    }

    return null;
  }
}
