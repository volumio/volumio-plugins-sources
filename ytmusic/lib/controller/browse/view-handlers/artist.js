'use strict';

const libQ = require('kew');
const FeedViewHandler = require(__dirname + '/feed');

class ArtistViewHandler extends FeedViewHandler {

  async getContents() {
    const view = this.getCurrentView();
    const model = this.getModel('artist');
    return model.getArtist(decodeURIComponent(view.artistId));
  }

  getTracksOnExplode() {
    const defer = libQ.defer();

    const view = this.getCurrentView();
    const model = this.getModel('artist');
    model.getPlayContents(decodeURIComponent(view.artistId)).then((contents) => {
      defer.resolve(this.getTracksOnExplodeFromSection(contents));
    })
      .catch((error) => {
        defer.reject(error);
      });

    return defer.promise;
  }
}

module.exports = ArtistViewHandler;
