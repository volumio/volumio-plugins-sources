import bcfetch, { Show } from 'bandcamp-fetch';
import bandcamp from '../BandcampContext';
import BaseModel from './BaseModel';
import EntityConverter from '../util/EntityConverter';

export interface ShowModelGetShowsParams {
  pageToken?: string;
  pageOffset?: number;
  limit: number;
}

export default class ShowModel extends BaseModel {

  getShows(params: ShowModelGetShowsParams) {
    return this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getShowsFetchPromise.bind(this),
      getItemsFromFetchResult: this.#getShowsFromFetchResult.bind(this),
      convertToEntity: this.#convertFetchedShowToEntity.bind(this),
      pageOffset: params.pageOffset,
      pageToken: params.pageToken,
      limit: params.limit
    });
  }

  #getShowsFetchPromise() {
    const queryParams = {
      imageFormat: this.getAlbumImageFormat()
    };
    return bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('shows', queryParams),
      () => bcfetch.limiter.show.list(queryParams));
  }

  #getShowsFromFetchResult(result: Show[]) {
    return result.slice(0);
  }

  async getShow(showUrl: string) {
    const queryParams = {
      showUrl,
      imageFormat: this.getAlbumImageFormat()
    };

    const show = await bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('show', queryParams),
      () => bcfetch.limiter.show.getShow(queryParams));

    return this.#convertFetchedShowToEntity(show);
  }

  #convertFetchedShowToEntity(item: Show) {
    return EntityConverter.convertShow(item);
  }
}
