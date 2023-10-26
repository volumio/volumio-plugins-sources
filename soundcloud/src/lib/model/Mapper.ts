import { Album, EntityType, LibraryItem, Playlist, Selection, SystemPlaylist, Track, User } from 'soundcloud-fetch';
import UserEntity from '../entities/UserEntity';
import PlaylistEntity from '../entities/PlaylistEntity';
import TrackEntity from '../entities/TrackEntity';
import AlbumEntity from '../entities/AlbumEntity';
import { ArtworkImageUrls, AvatarImageUrls } from 'soundcloud-fetch/dist/mjs/lib/entities/Entity';
import SelectionEntity from '../entities/SelectionEntity';

export default class Mapper {

  static async mapUser(data: User) {
    const { id, names, location, permalink } = data;
    let locationFull = '';
    if (location?.city) {
      locationFull = location.city;
      if (location.country) {
        locationFull += `, ${location.country}`;
      }
    }

    const result: UserEntity = {
      id,
      username: names?.username,
      firstName: names.first,
      lastName: names.last,
      fullName: names?.full,
      thumbnail: await this.#getThumbnail(data),
      permalink: permalink?.full,
      location: locationFull
    };

    return result;
  }

  static async mapPlaylist(data: Playlist | SystemPlaylist) {
    const { permalink, user, trackCount } = data;
    let title, description;
    let type: 'playlist' | 'system-playlist';

    if (data instanceof SystemPlaylist) {
      title = (data as SystemPlaylist).texts?.title?.full;
      description = (data as SystemPlaylist).texts?.description?.full;
      type = 'system-playlist';
    }
    else {
      title = data.texts?.title;
      description = data.texts?.description;
      type = 'playlist';
    }

    const result: PlaylistEntity = {
      type,
      title,
      description,
      thumbnail: await this.#getThumbnail(data),
      permalink: permalink?.full,
      user: user ? await this.mapUser(user) : null,
      tracks: [],
      trackCount: trackCount,
      isPublic: data.isPublic
    };

    if (result.type === 'system-playlist' && data instanceof SystemPlaylist) {
      result.id = data.id;
      result.urn = data.apiInfo.urn;
    }
    else if (result.type === 'playlist' && data instanceof Playlist) {
      result.id = data.id;
    }

    return result;
  }

  static async mapTrack(data: Track) {
    const { id, texts, publisher, mediaInfo, user } = data;
    const album = publisher?.albumTitle || publisher?.releaseTitle || null;
    const playableState =
      data.isBlocked ? 'blocked' :
        data.isSnipped ? 'snipped' :
          'allowed';
    const transcodings: TrackEntity['transcodings'] = mediaInfo?.transcodings?.map((t) => ({
      url: t.url,
      protocol: t.protocol,
      mimeType: t.mimeType,
      quality: t.quality
    })) || [];

    const result: TrackEntity = {
      type: 'track',
      id,
      urn: data.apiInfo.urn,
      title: texts?.title,
      album,
      thumbnail: await this.#getThumbnail(data),
      playableState,
      duration: data.durations.playback,
      transcodings,
      user: user ? await this.mapUser(user) : null
    };

    return result;
  }

  static async mapLibraryItem(data: LibraryItem): Promise<AlbumEntity | PlaylistEntity | null> {
    const wrappedItem = data.item;
    let mappedSet;
    if (wrappedItem instanceof Album) {
      mappedSet = await this.mapAlbum(wrappedItem);
    }
    else if (wrappedItem instanceof Playlist || wrappedItem instanceof SystemPlaylist) {
      mappedSet = await this.mapPlaylist(wrappedItem);
    }
    else {
      return null;
    }
    mappedSet.isLiked = data.itemType === 'AlbumLike' || data.itemType === 'PlaylistLike' || data.itemType === 'SystemPlaylistLike';

    return mappedSet;
  }

  static async mapAlbum(data: Album) {
    const { id, permalink, user, trackCount } = data;
    const title = data.texts?.title;
    const description = data.texts?.description;

    const result: AlbumEntity = {
      id,
      type: 'album',
      title,
      description,
      thumbnail: await this.#getThumbnail(data),
      permalink: permalink?.full,
      user: user ? await this.mapUser(user) : null,
      tracks: [],
      trackCount,
      isPublic: data.isPublic
    };

    return result;
  }

  static async mapSelection(data: Selection) {
    const items = await Promise.all(data.items.reduce<Promise<PlaylistEntity>[]>((result, item) => {
      if (item instanceof Playlist || item instanceof SystemPlaylist) {
        result.push(this.mapPlaylist(item));
      }
      return result;
    }, []));

    const result: SelectionEntity = {
      type: 'selection',
      id: data.id,
      title: data.title,
      items
    };

    return result;
  }

  static async #getThumbnail(data: EntityType): Promise<string | null> {
    let artwork: ArtworkImageUrls | AvatarImageUrls | null | undefined;
    if (data instanceof User) {
      artwork = data.avatar;
    }
    else if (data instanceof SystemPlaylist) {
      artwork = data.artwork?.original || data.artwork?.calculated;
    }
    else if (data instanceof Playlist || data instanceof Track) {
      artwork = data.artwork;
    }
    else {
      artwork = null;
    }

    if (artwork) {
      return artwork.t500x500 || artwork.default;
    }

    if (data instanceof Playlist || data instanceof SystemPlaylist || data instanceof Album) {
      const tracks = await data.getTracks();
      if (tracks.length > 0) {
        return this.#getThumbnail(tracks[0]);
      }
      if (data.user) {
        return this.#getThumbnail(data.user);
      }
    }

    if (data instanceof Track && data.user) {
      return this.#getThumbnail(data.user);
    }

    return null;
  }
}
