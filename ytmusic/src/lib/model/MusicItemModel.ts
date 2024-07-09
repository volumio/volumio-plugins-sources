import ytmusic from '../YTMusicContext';
import Innertube, { FormatOptions, YTNodes, Endpoints as YTEndpoints, Utils as YTUtils, YTMusic, Parser } from 'volumio-youtubei.js';
import { BaseModel } from './BaseModel';
import InnertubeResultParser from './InnertubeResultParser';
import Endpoint, { EndpointType } from '../types/Endpoint';
import MusicItemPlaybackInfo from '../types/MusicItemPlaybackInfo';
import { ContentItem } from '../types';
import EndpointHelper from '../util/EndpointHelper';

// https://gist.github.com/sidneys/7095afe4da4ae58694d128b1034e01e2
// https://gist.github.com/MartinEesmaa/2f4b261cb90a47e9c41ba115a011a4aa
const ITAG_TO_BITRATE: Record<string, string> = {
  '139': '48',
  '140': '128',
  '141': '256',
  '171': '128',
  '249': 'VBR 50',
  '250': 'VBR 70',
  '251': 'VBR 160',
  '774': 'VBR 256'
};

const BEST_AUDIO_FORMAT: FormatOptions = {
  type: 'audio',
  format: 'any',
  quality: 'best'
};

export default class MusicItemModel extends BaseModel {

  async getPlaybackInfo(endpoint: Endpoint): Promise<MusicItemPlaybackInfo | null> {
    if (!EndpointHelper.isType(endpoint, EndpointType.Watch) || !endpoint.payload.videoId) {
      throw Error('Invalid endpoint');
    }
    const { innertube } = await this.getInnertube();
    const trackInfo = await this.#getTrackInfo(innertube, endpoint);
    const streamData = this.#extractStreamData(innertube, trackInfo);

    // `trackInfo` does not contain album info - need to obtain from item in Up Next tab.
    const infoFromUpNextTab = this.#getInfoFromUpNextTab(trackInfo, endpoint);
    let musicItem: ContentItem.MusicItem | null = null;
    let album: ContentItem.MusicItem['album'] | null = null;
    if (infoFromUpNextTab && (infoFromUpNextTab.type === 'video' || infoFromUpNextTab.type === 'song')) {
      musicItem = infoFromUpNextTab;
      album = musicItem.album;
    }

    // `trackInfo` sometimes ignores hl / gl (lang / region), so titles and such could be in wrong language.
    // Furthermore, the artist's channelId is possibly wrong for private uploads.
    // We return info from item in Up Next tab, while using trackInfo as fallback.
    let channelId: string | undefined;
    if (musicItem?.artists && musicItem.artists[0]?.channelId) {
      channelId = musicItem.artists[0].channelId;
    }
    else {
      channelId = trackInfo.basic_info.channel_id;
    }
    return {
      title: musicItem?.title || trackInfo.basic_info.title,
      artist: {
        channelId,
        name: musicItem?.artistText || trackInfo.basic_info.author
      },
      album: {
        albumId: album?.albumId,
        title: musicItem?.album?.title || album?.title
      },
      thumbnail: InnertubeResultParser.parseThumbnail(trackInfo.basic_info.thumbnail) || undefined,
      stream: streamData,
      duration: trackInfo.basic_info.duration,
      addToHistory: () => {
        return trackInfo.addToWatchHistory();
      },
      radioEndpoint: musicItem?.radioEndpoint
    };
  }

  // Based on Innertube.Music.#fetchInfoFromListItem(), which requires MusicTwoRowItem which we don't have.
  async #getTrackInfo(innertube: Innertube, endpoint: Endpoint) {
    const innertubeEndpoint = new YTNodes.NavigationEndpoint({});
    innertubeEndpoint.metadata.api_url = YTEndpoints.PlayerEndpoint.PATH;
    innertubeEndpoint.payload = YTEndpoints.PlayerEndpoint.build({
      video_id: endpoint.payload.videoId,
      playlist_id: endpoint.payload.playlistId,
      params: endpoint.payload.params,
      sts: innertube.session.player?.sts
    });

