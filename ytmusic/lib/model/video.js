'use strict';

const { InnerTubeParser } = require("./innertube");
const BaseModel = require(__dirname + '/base');

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

class VideoModel extends BaseModel {

  async getPlaybackData(videoId, playlistId) {
    const innerTube = this.getInnerTube();
    const upNextInfo = await this.getInfoByUpNext(videoId);
    const playerInfo = await innerTube.music.getInfo(videoId, playlistId);
    const streamData = this._extractStreamDataFromPlayerInfo(playerInfo);

    return {
      videoInfo: upNextInfo,
      stream: streamData,
      addToHistory: () => {
        return playerInfo.addToWatchHistory();
      }
    };
  }

  async getInfoByUpNext(videoId) {
    const innerTube = this.getInnerTube();
    const upNext = await innerTube.music.getUpNext(videoId);
    const data = upNext?.contents?.find((data) => data.video_id === videoId);

    return InnerTubeParser.parseItem(data);
  }

  _extractStreamDataFromPlayerInfo(info) {
    
    /** TODO: InnerTube -> VideoInfo. Throw error on these conditions.
     if (this.playability_status === 'UNPLAYABLE')
     return stream.emit('error', new InnertubeError('Video is unplayable', { video: this, error_type: 'UNPLAYABLE' }));
     if (this.playability_status === 'LOGIN_REQUIRED')
     return stream.emit('error', new InnertubeError('Video is login required', { video: this, error_type: 'LOGIN_REQUIRED' }));
     if (!this.streaming_data)
     return stream.emit('error', new InnertubeError('Streaming data not available.', { video: this, error_type: 'NO_STREAMING_DATA' }));
     
     */
   
    const format = this._chooseFormat(info, BEST_AUDIO_FORMAT);
    
    if (format) {
      const innerTube = this.getInnerTube();
      const audioBitrate = ITAG_TO_BITRATE[format.itag];
      return {
        url: format.decipher(innerTube.session.player),
        mimeType: format.mime_type,
        bitrate: audioBitrate ? audioBitrate + ' kbps' : null,
        sampleRate: format.audio_sample_rate,
        channels: format.audio_channels,
      };
    }

    return null;
  }

  // Adapted from YouTube.js `youtube#VideoInfo` parser class. IMO this function
  // should be added to `ytmusic#TrackInfo` which `Music#getInfo()` returns.
  _chooseFormat(info, options) {
    if (!info?.streaming_data)
      throw new Error('Streaming data not available', { video_id: info?.basic_info.id });

    const formats = [
      ...(info.streaming_data.formats || []),
      ...(info.streaming_data.adaptive_formats || [])
    ];

    const requires_audio = options.type ? options.type.includes('audio') : true;
    const requires_video = options.type ? options.type.includes('video') : true;
    const quality = options.quality || '360p';

    let best_width = -1;

    const is_best = [ 'best', 'bestefficiency' ].includes(quality);
    const use_most_efficient = quality !== 'best';

    let candidates = formats.filter((format) => {
      if (requires_audio && !format.has_audio)
        return false;
      if (requires_video && !format.has_video)
        return false;
      if (options.format !== 'any' && !format.mime_type.includes(options.format || 'mp4'))
        return false;
      if (!is_best && format.quality_label !== quality)
        return false;
      if (best_width < format.width)
        best_width = format.width;
      return true;
    });

    if (!candidates.length) {
      throw new Error('No matching formats found', {
        options
      });
    }

    if (is_best && requires_video)
      candidates = candidates.filter((format) => format.width === best_width);

    if (requires_audio && !requires_video) {
      const audio_only = candidates.filter((format) => !format.has_video);
      if (audio_only.length > 0) {
        candidates = audio_only;
      }
    }

    if (use_most_efficient) {
      // Sort by bitrate (lower is better)
      candidates.sort((a, b) => a.bitrate - b.bitrate);
    } else {
      // Sort by bitrate (higher is better)
      candidates.sort((a, b) => b.bitrate - a.bitrate);
    }

    return candidates[0];
  }
}

module.exports = VideoModel;
