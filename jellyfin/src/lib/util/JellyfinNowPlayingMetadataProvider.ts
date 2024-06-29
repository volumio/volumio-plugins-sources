import { MetadataAlbumInfo, MetadataArtistInfo, MetadataSongInfo, MetadataLyrics, NowPlayingMetadataProvider } from 'now-playing-common';
import Model, { ModelType } from '../model';
import ConnectionManager from '../connection/ConnectionManager';
import ViewHelper from '../controller/browse/view-handlers/ViewHelper';
import ServerHelper from './ServerHelper';
import jellyfin from '../JellyfinContext';

export default class JellyfinNowPlayingMetadataProvider implements NowPlayingMetadataProvider {

  version: '1.0.0';

  #connectionManager: ConnectionManager;

  constructor(connectionManager: ConnectionManager) {
    this.version = '1.0.0';
    this.#connectionManager = connectionManager;
  }

  async getSongInfo(songTitle: string, _albumTitle?: string, _artistName?: string, uri?: string): Promise<MetadataSongInfo | null> {
    jellyfin.getLogger().info(`[jellyfin] Fetch song info for Now Playing plugin. URI: ${uri}`);
    if (!uri) {
      jellyfin.getLogger().error('[jellyfin] Error fetching song info for Now Playing plugin: no URI');
      return null;
    }
    const views = ViewHelper.getViewsFromUri(uri);
    const currentView = views.pop();
    if (!currentView || currentView.name !== 'song' || !currentView.songId) {
      jellyfin.getLogger().error('[jellyfin] Error fetching song info for Now Playing plugin: URI does not point to a song');
      return null;
    }
    const connection = await ServerHelper.getConnectionByView(currentView, this.#connectionManager);
    if (!connection) {
      jellyfin.getLogger().error('[jellyfin] Error fetching song info for Now Playing plugin: no connection to server');
      return null;
    }
    const model = Model.getInstance(ModelType.Song, connection);
    let lyrics: MetadataLyrics | null = null;
    try {
      lyrics = await model.getLyrics(currentView.songId);
    }
    catch (error: any) {
      jellyfin.getLogger().error(`[jellyfin] Error fetching lyrics: ${error instanceof Error ? error.message : error}`);
    }
    if (lyrics) {
      jellyfin.getLogger().info(`[jellyfin] Fetched lyrics for Now Playing plugin (type ${lyrics.type})`);
    }
    else {
      jellyfin.getLogger().info('[jellyfin] Lyrics unavailable for Now Playing plugin');
    }
    return {
      title: songTitle,
      lyrics
    };
  }

  async getAlbumInfo(): Promise<MetadataAlbumInfo | null> {
    return null;
  }

  async getArtistInfo(): Promise<MetadataArtistInfo | null> {
    return null;
  }

}