    const player_response = innertubeEndpoint.call(innertube.actions, {
      client: 'YTMUSIC',
      playbackContext: {
        contentPlaybackContext: {
          ...{
            signatureTimestamp: innertube.session.player?.sts
          }
        }
      }
    });

    const next_response = innertubeEndpoint.call(innertube.actions, {
      client: 'YTMUSIC',
      enablePersistentPlaylistPanel: true,
      override_endpoint: '/next'
    });

    const cpn = YTUtils.generateRandomString(16);

    const response = await Promise.all([ player_response, next_response ]);

    return new YTMusic.TrackInfo(response, innertube.actions, cpn);
  }

  #extractStreamData(innertube: Innertube, info: YTMusic.TrackInfo): MusicItemPlaybackInfo['stream'] | null {
    const preferredFormat = {
      ...BEST_AUDIO_FORMAT
    };
    const prefetch = ytmusic.getConfigValue('prefetch');
    const preferOpus = prefetch && ytmusic.getConfigValue('preferOpus');
    if (preferOpus) {
      ytmusic.getLogger().info('[ytmusic] Preferred format is Opus');
      preferredFormat.format = 'opus';
    }
    let format;
    try {
      format = info.chooseFormat(preferredFormat);
    }
    catch (error) {
      if (preferOpus && info) {
        ytmusic.getLogger().warn('[ytmusic] No matching format for Opus. Falling back to any audio format ...');
        try {
          format = info.chooseFormat(BEST_AUDIO_FORMAT);
        }
        catch (error) {
          ytmusic.getLogger().error('[ytmusic] Failed to obtain audio format:', error);
          format = null;
        }
      }
      else {
        throw error;
      }
    }

    if (format) {
      const audioBitrate = ITAG_TO_BITRATE[format.itag];
      return {
        url: format.decipher(innertube.session.player),
        mimeType: format.mime_type,
        bitrate: audioBitrate ? `${audioBitrate} kbps` : null,
        sampleRate: format.audio_sample_rate ? `${format.audio_sample_rate} kHz` : undefined,
        channels: format.audio_channels
      };
    }

    return null;
  }

  #getInfoFromUpNextTab(info: YTMusic.TrackInfo, endpoint: Endpoint) {
    const playlistPanel = info.page[1]?.contents_memo?.getType(YTNodes.PlaylistPanel).first();
    if (!playlistPanel) {
      return null;
    }
    const videoId = endpoint.payload.videoId;
    const match = playlistPanel.contents.find((data) => {
      if (data instanceof YTNodes.PlaylistPanelVideoWrapper) {
        if (data.primary?.video_id === videoId) {
          return true;
        }
        return data.counterpart?.find((item) => item.video_id === videoId);
      }
      else if (data instanceof YTNodes.PlaylistPanelVideo) {
        return data.video_id === videoId;
      }
    });
    return InnertubeResultParser.parseContentItem(match);
  }

  async #getLyricsId(videoId: string) {
    const { innertube } = await this.getInnertube();
    const response = await innertube.actions.execute('/next', {
      videoId,
      client: 'YTMUSIC_ANDROID'
    });
    const parsed = Parser.parseResponse(response.data);
    const tabs = parsed.contents_memo?.getType(YTNodes.Tab);
    const tab = tabs?.matchCondition((tab) => tab.endpoint.payload.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType === 'MUSIC_PAGE_TYPE_TRACK_LYRICS');
    if (!tab) {
      throw Error('Could not find lyrics tab.');
    }
    const lyricsId = tab.endpoint.payload.browseId;
    if (!lyricsId) {
      throw Error('No lyrics ID found in endpoint');
    }
    return lyricsId;
  }

  async getLyrics(videoId: string) {
    const { innertube } = await this.getInnertube();
    const lyricsId = await this.#getLyricsId(videoId);
    const payload = {
      browseId: lyricsId,
      client: 'YTMUSIC_ANDROID'
    };
    const response = await innertube.actions.execute('/browse', payload);
    const parsed = Parser.parseResponse(response.data);
    return InnertubeResultParser.parseLyrics(parsed);
  }
}
