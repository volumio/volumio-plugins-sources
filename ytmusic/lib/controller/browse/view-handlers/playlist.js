'use strict';

const libQ = require('kew');
const FeedViewHandler = require(__dirname + '/feed');

class PlaylistViewHandler extends FeedViewHandler {

  async getContents() {
    const view = this.getCurrentView();
    const model = this.getModel('playlist');
    return model.getPlaylist(decodeURIComponent(view.playlistId), {
      continuation: view.continuation ? JSON.parse(decodeURIComponent(view.continuation)) : null
    });
  }

  getTracksOnExplode() {
    const view = this.getCurrentView();
    if (!view.playlistId) {
      return libQ.reject("Operation not supported");
    }

    const defer = libQ.defer();
    const model = this.getModel('playlist');
    const songParser = this.getParser('song');
    const videoParser = this.getParser('video');
    model.getPlaylist(decodeURIComponent(view.playlistId)).then((playlist) => {
      const items = playlist.sections?.[0]?.contents?.filter((content) => content.type === 'song' || content.type === 'video')
        .map((item) => {
          const parser = item.type === 'song' ? songParser : videoParser;
          return parser.getExplodeTrackData(item);
        }) || [];

      // TODO: add autoplay context to uri (playlistId, continuation...)
      
      defer.resolve(items);
    })
      .catch((error) => {
        defer.reject(error);
      });

    return defer.promise;
  }
}

module.exports = PlaylistViewHandler;
