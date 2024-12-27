import fetch from 'node-fetch';
import { AbortSignal } from 'abort-controller';
import type Innertube from 'volumio-youtubei.js';
import * as InnertubeLib from 'volumio-youtubei.js';
import { type VideoInfo as InnertubeVideoInfo } from 'volumio-youtubei.js/dist/src/parser/youtube/index.js';
import type Format from 'volumio-youtubei.js/dist/src/parser/classes/misc/Format.js';
import { DataError, type Logger, type Video } from 'yt-cast-receiver';
import ytcr from './YTCRContext.js';
import InnertubeLoader from './InnertubeLoader.js';

// https://gist.github.com/sidneys/7095afe4da4ae58694d128b1034e01e2
const ITAG_TO_BITRATE = {
  '139': '48',
  '140': '128',
  '141': '256',
  '171': '128',
  '249': 'VBR 50',
  '250': 'VBR 70',
  '251': 'VBR 160',
  '774': 'VBR 256'
} as Record<string, string>;

const BEST_AUDIO_FORMAT = {
  type: 'audio',
  format: 'any',
  quality: 'best'
} as InnertubeLib.Types.FormatOptions;

interface BasicInfo {
  id: string;
  src?: 'yt' | 'ytmusic';
  title?: string;
  channel?: string;
  artist?: string;
  album?: string;
  isLive?: boolean;
}

export interface VideoInfo extends BasicInfo {
  errMsg?: string;
  thumbnail?: string;
  isLive?: boolean;
  streamUrl?: string | null;
  duration?: number;
  bitrate?: string;
  samplerate?: number;
  channels?: number;
  streamExpires?: Date;
}

interface StreamInfo {
  url: string | null;
  mimeType?: string;
  bitrate?: string | null;
  sampleRate?: number;
  channels?: number;
}

export default class VideoLoader {

  #logger: Logger;
  #defaultInnertubeLoader: InnertubeLoader;
  #tvInnertubeLoader: InnertubeLoader;

  constructor(logger: Logger) {
    this.#logger = logger;
    this.#defaultInnertubeLoader = new InnertubeLoader(this.#logger);
    this.#tvInnertubeLoader = new InnertubeLoader(this.#logger, this.#setTVClientContext.bind(this));
  }

  async #getInnertubeInstances() {
    return {
      defaultInnertube: (await this.#defaultInnertubeLoader.getInstance()).innertube,
      tvInnertube: (await this.#tvInnertubeLoader.getInstance()).innertube
    };
  }

  #setTVClientContext(innertube: Innertube) {
    innertube.session.context.client = {
      ...innertube.session.context.client,
      clientName: 'TVHTML5',
      clientVersion: '7.20230405.08.01',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36; SMART-TV; Tizen 4.0,gzip(gfe)'
    };
  }

  refreshI18nConfig() {
    this.#defaultInnertubeLoader.applyI18nConfig();
    this.#tvInnertubeLoader.applyI18nConfig();
  }

