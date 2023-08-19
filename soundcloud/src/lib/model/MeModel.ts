import sc from '../SoundCloudContext';
import BaseModel, { LoopFetchCallbackParams, LoopFetchResult } from './BaseModel';
import { Playlist, Constants, SystemPlaylist, Album, LibraryItem, Like, Track } from 'soundcloud-fetch';
import Mapper from './Mapper';
import PlaylistEntity from '../entities/PlaylistEntity';
import AlbumEntity from '../entities/AlbumEntity';
import TrackEntity from '../entities/TrackEntity';
import { TrackOrigin } from '../controller/browse/view-handlers/TrackViewHandler';

export interface MeModelGetLikesParams {
  pageToken?: string;
  pageOffset?: number;
  limit?: number;
  type: 'track' | 'playlistAndAlbum';
}

interface GetLikesLoopFetchCallbackParams extends LoopFetchCallbackParams {
  type: 'track' | 'playlistAndAlbum';
}

export interface MeModelGetLibraryItemsParams {
  pageToken?: string;
  pageOffset?: number;
  limit?: number;
  type: 'album' | 'playlist' | 'station';
  filter: 'liked' | 'created' | 'all'; // Only for 'album' and 'playlist' types
}

interface GetLibraryItemsLoopFetchCallbackParams extends LoopFetchCallbackParams {
  type: 'album' | 'playlist' | 'station';
  filter: 'liked' | 'created' | 'all'; // Only for 'album' and 'playlist' types
}

export default class MeModel extends BaseModel {

