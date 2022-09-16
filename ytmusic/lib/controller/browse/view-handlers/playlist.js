'use strict';

const libQ = require('kew');
const ytmusic = require(ytmusicPluginLibRoot + '/ytmusic');
const FeedViewHandler = require(__dirname + '/feed');

class PlaylistViewHandler extends FeedViewHandler {

  async getContents() {
    const view = this.getCurrentView();
    const model = this.getModel('playlist');
    return model.getPlaylist(decodeURIComponent(view.playlistId), {
      loadAll: !!ytmusic.getConfigValue('loadFullPlaylists', false),
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
    model.getPlaylist(decodeURIComponent(view.playlistId), {
      loadAll: !!ytmusic.getConfigValue('loadFullPlaylists', false)
    }).then((playlist) => {
      const section = playlist?.sections?.[0];
      defer.resolve(this.getTracksOnExplodeFromSection(section));
    })
      .catch((error) => {
        defer.reject(error);
      });

    return defer.promise;
  }
}

module.exports = PlaylistViewHandler;
