'use strict';

const fetch = require('node-fetch');
const yt2 = require('../youtube2');
const { InnerTubeParser, InnerTubeBaseModel } = require('./innertube');

// https://gist.github.com/sidneys/7095afe4da4ae58694d128b1034e01e2
const ITAG_TO_BITRATE = {
  '139': '48',
  '140': '128',
  '141': '256',
  '171': '128',
  '249': '50',
  '250': '70',
  '251': '160',
};

const BEST_AUDIO_FORMAT = {
  type: 'audio',
  format: 'any',
  quality: 'best'
};

class VideoModel extends InnerTubeBaseModel {

  async getInfo(videoId) {
    const innerTube = this.getInnerTube();
    try {
      const info = await innerTube.getBasicInfo(videoId);
      const basicInfo = info.basic_info;

      const result = {
        title: basicInfo.title,
        author: {
          channelId: basicInfo.channel_id,
          name: basicInfo.author
        },
        thumbnail: InnerTubeParser.getThumbnail(basicInfo.thumbnail),
        isLive: !!basicInfo.is_live,
        addToHistory: () => {
          return info?.addToWatchHistory();
        }
      };

      if (info.playability_status.status === 'UNPLAYABLE') {
        // Check if this video has a trailer (non-purchased movies / films)
        if (info.has_trailer) {
          const trailerInfo = info.getTrailerInfo();
          result.stream = this.chooseFormat(trailerInfo);
        }
        else {
          throw Error(info.playability_status.reason);
        }
      }
      else if (!result.isLive) {
        result.stream = this.chooseFormat(info);
      }
      else {
        result.stream = {
          url: await this.getStreamUrlFromHLS(info.streaming_data?.hls_manifest_url, yt2.getConfigValue('liveStreamQuality', 'auto'))
        };
      }

      return result;
    } catch (error) {
      yt2.getLogger().error(yt2.getErrorMessage(`[youtube2] Error in VideoModel.getInfo(${videoId}): `, error));
      return null;
    }
  }

  chooseFormat(videoInfo) {
    const innerTube = this.getInnerTube();
    const format = videoInfo?.chooseFormat(BEST_AUDIO_FORMAT);
    const streamUrl = format ? format.decipher(innerTube.session.player) : null;
    const streamData = format ? { ...format, url: streamUrl } : null;
    return this.parseStreamData(streamData);
  }

  parseStreamData(data) {
    if (!data) {
      return null;
    }

    const audioBitrate = ITAG_TO_BITRATE[data.itag];

    return {
      url: data.url,
      mimeType: data.mime_type,
      bitrate: audioBitrate ? audioBitrate + ' kbps' : null,
      sampleRate: data.audio_sample_rate,
      channels: data.audio_channels
    };
  }

  async getStreamUrlFromHLS(manifestUrl, targetQuality) {
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

    const playlistVariants = [];

    // Modified from regex101's code generator :)
    let m;
    while ((m = regex.exec(manifestContents)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
  
      const variant = {};
      playlistVariants.push(variant);
  
      m.forEach((match, groupIndex) => {
        if (groupIndex === 1) {  // resolution
          variant.quality = match.split('x')[1] + 'p';
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

module.exports = VideoModel;
