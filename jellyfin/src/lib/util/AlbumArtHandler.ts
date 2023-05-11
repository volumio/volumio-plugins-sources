import { Album, Artist, EntityType, Song } from '../entities';
import BaseEntity from '../entities/BaseEntity';
import UserView, { UserViewType } from '../entities/UserView';
import jellyfin from '../JellyfinContext';

interface AlbumArtPluginParams {
  album?: string;
  artist?: string;
}

export default class AlbumArtHandler {

  #albumArtPlugin;

  constructor() {
    this.#albumArtPlugin = jellyfin.getAlbumArtPlugin();
  }

  getAlbumArtUri<T extends BaseEntity>(item: T): string {
    if (item.thumbnail) {
      return item.thumbnail;
    }
    else if (item.type === EntityType.Song) {
      const song = item as unknown as Song;
      if (song.album?.thumbnail) {
        return song.album.thumbnail;
      }
    }

    const baseImgPath = 'music_service/jellyfin/dist/assets/images/';
    let url;
    let defaultImg;

    // UserView - playlists
    if (item.type === EntityType.UserView && (item as UserView).userViewType === UserViewType.Playlists) {
      defaultImg = 'playlist.png';
    }
    // Library
    else if (item.type === EntityType.UserView && (item as UserView).userViewType === UserViewType.Library) {
      defaultImg = 'album.png';
    }
    // Folder
    else if ((item.type === EntityType.UserView && (item as UserView).userViewType === UserViewType.Folders) ||
      item.type === EntityType.Folder || item.type === EntityType.CollectionFolder) {
      defaultImg = 'folder.png';
    }
    // Album - fetch from web if possible (using AlbumArt plugin)
    else if (item.type === EntityType.Album) {
      const album = item as unknown as Album;
      if (album.albumArtist) {
        url = this.#getAlbumArtWithPlugin({
          album: album.name,
          artist: album.albumArtist
        });
      }
      defaultImg = 'album.png';
    }
    // Artist - fetch from web if possible (using AlbumArt plugin)
    else if (item.type === EntityType.Artist || item.type === EntityType.AlbumArtist) {
      url = this.#getAlbumArtWithPlugin({
        artist: (item as unknown as Artist).name
      });
      defaultImg = 'avatar.png';
    }
    // Playlist
    else if (item.type === EntityType.Playlist) {
      defaultImg = 'playlist.png';
    }
    // Genre
    else if (item.type === EntityType.Genre) {
      defaultImg = 'genre.png';
    }
    // Song - get art of album
    else if (item.type === EntityType.Song) {
      const song = item as unknown as Song;
      if (song.album?.name && song.artists?.[0]?.name) {
        url = this.#getAlbumArtWithPlugin({
          album: song.album.name,
          artist: song.artists[0].name
        });
      }
      defaultImg = 'song.png';
    }
    else {
      url = '/albumart';
    }

    if (defaultImg) {
      url = (url ? `${url}&` : '/albumart?');
      url += `sourceicon=${encodeURIComponent(baseImgPath + defaultImg)}`;
    }

    return url;
  }

  #getAlbumArtWithPlugin(data: AlbumArtPluginParams) {
    return this.#albumArtPlugin.getAlbumArt(data);
  }
}
