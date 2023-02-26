'use strict';

const { InnerTubeParser } = require("./innertube");

const EndpointModel = require(__dirname + '/endpoint');

class ArtistModel extends EndpointModel {

  async getArtist(artistId) {
    const innerTube = this.getInnerTube();
    const artist = await innerTube.music.getArtist(artistId);
    
    const result = InnerTubeParser.parseFeed(artist, 'artist');
    result.header.id = artistId;
    return result;
  }

  async getPlayContents(artistId) {
    const innerTube = this.getInnerTube();
    const artist = await innerTube.music.getArtist(artistId);
    const playButton = artist?.header?.play_button;
    const endpoint = InnerTubeParser.sanitizeEndpoint(playButton?.endpoint);
    if (endpoint?.actionType === 'watch') {
      return this.getContents(endpoint);
    }
    throw new Error('Endpoint missing or invalid');
  }
}

module.exports = ArtistModel;
