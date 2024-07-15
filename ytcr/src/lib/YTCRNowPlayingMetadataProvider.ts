import { MetadataAlbumInfo, MetadataArtistInfo, MetadataSongInfo, NowPlayingMetadataProvider, NowPlayingPluginSupport } from 'now-playing-common';
import ytcr, { PluginInfo } from './YTCRContext';
import MPDPlayer, { MPDPlayerVideoInfo } from './MPDPlayer';
import { Logger } from 'yt-cast-receiver';
import semver from 'semver';

// From YouTube Music plugin; includes only the necessary fields
interface YTMusicExplodedTrackInfo {
  type: 'song';
  title: string;
  artist: string;
  album: string;
  albumart: string;
  endpoint: {
    type: 'watch';
    payload: {
      videoId: string;
    };
  };
}

// From YouTube2 plugin; includes only the necessary fields
interface YouTube2ExplodedTrackInfo {
  title: string;
  artist: string;
  albumart: string;
  endpoint: {
    type: 'watch';
    payload: {
      videoId: string;
    };
  };
}

const REQUIRED_YTMUSIC_PLUGIN_VERSION = '>=1.1.0';
const REQUIRED_YOUTUBE2_PLUGIN_VERSION = '>=1.2.0';

export default class YTCRNowPlayingMetadataProvider implements NowPlayingMetadataProvider {

  version: '1.0.0';

  #player: MPDPlayer;
  #logger: Logger;

  constructor(player: MPDPlayer, logger: Logger) {
    this.version = '1.0.0';
    this.#player = player;
    this.#logger = logger;
  }

  async getSongInfo(songTitle: string, albumTitle?: string, artistName?: string): Promise<MetadataSongInfo | null> {
    const current = this.#player.currentVideo;
    switch (current?.src) {
      case 'yt':
        return this.#getSongInfoWithYouTube2Plugin(current, songTitle, albumTitle, artistName);
      case 'ytmusic':
        return this.#getSongInfoWithYTMusicPlugin(current, songTitle, albumTitle, artistName);
      default:
        return null;
    }
  }

  async getAlbumInfo(): Promise<MetadataAlbumInfo | null> {
    return null;
  }

  async getArtistInfo(): Promise<MetadataArtistInfo | null> {
    return null;
  }

  async #getMusicServicePlugin(pluginName: string, pluginPrettyName: string, requiredVersion: string) {
    this.#logger.debug(`[ytcr] Obtaining ${pluginPrettyName} plugin instance`);
    const plugin = ytcr.getMusicServicePlugin(pluginName);
    if (!this.#hasNowPlayingMetadataProvider(plugin)) {
      return null;
    }
    let pluginInfo: PluginInfo | null = null;
    try {
      pluginInfo = await ytcr.getPluginInfo(pluginName, 'music_service');
    }
    catch (error) {
      this.#logger.warn(`[ytcr] Error getting ${pluginPrettyName} plugin info`, error);
    }
    if (pluginInfo?.version) {
      if (!semver.satisfies(pluginInfo.version, requiredVersion)) {
        this.#logger.warn(`[ytcr] ${pluginPrettyName} plugin version '${pluginInfo.version}' does not satisfy '${requiredVersion}'`);
      }
      else {
        this.#logger.debug(`[ytcr] ${pluginPrettyName} plugin version is ${pluginInfo.version}`);
      }
    }
    else {
      this.#logger.warn(`[ytcr] ${pluginPrettyName} plugin version unavailable`);
    }
    return plugin;
  }

  async #getSongInfoWithYTMusicPlugin(target: MPDPlayerVideoInfo, songTitle: string, albumTitle?: string, artistName?: string) {
    const plugin = await this.#getMusicServicePlugin('ytmusic', 'YouTube Music', REQUIRED_YTMUSIC_PLUGIN_VERSION);
    if (!plugin) {
      return null;
    }
    this.#logger.info('[ytcr] Delegating getSongInfo() to YouTube Music plugin');
    const uri = this.#getYTMusicTrackURI(target, { songTitle, albumTitle, artistName });
    const provider = plugin.getNowPlayingMetadataProvider();
    if (provider) {
      return provider.getSongInfo(songTitle, albumTitle, artistName, uri);
    }
    return null;
  }

  #getYTMusicTrackURI(info: MPDPlayerVideoInfo, params: { songTitle: string; artistName?: string; albumTitle?: string; }) {
    // Ytmusic URI: ytmusic/[song/video]@explodeTrackData={...}
    const { songTitle, artistName, albumTitle } = params;
    const explodedTrackInfo: YTMusicExplodedTrackInfo = {
      type: 'song',
      title: info.title || songTitle || '',
      artist: info.artist || artistName || '',
      album: info.album || albumTitle || '',
      albumart: info.thumbnail || '',
      endpoint: {
        type: 'watch',
        payload: {
          videoId: info.id
        }
      }
    };
    return `ytmusic/song@explodeTrackData:o=${encodeURIComponent(JSON.stringify(explodedTrackInfo))}`;
  }

  async #getSongInfoWithYouTube2Plugin(target: MPDPlayerVideoInfo, songTitle: string, albumTitle?: string, artistName?: string) {
    const plugin = await this.#getMusicServicePlugin('youtube2', 'YouTube2', REQUIRED_YOUTUBE2_PLUGIN_VERSION);
    if (!plugin) {
      return null;
    }
    this.#logger.info('[ytcr] Delegating getSongInfo() to YouTube2 plugin');
    const uri = this.#getYouTube2TrackURI(target, { songTitle, albumTitle, artistName });
    const provider = plugin.getNowPlayingMetadataProvider();
    if (provider) {
      return provider.getSongInfo(songTitle, albumTitle, artistName, uri);
    }
    return null;
  }

  #getYouTube2TrackURI(info: MPDPlayerVideoInfo, params: { songTitle: string; artistName?: string; albumTitle?: string; }) {
    // YouTube2 URI: youtube2/video@endpoint={...}@explodeTrackData={...}
    const { songTitle, artistName } = params;
    const endpoint: YouTube2ExplodedTrackInfo['endpoint'] = {
      type: 'watch',
      payload: {
        videoId: info.id
      }
    };
    const explodedTrackInfo: YouTube2ExplodedTrackInfo = {
      title: info.title || songTitle || '',
      artist: info.artist || artistName || '',
      albumart: info.thumbnail || '',
      endpoint
    };
    return `youtube2/video@endpoint:o=${encodeURIComponent(JSON.stringify(endpoint))}@explodeTrackData:o=${encodeURIComponent(JSON.stringify(explodedTrackInfo))}`;
  }

  #hasNowPlayingMetadataProvider(plugin: any): plugin is { getNowPlayingMetadataProvider: NowPlayingPluginSupport['getNowPlayingMetadataProvider'] } {
    return plugin && typeof plugin['getNowPlayingMetadataProvider'] === 'function';
  }
}
