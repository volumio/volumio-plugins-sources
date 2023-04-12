'use strict';

const BaseParser = require('./base');

class VideoParser extends BaseParser {

  parseToListItem(data) {
    const explodeTrackData = this.getExplodeTrackData(data);
    const item = {
      service: 'youtube2',
      type: 'song',
      title: explodeTrackData.title,
      artist: explodeTrackData.artist,
      albumart: explodeTrackData.albumart,
      duration: data.duration,
      uri: 'youtube2/video@explodeTrackData=' + encodeURIComponent(JSON.stringify(explodeTrackData))
    };

    return item;
  }

  // Creates a bundle that contains the data needed by explode() to 
  // generate the final exploded item.
  getExplodeTrackData(data) {
    const track = {
      title: data.title,
      artist: data.author?.name || data.viewCount,
      albumart: data.thumbnail,
      endpoint: data.endpoint // watch endpoint
    };
   
    return track;
  }
}

module.exports = VideoParser;