  getLikes(params: MeModelGetLikesParams & {type: 'playlistAndAlbum'}): Promise<LoopFetchResult<AlbumEntity | PlaylistEntity>>;
  getLikes(params: MeModelGetLikesParams & {type: 'track'}): Promise<LoopFetchResult<TrackEntity>>;
  getLikes(params: MeModelGetLikesParams) {
    const getItems = this.commonGetCollectionItemsFromLoopFetchResult<Like>;
    const getNextPageToken = this.commonGetNextPageTokenFromLoopFetchResult<Like>;

    return this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getLikesFetchPromise.bind(this),
      getItemsFromFetchResult: getItems.bind(this),
      getNextPageTokenFromFetchResult: getNextPageToken.bind(this),
      convertToEntity: this.#convertFetchedLikeToEntity.bind(this),
      pageToken: params.pageToken,
      pageOffset: params.pageOffset,
      limit: params.limit
    });
  }

  async #getLikesFetchPromise(params: GetLikesLoopFetchCallbackParams) {
    const api = this.getSoundCloudAPI();

    const continuationContents = await this.commonGetLoopFetchResultByPageToken<Like>(params);
    if (continuationContents) {
      return continuationContents;
    }

    const queryParams = {
      limit: Constants.QUERY_MAX_LIMIT,
      type: params.type
    };
    return sc.getCache().getOrSet(
      this.getCacheKeyForFetch('likes', queryParams),
      () => api.me.getLikes(queryParams)
    );
  }

  async #convertFetchedLikeToEntity(item: Like): Promise<AlbumEntity | PlaylistEntity | TrackEntity | null> {
    const wrappedItem = item.item;
    if (wrappedItem instanceof Album) {
      return Mapper.mapAlbum(wrappedItem);
    }
    else if (wrappedItem instanceof Playlist) {
      return Mapper.mapPlaylist(wrappedItem);
    }
    else if (wrappedItem instanceof Track) {
      return Mapper.mapTrack(wrappedItem);
    }
    return null;
  }

  getLibraryItems(params: MeModelGetLibraryItemsParams) {
    const getItems = this.commonGetCollectionItemsFromLoopFetchResult<LibraryItem>;
    const getNextPageToken = this.commonGetNextPageTokenFromLoopFetchResult<LibraryItem>;

    return this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getLibraryItemsFetchPromise.bind(this),
      getItemsFromFetchResult: getItems.bind(this),
      filterFetchedItem: this.#filterFetchedLibraryItem.bind(this),
      getNextPageTokenFromFetchResult: getNextPageToken.bind(this),
      convertToEntity: this.#convertFetchedLibraryItemToEntity.bind(this),
      pageToken: params.pageToken,
      pageOffset: params.pageOffset,
      limit: params.limit
    });
  }

  async #getLibraryItemsFetchPromise(params: GetLibraryItemsLoopFetchCallbackParams) {
    const api = this.getSoundCloudAPI();

    const continuationContents = await this.commonGetLoopFetchResultByPageToken<LibraryItem>(params);
    if (continuationContents) {
      return continuationContents;
    }

    const queryParams = {
      limit: Constants.QUERY_MAX_LIMIT
    };
    return sc.getCache().getOrSet(
      this.getCacheKeyForFetch('libraryItems', queryParams),
      () => api.me.getLibraryItems(queryParams)
    );
  }

  #filterFetchedLibraryItem(item: LibraryItem, params: GetLibraryItemsLoopFetchCallbackParams) {
    switch (params.type) {
      case 'album':
        const isCreatedAlbum = item.itemType === 'Album';
        const isLikedAlbum = item.itemType === 'AlbumLike';
        if (params.filter === 'created') {
          return isCreatedAlbum;
        }
        else if (params.filter === 'liked') {
          return isLikedAlbum;
        }
        return isCreatedAlbum || isLikedAlbum;

      case 'playlist':
        const isCreatedPlaylist = item.itemType === 'Playlist';
        const isLikedPlaylist = item.itemType === 'PlaylistLike' ||
          (item.itemType === 'SystemPlaylistLike' && !this.#isArtistStation(item));
        if (params.filter === 'created') {
          return isCreatedPlaylist;
        }
        else if (params.filter === 'liked') {
          return isLikedPlaylist;
        }
        return isCreatedPlaylist || isLikedPlaylist;

      case 'station':
        return this.#isArtistStation(item);
    }
  }

  #isArtistStation(item: LibraryItem) {
    return item.item instanceof SystemPlaylist && item.item.playlistType === 'artistStation';
  }

  async #convertFetchedLibraryItemToEntity(item: LibraryItem): Promise<AlbumEntity | PlaylistEntity | null> {
    return Mapper.mapLibraryItem(item);
  }

  async getMyProfile() {
    if (!this.hasAccessToken()) {
      return null;
    }
    const info = await sc.getCache().getOrSet(
      this.getCacheKeyForFetch('myProfile', {}),
      () => this.getSoundCloudAPI().me.getProfile()
    );

    if (info) {
      return Mapper.mapUser(info);
    }

    return null;
  }

  async addToPlayHistory(track: TrackEntity, origin?: TrackOrigin) {
    if (!this.hasAccessToken() || !track.urn) {
      return;
    }
    const api = this.getSoundCloudAPI();
    try {
      let setOrUrn: Album | Playlist | string | null = null;
      if (origin?.type === 'album') {
        setOrUrn = new Album({ id: origin.albumId }, api);
      }
      else if (origin?.type === 'playlist') {
        setOrUrn = new Playlist({ id: origin.playlistId }, api);
      }
      else if (origin?.type === 'system-playlist') {
        setOrUrn = origin.urn;
      }
      if (setOrUrn) {
        try {
          await api.me.addToPlayHistory(track.urn, setOrUrn);
        }
        catch (error) {
          sc.getLogger().error(
            sc.getErrorMessage(
              'Failed to add to play history - will retry without track origin:',
              error, true));

          await this.addToPlayHistory(track);
        }
      }
      else {
        await api.me.addToPlayHistory(track.urn);
      }
    }
    catch (error) {
      sc.getLogger().error(sc.getErrorMessage('Failed to add to play history:', error, true));
    }
  }
}
