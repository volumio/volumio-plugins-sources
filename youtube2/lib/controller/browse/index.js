'use strict';

const TrackHelper = require('../../helper/track');
const yt2 = require('../../youtube2');
const ViewHandlerFactory = require('./view-handlers/factory');

class BrowseController {

  /* 
   *  uri follows a hierarchical view structure, starting with 'youtube2'.
   * - If nothing follows 'youtube2', the view would be 'root'.
   * 
   * After 'youtube2/', the uri consists of segments representing the following views:
   * - generic[@endpoint=...]
   * - playlist[@endpoint=...]
   * - search[@query=...] | [@endpoint=...[@continuation=...]]
   * - (Supporting view) optionSelection[@option=...] | [@fromContinuationBundle=...@continuationBundle=...]
   * ...
   * 
   */
  async browseUri(uri) {
    yt2.getLogger().info('[youtube2-browse] browseUri(' + uri + ')');

    const handler = ViewHandlerFactory.getHandler(uri);
    try {
      return handler.browse();
    } catch (error) {
      yt2.getLogger().error(yt2.getErrorMessage('', error, true));
      throw error;
    }
  }

  /**
   * Explodable uris:
   * - video[@explodeTrackData=...]
   * - playlist[@endpoint=...]
   * - generic[@endpoint=...]
   * 
   * Legacy (pre v1.0) uris:
   * - video[@videoId=...][@fromPlaylistId=...]
   * - videos[@playlistId=...]
   * - playlists[@channelId=...]
   * 
   * Legacy uris will be converted to current format
   */
  async explodeUri(uri) {
    yt2.getLogger().info('[youtube2-browse] explodeUri(' + uri + ')');

    if (!TrackHelper.validateExplodeUri(uri)) {
      // Try convert from legacy
      const convertedUri = await TrackHelper.convertLegacyExplodeUri(uri);
      if (!convertedUri) {
        yt2.getLogger().error(`[youtube2-browse] Could not explode URI: ${uri}`);
        yt2.toast('error', yt2.getI18n('YOUTUBE2_ERR_INVALID_URI'));
        throw Error(yt2.getI18n('YOUTUBE2_ERR_INVALID_URI'));
      }
      yt2.getLogger().info(`[youtube2-browse] Converted legacy explode URI to: ${ convertedUri }`);
      return this.explodeUri(convertedUri);
    }
     
    const handler = ViewHandlerFactory.getHandler(uri);
    try {
      return handler.explode();
    } catch (error) {
      yt2.getLogger().error(yt2.getErrorMessage('', error, true));
      throw Error(error);
    }
  }

}

module.exports = BrowseController;
