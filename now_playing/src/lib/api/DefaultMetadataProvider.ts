import Genius, { Album, Artist, Song, TextFormat } from 'genius-fetch';
import { MetadataAlbumInfo, MetadataArtistInfo, MetadataSongInfo, NowPlayingMetadataProvider } from 'now-playing-common';
import np from '../NowPlayingContext';
import LRCLibAPI from './lrclib';

export default class DefaultMetadataProvider implements NowPlayingMetadataProvider<'1.1.0'> {

  version: '1.1.0';

  #genius: Genius;
  #accessToken: string;

  constructor() {
    this.#genius = new Genius();
  }

  config(params: { accessToken: string }) {
    this.version = '1.1.0';
    this.#accessToken = params.accessToken;
    this.#genius.config(params);
  }

  async getSongInfo(songTitle: string, albumTitle?: string, artistName?: string, duration?: number, _uri?: string, fillTarget?: MetadataSongInfo | null): Promise<MetadataSongInfo | null> {
    const needGetLyrics =
      !fillTarget ||
      !fillTarget.lyrics ||
      (fillTarget.lyrics?.type !== 'synced' && np.getConfigValue('metadataService').enableSyncedLyrics);
    const result: MetadataSongInfo = {
      title: songTitle,
      lyrics: needGetLyrics ? await LRCLibAPI.getLyrics(songTitle, albumTitle, artistName, duration) : null
    };
    if (!this.#accessToken) {
      if (result.lyrics) {
        return result;
      }
      throw Error(np.getI18n('NOW_PLAYING_ERR_METADATA_NO_TOKEN'));
    }
    // Fetch from Genius
    try {
      // Do not include album, as compilation albums tend to result in false hits
      const matchParams = {
        name: songTitle,
        artist: artistName
      };
      const song = await this.#getSongByNameOrBestMatch(matchParams);
      const songSnippet = this.#getSongSnippet(song);
      if (song && songSnippet) {
        const { title, description, image, embed } = songSnippet;
        result.title = title;
        result.description = description;
        result.image = image;
        if (song.artists && song.artists.primary) {
          const artist = await this.#genius.getArtistById(song.artists.primary.id, { textFormat: TextFormat.Plain });
          result.artist = this.#getArtistSnippet(artist);
        }
        if (embed && !result.lyrics) {
          const embedContents = await this.#genius.parseSongEmbed(embed);
          if (embedContents) {
            result.lyrics = {
              type: 'html',
              lines: embedContents.contentParts.join()
            };
          }
        }
      }
      // No song found, but still attempt to fetch artist info
      else if (artistName) {
        result.artist = await this.getArtistInfo(artistName);
      }

      // Finally, fetch album info
      if (albumTitle) {
        result.album = await this.getAlbumInfo(albumTitle, artistName);
      }
    }
    catch (error) {
      np.getLogger().error(np.getErrorMessage('[now-playing] Error fetching from Genius:', error));
      if (!result.lyrics) {
        throw error;
      }
    }

    return result;
  }

  async getAlbumInfo(albumTitle: string, artistName?: string): Promise<MetadataAlbumInfo | null> {
    if (!this.#accessToken) {
      throw Error(np.getI18n('NOW_PLAYING_ERR_METADATA_NO_TOKEN'));
    }
    const album = await this.#getAlbumByNameOrBestMatch({
      name: albumTitle,
      artist: artistName
    });
    const result = this.#getAlbumSnippet(album) || { title: albumTitle };
    if (album && album.artist) {
      const artist = await this.#genius.getArtistById(album.artist.id, { textFormat: TextFormat.Plain });
      result.artist = this.#getArtistSnippet(artist);
    }
    return result;
  }

  async getArtistInfo(artistName: string): Promise<MetadataArtistInfo | null> {
    if (!this.#accessToken) {
      throw Error(np.getI18n('NOW_PLAYING_ERR_METADATA_NO_TOKEN'));
    }
    const artist = await this.#genius.getArtistsByName(artistName, { textFormat: TextFormat.Plain, obtainFullInfo: true, limit: 1 });
    return this.#getArtistSnippet(artist.items[0]) || { name: artistName };
  }

  #getSongSnippet(info: Song | null): MetadataSongInfo & { embed?: string } | null {
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

  clearCache() {
    this.#genius.clearCache();
  }
}
