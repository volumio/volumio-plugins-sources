import md5 from 'md5';
import np from '../NowPlayingContext';
import Cache from '../utils/Cache';
import { assignObjectEmptyProps, removeSongNumber } from '../utils/Misc';
import { Metadata, NowPlayingMetadataProvider, NowPlayingPluginSupport } from 'now-playing-common';
import { MetadataServiceOptions } from '../config/PluginConfig';
import { escapeRegExp } from 'lodash';
import DefaultMetadataProvider from './DefaultMetadataProvider';
import escapeHTML from 'escape-html';
import semver from 'semver';

type ItemType = 'song' | 'album' | 'artist';

export interface MetadataAPIFetchInfoParams {
  type: ItemType;
  name: string;
  album?: string;
  artist?: string;
  duration?: number;
  uri?: string;
  service?: string;
}

const REQUIRED_PROVIDER_VERSION = '1.x';

class MetadataAPI {

  #fetchPromises: Record<string, Promise<Metadata>>;
  #defaultMetadataProvider: DefaultMetadataProvider;
  #settings: MetadataServiceOptions | null;
  #cache: Cache;

  constructor() {
    this.#fetchPromises = {};
    this.#defaultMetadataProvider = new DefaultMetadataProvider();
    this.#settings = null;
    this.#cache = new Cache(
      { song: 3600, album: 3600, artist: 3600 },
      { song: 200, album: 200, artist: 200 });
  }

  clearCache() {
    this.#defaultMetadataProvider.clearCache();
    this.#cache.clear();
  }

  updateSettings(settings: MetadataServiceOptions) {
    const tokenChanged = !this.#settings || settings.geniusAccessToken !== this.#settings.geniusAccessToken;

    this.#settings = settings;
    if (tokenChanged) {
      this.#defaultMetadataProvider.config({ accessToken: settings.geniusAccessToken });
      this.clearCache();
    }
  }

  #getFetchPromise(key: string, callback: () => Promise<Metadata>) {
    if (Object.keys(this.#fetchPromises).includes(key)) {
      return this.#fetchPromises[key];
    }
    const promise = callback();
    this.#fetchPromises[key] = promise;
    promise.finally(() => {
      delete this.#fetchPromises[key];
    });
    return promise;
  }

  async fetchInfo(params: MetadataAPIFetchInfoParams) {
    const { info, provider } = await this.#doFetchInfo(params);
    if (!(provider instanceof DefaultMetadataProvider)) {
      let needFillInfo = false;
      switch (params.type) {
        case 'song':
          needFillInfo = !this.#isSongInfoComplete(info);
          break;
        case 'album':
          needFillInfo = !this.#isBasicAlbumInfoComplete(info);
          break;
        case 'artist':
          needFillInfo = !this.#isBasicArtistInfoComplete(info);
          break;
      }
      if (needFillInfo) {
        try {
          const { info: fillInfo } = await this.#doFetchInfo(params, true, info);
          return assignObjectEmptyProps({}, info, fillInfo);
        }
        catch (error) {
          // Do nothing
        }
      }
    }
    if (info.song?.lyrics?.type === 'synced' && !np.getConfigValue('metadataService').enableSyncedLyrics) {
      info.song.lyrics = {
        type: 'plain',
        lines: info.song.lyrics.lines.map((line) => escapeHTML(line.text))
      };
    }
    return info;
  }

  #isSongInfoComplete(info?: Metadata | null) {
    return !!(info?.song && info.song.description && info.song.lyrics && this.#isBasicAlbumInfoComplete(info));
  }

  #isBasicAlbumInfoComplete(info?: Metadata | null) {
    return !!(info?.album && info.album.description && this.#isBasicArtistInfoComplete(info));
  }

  #isBasicArtistInfoComplete(info?: Metadata | null) {
    return !!(info?.artist && info.artist.description && info.artist.image);
  }

  async #doFetchInfo(params: MetadataAPIFetchInfoParams, useDefaultProvider: true, fillTarget?: Metadata): Promise<{ info: Metadata; provider: NowPlayingMetadataProvider<any>; }>;
  async #doFetchInfo(params: MetadataAPIFetchInfoParams, useDefaultProvider?: false): Promise<{ info: Metadata; provider: NowPlayingMetadataProvider<any>; }>;
  async #doFetchInfo(params: MetadataAPIFetchInfoParams, useDefaultProvider = false, fillTarget?: Metadata): Promise<{ info: Metadata; provider: NowPlayingMetadataProvider<any>; }> {
    const isTrackNumberEnabled = np.getPluginSetting('music_service', 'mpd', 'tracknumbers');
    const { provider, service: providerSource } = useDefaultProvider ? {
      provider: this.#defaultMetadataProvider,
      service: ''
    } : this.#getProvider(params.uri, params.service);
    try {
      params = {
        type: params.type,
        ...this.#excludeParenthesis(params),
        duration: params.duration,
        uri: params.uri,
        service: providerSource
      };
      const providerStr = providerSource ? `(${providerSource} plugin)` : '(DefaultMetadataProvider)';
      np.getLogger().info(`[now-playing] Fetch metadata ${providerStr}: ${JSON.stringify(params)}`);
      const cacheKey = md5(JSON.stringify({...params, providerSource}));
      const info = await this.#getFetchPromise(cacheKey, async () => {
        if (params.type === 'song') {
          const name = isTrackNumberEnabled ? removeSongNumber(params.name) : params.name;
          let songInfo;
          switch (provider.version) {
            case '1.0.0':
              songInfo = await this.#cache.getOrSet('song', cacheKey, () => provider.getSongInfo(name, params.album, params.artist, params.uri));
              break;
            case '1.1.0':
              if (provider instanceof DefaultMetadataProvider && fillTarget) {
                songInfo = await this.#cache.getOrSet('song', cacheKey, () => provider.getSongInfo(name, params.album, params.artist, Number(params.duration), params.uri, fillTarget['song']));
              }
              else {
                songInfo = await this.#cache.getOrSet('song', cacheKey, () => provider.getSongInfo(name, params.album, params.artist, Number(params.duration), params.uri));
              }
              break;
          }
          return {
            song: songInfo || null,
            album: songInfo?.album || null,
            artist: songInfo?.artist || null
          };
        }
        else if (params.type === 'album') {
          const albumInfo = await this.#cache.getOrSet('album', cacheKey, () => provider.getAlbumInfo(params.name, params.artist, params.uri));
          return {
            album: albumInfo || null,
            artist: albumInfo?.artist || null
          };
        }
        else if (params.type === 'artist') {
          const artistInfo = await this.#cache.getOrSet('artist', cacheKey, () => provider.getArtistInfo(params.name, params.uri));
          return {
            artist: artistInfo || null
          };
        }

        throw Error(`Unknown metadata type ${params.type}`);

      });
      return {
        info,
        provider
      };
    }
    catch (e: any) {
      if (!(provider instanceof DefaultMetadataProvider)) {
        np.getLogger().error(`[now_playing] Error fetching metdata using ${providerSource} plugin: ${e instanceof Error ? e.message : e}`);
        np.getLogger().error('[now_playing] Falling back to DefaultMetadataProvider');
        return this.#doFetchInfo(params, true);
      }
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

  #excludeParenthesis(params: { name: string; album?: string; artist?: string; }) {
    if (!this.#settings || !this.#settings.excludeParenthesized) {
      return params;
    }

    const __strip = (s: string | undefined, parentheses: Array<'()' | '[]'>) => {
      if (!s) {
        return s;
      }
      let result = s;
      for (const p of parentheses) {
        const [ opening, closing ] = p;
        const regexStr = `(${escapeRegExp(opening)}.*?${escapeRegExp(closing)})`;
        result = result.replace(new RegExp(regexStr, 'gm'), '');
      }
      return result;
    };

    let parentheses: Array<'()' | '[]'>;
    switch (this.#settings.parenthesisType) {
      case 'round':
        parentheses = [ '()' ];
        break;
      case 'square':
        parentheses = [ '[]' ];
        break;
      case 'round+square':
        parentheses = [ '()', '[]' ];
        break;
    }

    return {
      name: __strip(params.name, parentheses)?.trim() || params.name,
      album: __strip(params.album, parentheses)?.trim() || params.album,
      artist: __strip(params.artist, parentheses)?.trim() || params.artist
    };
  }

  #getProvider(uri?: string, service?: string) {
    if (np.getConfigValue('metadataService').queryMusicServices) {
      /**
       * Always get service by URI if possible.
       * Volumio has this long-standing bug where the MPD plugin sets service as 'mpd' even when
       * consume state is on (consuming on behalf of another service).
       */
      if (uri) {
        const _service = uri.split('/')[0];
        if (_service) {
          service = _service;
        }
      }
      if (service) {
        const plugin = np.getMusicServicePlugin(service);
        if (this.#hasNowPlayingMetadataProvider(plugin)) {
          const provider = plugin.getNowPlayingMetadataProvider<any>();
          if (provider && this.#validateNowPlayingMetadataProvider(provider, service)) {
            return {
              provider,
              service
            };
          }
        }
      }
    }
    return {
      provider: this.#defaultMetadataProvider,
      service: ''
    };
  }

  #hasNowPlayingMetadataProvider(plugin: any): plugin is { getNowPlayingMetadataProvider: NowPlayingPluginSupport['getNowPlayingMetadataProvider'] } {
    return plugin && typeof plugin['getNowPlayingMetadataProvider'] === 'function';
  }

  #validateNowPlayingMetadataProvider(provider: any, service: string) {
    const logPrefix = `[now-playing] NowPlayingPluginMetadataProvider for '${service}' plugin`;
    if (typeof provider !== 'object') {
      np.getLogger().error(`${logPrefix} has wrong type`);
      return false;
    }
    if (!Reflect.has(provider, 'version')) {
      np.getLogger().warn(`${logPrefix} is missing version number`);
    }
    else if (!semver.satisfies(provider.version, REQUIRED_PROVIDER_VERSION)) {
      np.getLogger().warn(`${logPrefix} has version '${provider.version}' which does not satisfy '${REQUIRED_PROVIDER_VERSION}'`);
    }
    const fns = [
      'getSongInfo',
      'getAlbumInfo',
      'getArtistInfo'
    ];
    if (!fns.every((fn) => Reflect.has(provider, fn) && typeof provider[fn] === 'function')) {
      np.getLogger().error(`${logPrefix} is missing one of the following functions: ${fns.map((fn) => `${fn}()`).join(', ')}`);
      return false;
    }
    return true;
  }
}

const metadataAPI = new MetadataAPI();

export default metadataAPI;
