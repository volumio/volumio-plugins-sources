import ytmusic from '../../YTMusicContext';
import ExplodeHelper from '../../util/ExplodeHelper';
import BaseViewHandler from './view-handlers/BaseViewHandler';
import { QueueItem } from './view-handlers/ExplodableViewHandler';
import View from './view-handlers/View';
import { RenderedPage } from './view-handlers/ViewHandler';
import ViewHandlerFactory from './view-handlers/ViewHandlerFactory';

export default class BrowseController {

  /*
   *  Uri follows a hierarchical view structure, starting with 'ytmusic'.
   *  ytmusic/[viewName@param1=....@param2=...]/[viewName@param1=...@param2=...]
   *
   *  See ViewHandlerFactory for defined Views. See corresponding ViewHandler
   *  for View params.
   */
  async browseUri(uri: string): Promise<RenderedPage> {
    ytmusic.getLogger().info(`[ytmusic-browse] browseUri: ${uri}`);

    const handler = this.#getHandler(uri);
    try {
      return await handler.browse();
    }
    catch (error: any) {
      ytmusic.getLogger().error(ytmusic.getErrorMessage('', error, true));
      throw error;
    }
  }

  /**
   * Explodable uris:
   * - video[@explodeTrackData=...]
   * - song[@explodeTrackData=...]
   * - playlist[@endpoints=...]
   * - generic[@endpoint=...]
   *
   * Legacy (pre v1.0) uris:
   * - song[@explodeTrackData=...]
   * - video[@explodeTrackData=...]
   * - album[@albumId=...]
   * - artist[@artistId=...]
   * - playlist[@playlistId=...]
   * - generic[@endpoint=...] (endpoint must be of type 'watch_playlist')
   *
   * Legacy uris will be converted to current format
   */
  async explodeUri(uri: string): Promise<QueueItem[]> {
    ytmusic.getLogger().info(`[ytmusic-browse] explodeUri: ${uri}`);

    if (!ExplodeHelper.validateExplodeUri(uri)) {
      // Try convert from legacy
      const convertedUri = await ExplodeHelper.convertLegacyExplodeUri(uri);
      if (!convertedUri) {
        ytmusic.getLogger().error(`[ytmusic-browse] Could not explode URI: ${uri}`);
        ytmusic.toast('error', ytmusic.getI18n('YTMUSIC_ERR_INVALID_URI'));
        throw Error(ytmusic.getI18n('YTMUSIC_ERR_INVALID_URI'));
      }
      ytmusic.getLogger().info(`[ytmusic-browse] Converted legacy explode URI to: ${convertedUri}`);
      return this.explodeUri(convertedUri);
    }

    const handler = this.#getHandler(uri);
    try {
      return await handler.explode();
    }
    catch (error: any) {
      ytmusic.getLogger().error(ytmusic.getErrorMessage('', error, true));
      throw error;
    }
  }

  #getHandler<V extends View>(uri: string): BaseViewHandler<V> {
    return ViewHandlerFactory.getHandler(uri);
  }
}
