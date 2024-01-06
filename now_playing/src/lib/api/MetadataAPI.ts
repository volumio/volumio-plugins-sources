import Genius, { Album, Artist, Song, TextFormat } from 'genius-fetch';
import md5 from 'md5';
import np from '../NowPlayingContext';
import Cache from '../utils/Cache';
import { Metadata, MetadataAlbumInfo, MetadataArtistInfo, MetadataSongInfo } from 'now-playing-common';

type ItemType = 'song' | 'album' | 'artist';

class MetadataAPI {

  #fetchPromises: Record<ItemType, Record<string, Promise<Metadata>>>;

  #genius: Genius;
  #accessToken: string | null;
  #cache: Cache;

  constructor() {
    this.#fetchPromises = {
      'song': {},
      'album': {},
      'artist': {}
    };
    this.#genius = new Genius();
    this.#accessToken = null;
    this.#cache = new Cache(
      { song: 3600, album: 3600, artist: 3600 },
      { song: 200, album: 200, artist: 200 });

  }

  clearCache() {
    this.#genius.clearCache();
    this.#cache.clear();
  }

  setAccessToken(accessToken: string) {
    if (accessToken === this.#accessToken) {
      return;
    }
    this.#genius.config({ accessToken });
    this.clearCache();
    this.#accessToken = accessToken;
  }

  #getFetchPromise(type: ItemType, params: Record<string, any>, callback: () => Promise<Metadata>) {
    const key = md5(JSON.stringify(params));
    if (Object.keys(this.#fetchPromises[type]).includes(key)) {
      return this.#fetchPromises[type][key];
    }

    const promise = callback();
    this.#fetchPromises[type][key] = promise;
    promise.finally(() => {
      delete this.#fetchPromises[type][key];
    });
    return promise;

  }

  #getSongSnippet(info: Song | null): MetadataSongInfo | null {
    if (!info) {
      return null;
    }
    return {
      title: info.title.regular,
      description: info.description,
      image: info.image,
      embed: info.embed
    };
  }

  #getAlbumSnippet(info: Album | null): MetadataAlbumInfo | null {
    if (!info) {
      return null;
    }
    return {
      title: info.title.regular,
      description: info.description,
      releaseDate: info.releaseDate?.text,
      image: info.image
    };
  }

  #getArtistSnippet(info: Artist | null): MetadataArtistInfo | null{
    if (!info) {
      return null;
    }
    return {
      name: info.name,
      description: info.description,
      image: info.image
    };
  }

  async #getSongByNameOrBestMatch(params: { name: string; artist?: string; }) {
    if (!params.name) {
      return null;
    }

    if (params.artist) {
      return this.#genius.getSongByBestMatch(
        { ...params, artist: params.artist },
        { textFormat: TextFormat.Plain, obtainFullInfo: true });
    }

    const song = await this.#genius.getSongsByName(
      params.name,
      { textFormat: TextFormat.Plain, obtainFullInfo: true, limit: 1 });

    return song.items[0] || null;

  }

  #getSongInfo(params: { name: string; album: string; artist?: string; }) {
    return this.#getFetchPromise('song', params, async () => {
      const result: Metadata = {
        song: null,
        artist: null,
        album: null
      };

      // Do not include album, as compilation albums tend to result in false hits
      const matchParams = {
        name: params.name,
        artist: params.artist
      };
      const song = await this.#getSongByNameOrBestMatch(matchParams);
      if (song) {
        result.song = this.#getSongSnippet(song);
        if (song.artists && song.artists.primary) {
          const artist = await this.#genius.getArtistById(song.artists.primary.id, { textFormat: TextFormat.Plain });
          result.artist = this.#getArtistSnippet(artist);
        }

        if (result.song?.embed) {
          const embedContents = await this.#genius.parseSongEmbed(result.song.embed);
          if (embedContents) {
            result.song.embedContents = embedContents;
          }
        }
      }
      // No song found, but still attempt to fetch artist info
      else if (params.artist) {
        const artistInfo = await this.#getArtistInfo({ name: params.artist });
        if (artistInfo.artist) {
          result.artist = artistInfo.artist;
        }
      }

      // Finally, fetch album info
      const albumInfo = await this.#getAlbumInfo({
        name: params.album,
        artist: params.artist
      });
      if (albumInfo) {
        result.album = albumInfo.album;
      }

      return result;
    });
  }

  async #getAlbumByNameOrBestMatch(params: { name: string; artist?: string; }) {
    if (!params.name) {
      return null;
    }

    if (params.artist) {
      return this.#genius.getAlbumByBestMatch(
        { ...params, artist: params.artist },
        { textFormat: TextFormat.Plain, obtainFullInfo: true });
    }

    const album = await this.#genius.getAlbumsByName(
      params.name,
      { textFormat: TextFormat.Plain, obtainFullInfo: true, limit: 1 });

    return album.items[0] || null;

  }

  #getAlbumInfo(params: { name: string; artist?: string; }) {
    return this.#getFetchPromise('album', params, async () => {
      const result: Metadata = {
        album: null,
        artist: null
      };
      const album = await this.#getAlbumByNameOrBestMatch(params);
      result.album = this.#getAlbumSnippet(album);
      if (album && album.artist) {
        const artist = await this.#genius.getArtistById(album.artist.id, { textFormat: TextFormat.Plain });
        result.artist = this.#getArtistSnippet(artist);
      }
      return result;
    });
  }

  #getArtistInfo(params: { name: string; }) {
    return this.#getFetchPromise('artist', params, async () => {
      const result: Metadata = {
        artist: null
      };
      if (!params.name) {
        return result;
      }
      const artist = await this.#genius.getArtistsByName(params.name, { textFormat: TextFormat.Plain, obtainFullInfo: true, limit: 1 });
      result.artist = this.#getArtistSnippet(artist.items[0]);
      return result;
    });
  }

  async fetchInfo(params: { type: ItemType; name: string; album?: string; artist?: string; }) {
    if (!np.getConfigValue('geniusAccessToken')) {
      throw Error(np.getI18n('NOW_PLAYING_ERR_METADATA_NO_TOKEN'));
    }
    try {
      let info: Metadata;
      const cacheKey = md5(JSON.stringify(params));
      if (params.type === 'song' && params.album) {
        const album = params.album;
        info = await this.#cache.getOrSet('song', cacheKey, () => this.#getSongInfo({ ...params, album }));
      }
      else if (params.type === 'album') {
        info = await this.#cache.getOrSet('album', cacheKey, () => this.#getAlbumInfo(params));
      }
      else if (params.type === 'artist') {
        info = await this.#cache.getOrSet('artist', cacheKey, () => this.#getArtistInfo(params));
      }
      else {
        throw Error(`Unknown metadata type ${params.type}`);
      }
      return info;
    }
    catch (e: any) {
      const { message, statusCode, statusMessage } = e;
      const status = (statusCode && statusMessage) ? `${statusCode} - ${statusMessage}` : (statusCode || statusMessage);
      let msg;
      if (status) {
        msg = `${np.getI18n('NOW_PLAYING_ERR_METADATA_FETCH')}: ${status}`;
      }
      else {
        msg = np.getI18n('NOW_PLAYING_ERR_METADATA_FETCH') + (message ? `: ${message}` : '');
      }
      throw Error(msg);
    }
  }
}

const metadataAPI = new MetadataAPI();

export default metadataAPI;
