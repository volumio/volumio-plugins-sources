'use strict';

const SongParser = require(__dirname + '/song');

class VideoParser extends SongParser {

  getItemUri(data) {
    return 'ytmusic/video@videoId=' + encodeURIComponent(data.id);
  }
}

module.exports = VideoParser;
