import sc from '../SoundCloudContext';
import BaseModel, { LoopFetchCallbackParams } from './BaseModel';
import { Album, Constants } from 'soundcloud-fetch';
import Mapper from './Mapper';
import TrackHelper from '../util/TrackHelper';
import AlbumEntity from '../entities/AlbumEntity';

export interface AlbumModelGetAlbumsParams {
  search?: string;
  userId?: number;
  pageToken?: string;
  pageOffset?: number;
  limit?: number;
}

export interface AlbumModelGetAlbumParams {
  tracksOffset?: number;
  tracksLimit?: number;
  loadTracks?: boolean;
}

interface GetAlbumsLoopFetchCallbackParams extends LoopFetchCallbackParams {
  search?: string;
  userId?: number;
}

export default class AlbumModel extends BaseModel {

  getAlbums(params: AlbumModelGetAlbumsParams) {
    const getItems = this.commonGetCollectionItemsFromLoopFetchResult<Album>;
    const getNextPageToken = this.commonGetNextPageTokenFromLoopFetchResult<Album>;

    return this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getAlbumsFetchPromise.bind(this),
      getItemsFromFetchResult: getItems.bind(this),
      getNextPageTokenFromFetchResult: getNextPageToken.bind(this),
      convertToEntity: this.#convertFetchedAlbumToEntity.bind(this),
      pageToken: params.pageToken,
      pageOffset: params.pageOffset,
      limit: params.limit
    });
  }

  async #getAlbumsFetchPromise(params: GetAlbumsLoopFetchCallbackParams) {
    const api = this.getSoundCloudAPI();

    const continuationContents = await this.commonGetLoopFetchResultByPageToken<Album>(params);
    if (continuationContents) {
      return continuationContents;
    }

    const queryParams: Record<string, any> = {
      limit: Constants.QUERY_MAX_LIMIT
    };
    if (params.search) {
      const q = params.search;
      queryParams.type = 'album';
      const cacheKeyParams = {
        search: q,
        ...queryParams
      };
      return sc.getCache().getOrSet(
        this.getCacheKeyForFetch('albums', cacheKeyParams),
        () => api.search(q, {...queryParams, type: 'album'})
      );
    }
    else if (params.userId !== undefined) {
      const userId = params.userId;
      const cacheKeyParams = {
        userId,
        ...queryParams
      };
      return sc.getCache().getOrSet(
        this.getCacheKeyForFetch('albums', cacheKeyParams),
        () => api.getAlbumsByUser(userId, queryParams)
      );
    }
    throw Error('Missing or invalid criteria for albums');
  }

  #convertFetchedAlbumToEntity(item: Album): Promise<AlbumEntity> {
    return Mapper.mapAlbum(item);
  }

  async getAlbum(albumId: number, options: AlbumModelGetAlbumParams = {}) {
    const cacheKeyParams = {
      albumId,
      ...options
    };
    const info = await sc.getCache().getOrSet(
      this.getCacheKeyForFetch('album', cacheKeyParams),
      () => this.getSoundCloudAPI().getPlaylistOrAlbum(albumId)
    );
    const album = info && info instanceof Album ? await Mapper.mapAlbum(info) : null;
    if (options.loadTracks && album && info) {
      const offset = options.tracksOffset || 0;
      const limit = options.tracksLimit || undefined;
      const tracks = await info.getTracks({ offset, limit });
      album.tracks = await Promise.all(tracks.map((track) => Mapper.mapTrack(track)));

      TrackHelper.cacheTracks(album.tracks, this.getCacheKeyForFetch.bind(this, 'track'));
    }
    return album;
  }
}
