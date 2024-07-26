import { MetadataAlbumInfo, MetadataArtistInfo, MetadataSongInfo, NowPlayingMetadataProvider } from 'now-playing-common';
import Model, { ModelType } from '../model';
import ViewHelper from '../controller/browse/view-handlers/ViewHelper';
import yt2 from '../YouTube2Context';
import PlayController from '../controller/play/PlayController';
import { BrowseEndpoint, EndpointType } from '../types/Endpoint';

export default class YouTube2NowPlayingMetadataProvider implements NowPlayingMetadataProvider {

  version: '1.0.0';

  constructor() {
    this.version = '1.0.0';
  }

  async getSongInfo(songTitle: string, _albumTitle?: string, artistName?: string, uri?: string): Promise<MetadataSongInfo | null> {
    yt2.getLogger().info(`[youtube2] Fetch song info for Now Playing plugin. URI: ${uri}`);

    // URI: youtube2/[song/video]@explodeTrackData={...}
    const { info: playbackInfo } = (uri ? await PlayController.getPlaybackInfoFromUri(uri) : null) || { videoId: null, info: null };
    if (!playbackInfo) {
      yt2.getLogger().error('[youtube2] Error fetching song info for Now Playing plugin: no playback info from URI');
      return null;
    }

    const song: MetadataSongInfo = {
      title: playbackInfo.title || songTitle,
      image: playbackInfo.thumbnail,
      description: playbackInfo.description,
      artist: null,
      album: null
    };

    if (playbackInfo.author.channelId) {
      song.artist = await this.getArtistInfo(playbackInfo.author.name || artistName, { channelId: playbackInfo.author.channelId });
    }

    return song;
  }

  async getAlbumInfo(): Promise<MetadataAlbumInfo | null> {
    return null;
  }

  async getArtistInfo(artistName?: string, payload?: string | { channelId: string }): Promise<MetadataArtistInfo | null> {
    let channelId: string | null = null;
    if (typeof payload === 'string') {
      // URI: generic@endpoint={...}
      yt2.getLogger().info(`[youtube2] Fetch artist info for Now Playing plugin. URI: ${payload}`);
      const view = ViewHelper.getViewsFromUri(payload).pop();
      if (view?.name !== 'generic' || !view.endpoint || typeof view.endpoint !== 'object' || view.type !== EndpointType.Browse) {
        yt2.getLogger().error('[youtube2] Error fetching artist info for Now Playing plugin: invalid URI');
        return null;
      }
      channelId = (view.endpoint as BrowseEndpoint).payload.browseId;
    }
    else {
      channelId = payload?.channelId || null;
    }
    if (!channelId) {
      yt2.getLogger().error('[youtube2] Not fetching artist info for Now Playing plugin: no channel ID available');
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
      yt2.getLogger().error('[youtube2] Error fetching artist info for Now Playing plugin: no data');
      return null;
    }
    if (!artistName && !channelData.title) {
      yt2.getLogger().error('[youtube2] Error fetching artist info for Now Playing plugin: data is missing name');
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
