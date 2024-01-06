import bcfetch, { Album, LabelArtist, Track } from 'bandcamp-fetch';
import bandcamp from '../BandcampContext';
import BaseModel, { LoopFetchCallbackParams } from './BaseModel';
import ArtistEntity from '../entities/ArtistEntity';
import EntityConverter from '../util/EntityConverter';
import AlbumEntity from '../entities/AlbumEntity';
import TrackEntity from '../entities/TrackEntity';
import LabelEntity from '../entities/LabelEntity';

export interface BandModelGetLabelArtistsParams {
  labelUrl: string;
  pageToken?: string;
  pageOffset?: number;
  limit: number;
}

export interface BandModelGetDiscographyParams {
  bandUrl: string;
  pageToken?: string;
  pageOffset?: number;
  limit: number;
}

interface GetLabelArtistsLoopFetchCallbackParams extends LoopFetchCallbackParams {
  labelUrl: string;
}

interface GetDiscographyLoopFetchCallbackParams extends LoopFetchCallbackParams {
  bandUrl: string;
}

export default class BandModel extends BaseModel {

  getLabelArtists(params: BandModelGetLabelArtistsParams) {
    return this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getLabelArtistsFetchPromise.bind(this),
      getItemsFromFetchResult: this.#getLabelArtistsFromFetchResult.bind(this),
      convertToEntity: this.#convertFetchedLabelArtistToEntity.bind(this),
      pageOffset: params.pageOffset,
      pageToken: params.pageToken,
      limit: params.limit
    });
  }

  #getLabelArtistsFetchPromise(params: GetLabelArtistsLoopFetchCallbackParams) {
    const queryParams = {
      labelUrl: params.labelUrl,
      imageFormat: this.getArtistImageFormat()
    };
    return bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('artists', queryParams),
      () => bcfetch.limiter.band.getLabelArtists(queryParams));
  }

  #getLabelArtistsFromFetchResult(result: LabelArtist[]) {
    return result.slice(0);
  }

  #convertFetchedLabelArtistToEntity(item: LabelArtist): ArtistEntity {
    return EntityConverter.convertArtist(item);
  }

  getDiscography(params: BandModelGetDiscographyParams) {
    return this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getDiscographyFetchPromise.bind(this),
      getItemsFromFetchResult: this.#getDiscographyItemsFromFetchResult.bind(this),
      convertToEntity: this.#convertFetchedDiscographyItemToEntity.bind(this),
      pageOffset: params.pageOffset,
      pageToken: params.pageToken,
      limit: params.limit
    });
  }

  #getDiscographyFetchPromise(params: GetDiscographyLoopFetchCallbackParams) {
    const queryParams = {
      bandUrl: params.bandUrl,
      imageFormat: this.getAlbumImageFormat()
    };
    return bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('discography', queryParams),
      () => bcfetch.limiter.band.getDiscography(queryParams));
  }

  #getDiscographyItemsFromFetchResult(result: Array<Album | Track>) {
    return result.slice(0);
  }

  #convertFetchedDiscographyItemToEntity(item: Album | Track): AlbumEntity | TrackEntity {
    if (item.type === 'album') {
      return EntityConverter.convertAlbum(item);
    }

    return EntityConverter.convertTrack(item);
  }

  async getBand(bandUrl: string): Promise<ArtistEntity | LabelEntity> {
    const queryParams = {
      bandUrl,
      imageFormat: this.getArtistImageFormat()
    };

    const band = await bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('band', queryParams),
      () => bcfetch.limiter.band.getInfo(queryParams));

    if (band.type === 'artist') {
      return EntityConverter.convertArtist(band);
    }

    return EntityConverter.convertLabel(band);
  }
}
