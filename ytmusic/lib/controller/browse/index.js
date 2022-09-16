'use strict';

const libQ = require('kew');
const ytmusic = require(ytmusicPluginLibRoot + '/ytmusic');
const ViewHandlerFactory = require(__dirname + '/view-handlers/factory');

class BrowseController {

  /* 
   *  uri follows a hierarchical view structure, starting with 'ytmusic'.
   * - If nothing follows 'ytmusic', the view would be 'root'.
   * 
   * After 'ytmusic/', the uri consists of segments representing the following views:
   * - home
   * - explore
   * - library[@endpoint=...[@continuation=...]]
   * - album[@albumId=...]
   * - artist[@artistId=...]
   * - playlist[@playlistId=...][@continuation=...]
   * - generic[@endpoint=...[@continuation=...]]
   * - search[@query=...] | [@endpoint=...[@continuation=...]]
   * - (Supporting view) optionSelection[@option=...]
   * ...
   * 
   */
  browseUri(uri) {
    ytmusic.getLogger().info('[ytmusic-browse] browseUri(' + uri + ')');

    const defer = libQ.defer();

    const handler = ViewHandlerFactory.getHandler(uri);
    handler.browse().then((result) => {
      defer.resolve(result);
    })
      .fail((error) => {
        if (error.stack) { console.log(error.stack); }
        defer.reject(error);
      });

    return defer.promise;
  }

  /**
   * Explodable uris:
   * - song[@explodeTrackData=...]
   * - video[@explodeTrackData=...]
   * - album[@albumId=...]
   * - artist[@artistId=...]
   * - playlist[@playlistId=...]
   * - generic[@endpoint=...] (endpoint must be of type 'watch_playlist')
   */
  explodeUri(uri) {
    ytmusic.getLogger().info('[ytmusic-browse] explodeUri(' + uri + ')');

    const defer = libQ.defer();

    const handler = ViewHandlerFactory.getHandler(uri);
    handler.explode().then((result) => {
      defer.resolve(result);
    })
      .fail((error) => {
        if (error.stack) { console.log(error.stack); }
        defer.reject(error);
      });

    return defer.promise;
  }

}

module.exports = BrowseController;
