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
    const songParser = this.getParser('song');
    const videoParser = this.getParser('video');
    model.getPlayContents(decodeURIComponent(view.artistId)).then((contents) => {
      const items = contents.contents?.filter((item) => item.type === 'song' || item.type === 'video')
        .map((item) => {
          const parser = item.type === 'song' ? songParser : videoParser;
          return parser.getExplodeTrackData(item);
        }) || [];
        
      // TODO: add autoplay context to uri (might have to refactor to get the 'watch' endpoint)

      defer.resolve(items);
    })
      .catch((error) => {
        defer.reject(error);
      });

    return defer.promise;
  }
}

module.exports = ArtistViewHandler;