  async getInfo(video: Video, abortSignal: AbortSignal): Promise<VideoInfo> {
    const { defaultInnertube, tvInnertube } = await this.#getInnertubeInstances();
    
    const checkAbortSignal = () => {
      if (abortSignal.aborted) {
        const msg = `VideoLoader.getInfo() aborted for video Id: ${video.id}`;
        this.#logger.debug(`[ytcr] ${msg}.`);
        const abortError = Error(msg);
        abortError.name = 'AbortError';
        throw abortError;
      }
    };

    this.#logger.debug(`[ytcr] VideoLoader.getInfo: ${video.id}`);

    checkAbortSignal();

    // Configure Innertube instances
    const __prepInnertubeAndPayload = (innertube: Innertube) => {
      const cpn = InnertubeLib.Utils.generateRandomString(16);

      // Prepare request payload
      const payload = {
        videoId: video.id,
        enableMdxAutoplay: true,
        isMdxPlayback: true,
        playbackContext: {
          contentPlaybackContext: {
            signatureTimestamp: tvInnertube.session.player?.sts || 0
          }
        }
      } as any;
      if (video.context?.playlistId) {
        payload.playlistId = video.context.playlistId;
      }
      if (video.context?.params) {
        payload.params = video.context.params;
      }
      if (video.context?.index !== undefined) {
        payload.index = video.context.index;
      }

      // Modify innertube's session context to include `ctt` param
      if (video.context?.ctt) {
        innertube.session.context.user = {
          enableSafetyMode: false,
          lockedSafetyMode: false,
          credentialTransferTokens: [
            {
              'scope': 'VIDEO',
              'token': video.context?.ctt
            }
          ]
        } as any;
      }
      else {
        delete (innertube.session.context.user as any)?.credentialTransferTokens;
      }

      return [payload, cpn];
    }

    const [defaultPayload, cpn] = __prepInnertubeAndPayload(defaultInnertube);
    const [tvPayload] = __prepInnertubeAndPayload(tvInnertube);

    try {
      // There are two endpoints we need to fetch data from:
      // 1. '/next': for metadata (title, channel for video, artist / album for music...)
      // 2. '/player': for streaming data

      const nextResponse = await tvInnertube.actions.execute('/next', tvPayload) as any;
      checkAbortSignal();

      let basicInfo: BasicInfo | null = null;

      // We cannot use innertube to parse `nextResponse`, because it doesn't
      // Have `SingleColumnWatchNextResults` parser class. We would have to do it ourselves.

      const singleColumnContents = nextResponse.data?.contents?.singleColumnWatchNextResults?.
        results?.results?.contents?.[0]?.itemSectionRenderer?.contents?.[0];

      const videoMetadata = singleColumnContents?.videoMetadataRenderer;
      const songMetadata = singleColumnContents?.musicWatchMetadataRenderer;

      if (videoMetadata) {
        basicInfo = {
          id: video.id,
          src: 'yt',
          title: new InnertubeLib.Misc.Text(videoMetadata.title).toString(),
          channel: new InnertubeLib.Misc.Text(videoMetadata.owner?.videoOwnerRenderer?.title).toString(),
          isLive: videoMetadata.viewCount.videoViewCountRenderer.isLive
        };
      }
      else if (songMetadata) {
        basicInfo = {
          id: video.id,
          src: 'ytmusic',
          title: new InnertubeLib.Misc.Text(songMetadata.title).toString(),
          artist: new InnertubeLib.Misc.Text(songMetadata.byline).toString(),
          album: songMetadata.albumName ? new InnertubeLib.Misc.Text(songMetadata.albumName).toString() : ''
        };
      }

      if (!basicInfo) {
        throw new DataError('Metadata not found in response');
      }

      // Fetch response from '/player' endpoint. But first, specify client in payload.
      // Innertube will modify 'context.client' before submitting request.
      if (basicInfo.src === 'ytmusic') {
        // YouTube Music
        defaultPayload.client = 'YTMUSIC';
      }
      else if (!basicInfo.isLive) {
        // For non-live streams, we must use 'TV' client, otherwise streams will return 403 error.
        // For livestreams, we can use default 'WEB' client. If we use 'TV' client, we will only get
        // DASH manifest URL - what we need is the HLS manifest URL.
        defaultPayload.client = 'TV';
      }
      const playerResponse = await defaultInnertube.actions.execute('/player', defaultPayload) as any;
      checkAbortSignal();

      // Wrap it in innertube VideoInfo.
      const innertubeVideoInfo = new InnertubeLib.YT.VideoInfo([ playerResponse ], defaultInnertube.actions, cpn);

      const thumbnail = this.#getThumbnail(innertubeVideoInfo.basic_info.thumbnail);
      const isLive = !!innertubeVideoInfo.basic_info.is_live;

      // Retrieve stream info
      let playable = false;
      let errMsg = null;
      let streamInfo = null;
      if (innertubeVideoInfo.playability_status?.status === 'UNPLAYABLE') {
        if (innertubeVideoInfo.has_trailer) {
          const trailerInfo = innertubeVideoInfo.getTrailerInfo();
          if (trailerInfo) {
            streamInfo = await this.#chooseFormat(trailerInfo);
          }
        }
        else {
          errMsg = innertubeVideoInfo.playability_status.reason;
        }
      }
      else if (!isLive) {
        streamInfo = await this.#chooseFormat(innertubeVideoInfo);
      }
      else if (innertubeVideoInfo.streaming_data?.hls_manifest_url) {
        const targetQuality = ytcr.getConfigValue('liveStreamQuality', 'auto');
        streamInfo = {
          url: await this.#getStreamUrlFromHLS(innertubeVideoInfo.streaming_data.hls_manifest_url, targetQuality)
        };
      }

      playable = !!streamInfo?.url;

      if (!playable && !errMsg) {
        errMsg = ytcr.getI18n('YTCR_STREAM_NOT_FOUND');
      }

      checkAbortSignal();

      return {
        ...basicInfo,
        errMsg: errMsg || undefined,
        thumbnail,
        isLive,
        streamUrl: streamInfo?.url,
        duration: innertubeVideoInfo.basic_info.duration || 0,
        bitrate: streamInfo?.bitrate || undefined,
        samplerate: streamInfo?.sampleRate,
        channels: streamInfo?.channels,
        streamExpires: innertubeVideoInfo.streaming_data?.expires
      };

    }
    catch (error: any) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      this.#logger.error(`[ytcr] Error in VideoLoader.getInfo(${video.id}):`, error);
      return {
        id: video.id,
        errMsg: error instanceof Error ? error.message : '(Check logs for errors)'
      };
    }
  }

  #getThumbnail(data: any): string {
    const url = data?.[0]?.url;
    if (url?.startsWith('//')) {
      return `https:${url}`;
    }
    return url;
  }

  async #chooseFormat(videoInfo: InnertubeVideoInfo) {
    const { defaultInnertube: innertube } = await this.#getInnertubeInstances();

    const preferredFormat = {
      ...BEST_AUDIO_FORMAT
    };
    const prefetch = ytcr.getConfigValue('prefetch', true);
    const preferOpus = prefetch && ytcr.getConfigValue('preferOpus', false);
    if (preferOpus) {
      this.#logger.debug('[ytcr] Preferred format is Opus');
      preferredFormat.format = 'opus';
    }
    let format;
    try {
      format = videoInfo?.chooseFormat(preferredFormat);
    }
    catch (error) {
      if (preferOpus && videoInfo) {
        this.#logger.debug('[ytcr] No matching format for Opus. Falling back to any audio format ...');
        try {
          format = videoInfo.chooseFormat(BEST_AUDIO_FORMAT);
        }
        catch (error) {
          this.#logger.debug('[ytcr] Failed to obtain audio format:', error);
          format = null;
        }
      }
      else {
        throw error;
      }
    }

    const streamUrl = format ? format.decipher(innertube.session.player) : null;
    const streamData = format ? { ...format, url: streamUrl } as Format : null;
    if (streamData) {
      return this.#parseStreamData(streamData);
    }
    return null;
  }

  #parseStreamData(data: Format): StreamInfo {
    const audioBitrate = ITAG_TO_BITRATE[`${data.itag}`];

    return {
      url: data.url || null,
      mimeType: data.mime_type,
      bitrate: audioBitrate ? `${audioBitrate} kbps` : null,
      sampleRate: data.audio_sample_rate,
      channels: data.audio_channels
    };
  }

  async #getStreamUrlFromHLS(manifestUrl: string, targetQuality?: string): Promise<string | null> {
    if (!targetQuality || targetQuality === 'auto') {
      return manifestUrl;
    }

    const res = await fetch(manifestUrl);
    const manifestContents = await res.text();

    // Match Resolution and Url
    const regex = /#EXT-X-STREAM-INF.*RESOLUTION=(\d+x\d+).*[\r\n](.+)/gm;

    const playlistVariants = [];

    // Modified from regex101's code generator :)
    let m;
    while ((m = regex.exec(manifestContents)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      const variant: any = {};
      playlistVariants.push(variant);

      m.forEach((match, groupIndex) => {
        if (groupIndex === 1) { // Resolution
          variant.quality = `${match.split('x')[1]}p`;
        }
        if (groupIndex === 2) {
          variant.url = match;
        }
      });
    }

    // Find matching variant or closest one that is lower than targetQuality
    const targetQualityInt = parseInt(targetQuality);
    const diffs = playlistVariants.map((variant) => ({
      variant,
      qualityDelta: targetQualityInt - parseInt(variant.quality)
    }));
    const closest = diffs.filter((v) => v.qualityDelta >= 0).sort((v1, v2) => v1.qualityDelta - v2.qualityDelta)[0];

    return closest?.variant.url || playlistVariants[0]?.url || null;
  }
}
