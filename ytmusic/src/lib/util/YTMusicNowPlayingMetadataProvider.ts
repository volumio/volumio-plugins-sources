import { MetadataAlbumInfo, MetadataArtistInfo, MetadataSongInfo, NowPlayingMetadataProvider } from 'now-playing-common';
import Model, { ModelType } from '../model';
import ViewHelper from '../controller/browse/view-handlers/ViewHelper';
import ytmusic from '../YTMusicContext';
import PlayController from '../controller/play/PlayController';
import { BrowseEndpoint, EndpointType } from '../types/Endpoint';
import { AlbumView } from '../controller/browse/view-handlers/AlbumViewHandler';
import { PageElement } from '../types';

export default class YTMusicNowPlayingMetadataProvider implements NowPlayingMetadataProvider {

  version: '1.0.0';

  constructor() {
    this.version = '1.0.0';
  }

  async getSongInfo(songTitle: string, albumTitle?: string, artistName?: string, uri?: string): Promise<MetadataSongInfo | null> {
    ytmusic.getLogger().info(`[ytmusic] Fetch song info for Now Playing plugin. URI: ${uri}`);

    // URI: ytmusic/[song/video]@explodeTrackData={...}
    const { videoId, info: playbackInfo } = (uri ? await PlayController.getPlaybackInfoFromUri(uri) : null) || { videoId: null, info: null };
    if (!playbackInfo) {
      ytmusic.getLogger().error('[ytmusic] Error fetching song info for Now Playing plugin: no playback info from URI');
      return null;
    }

    const song: MetadataSongInfo = {
      title: playbackInfo.title || songTitle,
      image: playbackInfo.thumbnail,
      artist: null,
      album: null
    };

    if (playbackInfo.album.albumId) {
      song.album = await this.getAlbumInfo(playbackInfo.album.title || albumTitle, artistName, { albumId: playbackInfo.album.albumId });
    }

    if (playbackInfo.artist.channelId) {
      song.artist = await this.getArtistInfo(playbackInfo.artist.name || artistName, { channelId: playbackInfo.artist.channelId });
    }

    if (videoId) {
      try {
        song.lyrics = await Model.getInstance(ModelType.MusicItem).getLyrics(videoId);
      }
      catch (error) {
        ytmusic.getLogger().error(ytmusic.getErrorMessage('[ytmusic] Error fetching lyrics:', error));
        song.lyrics = null;
      }
    }

    return song;
  }

  async getAlbumInfo(albumTitle?: string, artistName?: string, payload?: string | { albumId: string }): Promise<MetadataAlbumInfo | null> {
    let albumId: string | null = null;
    if (typeof payload === 'string') {
      // URI: album@endpoints={ watch: ..., browse: ... }
      ytmusic.getLogger().info(`[ytmusic] Fetch album info for Now Playing plugin. URI: ${payload}`);
      const view = ViewHelper.getViewsFromUri(payload).pop();
      if (view?.name !== 'album' || !view.endpoints || typeof view.endpoints !== 'object' || !view.endpoints.browse) {
        ytmusic.getLogger().error('[ytmusic] Error fetching album info for Now Playing plugin: invalid URI');
        return null;
      }
      albumId = (view as AlbumView).endpoints.browse.payload.browseId;
    }
    else {
      albumId = payload?.albumId || null;
    }
    if (!albumId) {
      ytmusic.getLogger().error('[ytmusic] Not fetching album info for Now Playing plugin: no album ID available');
      return null;
    }
    const albumEndpoint: BrowseEndpoint = {
      type: EndpointType.Browse,
      payload: {
        browseId: albumId
      }
    };
    const model = Model.getInstance(ModelType.Endpoint);
    const albumData = (await model.getContents(albumEndpoint))?.header as PageElement.AlbumHeader | undefined;
    if (!albumData) {
      ytmusic.getLogger().error('[ytmusic] Error fetching album info for Now Playing plugin: no data');
      return null;
    }
    if (!albumTitle && !albumData.title) {
      ytmusic.getLogger().error('[ytmusic] Error fetching album info for Now Playing plugin: data is missing title');
      return null;
    }
    const album: MetadataAlbumInfo = {
      title: albumData.title || albumTitle as string,
      description: albumData.description || null,
      image: albumData.thumbnail || null,
      artist: await this.getArtistInfo(artistName, albumData.artist?.channelId ? { channelId: albumData.artist?.channelId } : undefined)
    };

    return album;
  }

  async getArtistInfo(artistName?: string, payload?: string | { channelId: string }): Promise<MetadataArtistInfo | null> {
    let channelId: string | null = null;
    if (typeof payload === 'string') {
      // URI: generic@endpoint={...}
      ytmusic.getLogger().info(`[ytmusic] Fetch artist info for Now Playing plugin. URI: ${payload}`);
      const view = ViewHelper.getViewsFromUri(payload).pop();
      if (view?.name !== 'generic' || !view.endpoint || typeof view.endpoint !== 'object' || view.type !== EndpointType.Browse) {
        ytmusic.getLogger().error('[ytmusic] Error fetching artist info for Now Playing plugin: invalid URI');
        return null;
      }
      channelId = (view.endpoint as BrowseEndpoint).payload.browseId;
    }
    else {
      channelId = payload?.channelId || null;
    }
    if (!channelId) {
      ytmusic.getLogger().error('[ytmusic] Not fetching artist info for Now Playing plugin: no channel ID available');
      return null;
    }
    const channelEndpoint: BrowseEndpoint = {
      type: EndpointType.Browse,
      payload: {
        browseId: channelId
      }
    };
    const model = Model.getInstance(ModelType.Endpoint);
    const channelData = (await model.getContents(channelEndpoint))?.header;
    if (!channelData) {
      ytmusic.getLogger().error('[ytmusic] Error fetching artist info for Now Playing plugin: no data');
      return null;
    }
    if (!artistName && !channelData.title) {
      ytmusic.getLogger().error('[ytmusic] Error fetching artist info for Now Playing plugin: data is missing name');
      return null;
    }
    const artist: MetadataArtistInfo = {
      name: channelData.title || artistName as string,
      description: channelData.description || null,
      image: channelData.thumbnail || null
    };

    return artist;
  }
}
