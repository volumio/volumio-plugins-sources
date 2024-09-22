import Innertube, { YT, FormatOptions } from 'volumio-youtubei.js';
import fetch from 'node-fetch';
import yt2 from '../YouTube2Context';
import VideoPlaybackInfo from '../types/VideoPlaybackInfo';
import { BaseModel } from './BaseModel';
import InnertubeResultParser from './InnertubeResultParser';

// https://gist.github.com/sidneys/7095afe4da4ae58694d128b1034e01e2
const ITAG_TO_BITRATE: Record<string, string> = {
  '139': '48',
  '140': '128',
  '141': '256',
  '171': '128',
  '249': '50',
  '250': '70',
  '251': '160'
};

const BEST_AUDIO_FORMAT: FormatOptions = {
  type: 'audio',
  format: 'any',
  quality: 'best'
};

interface HLSPlaylistVariant {
  quality?: string;
  url?: string;
}

export default class VideoModel extends BaseModel {

  async getPlaybackInfo(videoId: string): Promise<VideoPlaybackInfo | null> {
    const { innertube } = await this.getInnertube();

    try {
      const info = await innertube.getBasicInfo(videoId);
      const basicInfo = info.basic_info;

      const result: VideoPlaybackInfo = {
        type: 'video',
        title: basicInfo.title,
        author: {
          channelId: basicInfo.channel_id,
          name: basicInfo.author
        },
        description: basicInfo.short_description,
        thumbnail: InnertubeResultParser.parseThumbnail(basicInfo.thumbnail) || '',
        isLive: !!basicInfo.is_live,
        duration: basicInfo.duration,
        addToHistory: () => {
          return info?.addToWatchHistory();
        }
      };

      if (info.playability_status.status === 'UNPLAYABLE') {
        // Check if this video has a trailer (non-purchased movies / films)
        if (info.has_trailer) {
          const trailerInfo = info.getTrailerInfo();
          if (trailerInfo) {
            result.stream = this.#chooseFormat(innertube, trailerInfo);
          }
        }
        else {
          throw Error(info.playability_status.reason);
        }
      }
      else if (!result.isLive) {
        result.stream = this.#chooseFormat(innertube, info);
      }
      else {
        const hlsManifestUrl = info.streaming_data?.hls_manifest_url;
        const streamUrlFromHLS = hlsManifestUrl ? await this.#getStreamUrlFromHLS(hlsManifestUrl, yt2.getConfigValue('liveStreamQuality')) : null;
        result.stream = streamUrlFromHLS ? { url: streamUrlFromHLS } : null;
      }

      return result;

    }
    catch (error) {
      yt2.getLogger().error(yt2.getErrorMessage(`[youtube2] Error in VideoModel.getInfo(${videoId}): `, error));
      return null;
    }
  }

  #chooseFormat(innertube: Innertube, videoInfo: YT.VideoInfo): VideoPlaybackInfo['stream'] | null {
    const format = videoInfo?.chooseFormat(BEST_AUDIO_FORMAT);
    const streamUrl = format ? format.decipher(innertube.session.player) : null;
    const streamData = format ? { ...format, url: streamUrl } : null;
    return this.#parseStreamData(streamData);
  }

  #parseStreamData(data: any): VideoPlaybackInfo['stream'] | null {
    if (!data) {
      return null;
    }

    const audioBitrate = ITAG_TO_BITRATE[data.itag];

    return {
      url: data.url,
      mimeType: data.mime_type,
      bitrate: audioBitrate ? `${audioBitrate} kbps` : null,
      sampleRate: data.audio_sample_rate,
      channels: data.audio_channels
    };
  }

  async #getStreamUrlFromHLS(manifestUrl: string, targetQuality: string) {
    if (!manifestUrl) {
      return null;
    }

    if (!targetQuality || targetQuality === 'auto') {
      return manifestUrl;
    }

    const res = await fetch(manifestUrl);
    const manifestContents = await res.text();

    // Match Resolution and Url
    const regex = /#EXT-X-STREAM-INF.*RESOLUTION=(\d+x\d+).*[\r\n](.+)/gm;

    const playlistVariants: HLSPlaylistVariant[] = [];

    // Modified from regex101's code generator :)
    let m: any;
    while ((m = regex.exec(manifestContents)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      const variant: HLSPlaylistVariant = {};
      playlistVariants.push(variant);

      m.forEach((match: string, groupIndex: number) => {
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
      qualityDelta: targetQualityInt - (variant.quality ? parseInt(variant.quality) : 0)
    }));
    const closest = diffs.filter((v) => v.qualityDelta >= 0).sort((v1, v2) => v1.qualityDelta - v2.qualityDelta)[0];

    return closest?.variant.url || playlistVariants[0]?.url || null;
  }
}
