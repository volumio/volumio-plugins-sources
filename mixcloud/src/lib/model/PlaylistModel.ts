import mcfetch, { ItemList, Playlist } from 'mixcloud-fetch';
import mixcloud from '../MixcloudContext';
import BaseModel, { LoopFetchCallbackParams } from './BaseModel';
import EntityConverter from '../util/EntityConverter';

export interface PlaylistModelGetPlaylistsParams extends LoopFetchCallbackParams {
  username: string;
}

export default class PlaylistModel extends BaseModel {

  getPlaylists(params: PlaylistModelGetPlaylistsParams) {
    return this.loopFetch({
      callbackParams: { ...params },
      getFetchPromise: this.#getPlaylistsFetchPromise.bind(this),
      getItemsFromFetchResult: this.#getPlaylistsFromFetchResult.bind(this),
      convertToEntity: this.#convertFetchedPlaylistToEntity.bind(this)
    });
  }

  #getPlaylistsFetchPromise(params: PlaylistModelGetPlaylistsParams) {
    return mixcloud.getCache().getOrSet(
      this.getCacheKeyForFetch('playlists', { username: params.username }),
      () => mcfetch.user(params.username).getPlaylists());
  }

  #getPlaylistsFromFetchResult(result: ItemList<Playlist> | null) {
    return result ? result.items.slice(0) : [];
  }

  #convertFetchedPlaylistToEntity(item: Playlist) {
    return EntityConverter.convertPlaylist(item);
  }

  getPlaylist(playlistId: string) {
    return mixcloud.getCache().getOrSet(
      this.getCacheKeyForFetch('playlist', { playlistId }),
      async () => {
        const data = await mcfetch.playlist(playlistId).getInfo();
        return data ? this.#convertFetchedPlaylistToEntity(data) : null;
      });
  }
}
