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

class VideoModel extends BaseModel {

  async getVideo(videoId) {
    const innerTube = this.getInnerTube();
    const upNext = await innerTube.music.getUpNext(videoId);
    const data = upNext?.contents?.find((data) => data.video_id === videoId);

    return InnerTubeParser.parseItem(data);
  }

  async getStreamData(videoId) {
    const innerTube = this.getInnerTube();
    const options = {
      type: 'audio',
      format: 'any',
      quality: 'best'
    }

    /** TODO: InnerTube -> VideoInfo. Throw error on these conditions.
      if (this.playability_status === 'UNPLAYABLE')
        return stream.emit('error', new InnertubeError('Video is unplayable', { video: this, error_type: 'UNPLAYABLE' }));
      if (this.playability_status === 'LOGIN_REQUIRED')
        return stream.emit('error', new InnertubeError('Video is login required', { video: this, error_type: 'LOGIN_REQUIRED' }));
      if (!this.streaming_data)
        return stream.emit('error', new InnertubeError('Streaming data not available.', { video: this, error_type: 'NO_STREAMING_DATA' }));
    
    */
    const format = await innerTube.getStreamingData(videoId, options);
    
    if (format) {
      const audioBitrate = ITAG_TO_BITRATE[format.itag];
      return {
        url: format.url,
        mimeType: format.mime_type,
        bitrate: audioBitrate ? audioBitrate + ' kbps' : null,
        sampleRate: format.audio_sample_rate,
        channels: format.audio_channels,
      };
    }

    return null;
  }
}

module.exports = VideoModel;
