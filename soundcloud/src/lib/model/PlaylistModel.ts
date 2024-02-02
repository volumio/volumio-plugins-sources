import sc from '../SoundCloudContext';
import BaseModel, { LoopFetchCallbackParams } from './BaseModel';
import { Playlist, Constants, SystemPlaylist } from 'soundcloud-fetch';
import Mapper from './Mapper';
import TrackHelper from '../util/TrackHelper';
import PlaylistEntity from '../entities/PlaylistEntity';

export interface PlaylistModelGetPlaylistsParams {
  search?: string;
  userId?: number;
  pageToken?: string;
  pageOffset?: number;
  limit?: number;
}

export interface PlaylistModelGetPlaylistParams {
  tracksOffset?: number;
  tracksLimit?: number;
  loadTracks?: boolean;
  type?: 'system';
}

interface GetPlaylistsLoopFetchCallbackParams extends LoopFetchCallbackParams {
  search?: string;
  userId?: number;
}

export default class PlaylistModel extends BaseModel {

  getPlaylists(params: PlaylistModelGetPlaylistsParams) {
    const getItems = this.commonGetCollectionItemsFromLoopFetchResult<Playlist>;
    const getNextPageToken = this.commonGetNextPageTokenFromLoopFetchResult<Playlist>;

    return this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getPlaylistsFetchPromise.bind(this),
      getItemsFromFetchResult: getItems.bind(this),
      getNextPageTokenFromFetchResult: getNextPageToken.bind(this),
      convertToEntity: this.#convertFetchedPlaylistToEntity.bind(this),
      pageToken: params.pageToken,
      pageOffset: params.pageOffset,
      limit: params.limit
    });
  }

  async #getPlaylistsFetchPromise(params: GetPlaylistsLoopFetchCallbackParams) {
    const api = this.getSoundCloudAPI();

    const continuationContents = await this.commonGetLoopFetchResultByPageToken<Playlist>(params);
    if (continuationContents) {
      return continuationContents;
    }

    const queryParams: Record<string, any> = {
      limit: Constants.QUERY_MAX_LIMIT
    };
    if (params.search) {
      const q = params.search;
      queryParams.type = 'playlist';
      const cacheKeyParams = {
        search: q,
        ...queryParams
      };
      return sc.getCache().getOrSet(
        this.getCacheKeyForFetch('playlists', cacheKeyParams),
        () => api.search(q, {...queryParams, type: 'playlist'})
      );
    }
    else if (params.userId !== undefined) {
      const userId = params.userId;
      const cacheKeyParams = {
        userId,
        ...queryParams
      };
      return sc.getCache().getOrSet(
        this.getCacheKeyForFetch('playlists', cacheKeyParams),
        () => api.getPlaylistsByUser(userId, queryParams)
      );
    }
    throw Error('Missing or invalid criteria for playlists');
  }

  async #convertFetchedPlaylistToEntity(item: Playlist): Promise<PlaylistEntity> {
    return Mapper.mapPlaylist(item);
  }

  async getPlaylist(playlistId: string | number, options: PlaylistModelGetPlaylistParams = {}) {
    const cacheKeyParams = {
      playlistId,
      ...options
    };
    const info = await sc.getCache().getOrSet<SystemPlaylist | Playlist | null>(
      this.getCacheKeyForFetch('playlist', cacheKeyParams),
      () => {
        if (options.type === 'system' && typeof playlistId === 'string') {
          return this.getSoundCloudAPI().getSystemPlaylist(playlistId);
        }
        else if (options.type !== 'system' && typeof playlistId === 'number') {
          return this.getSoundCloudAPI().getPlaylistOrAlbum(playlistId);
        }
        throw Error('Playlist ID has wrong type');
      }
    );
    const playlist = info ? await Mapper.mapPlaylist(info) : null;
    if (options.loadTracks && playlist && info) {
      const offset = options.tracksOffset || 0;
      const limit = options.tracksLimit || undefined;
      const tracks = await info.getTracks({ offset, limit });
      playlist.tracks = await Promise.all(tracks.map((track) => Mapper.mapTrack(track)));

      TrackHelper.cacheTracks(playlist.tracks, this.getCacheKeyForFetch.bind(this, 'track'));
    }
    return playlist;
  }
}
