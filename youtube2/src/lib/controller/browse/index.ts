import yt2 from '../../YouTube2Context';
import ExplodeHelper from '../../util/ExplodeHelper';
import BaseViewHandler from './view-handlers/BaseViewHandler';
import { QueueItem } from './view-handlers/ExplodableViewHandler';
import View from './view-handlers/View';
import { RenderedPage } from './view-handlers/ViewHandler';
import ViewHandlerFactory from './view-handlers/ViewHandlerFactory';

export default class BrowseController {

  /*
   *  Uri follows a hierarchical view structure, starting with 'youtube2'.
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
  async browseUri(uri: string): Promise<RenderedPage> {
    yt2.getLogger().info(`[youtube2-browse] browseUri: ${uri}`);

    const handler = this.#getHandler(uri);
    try {
      return await handler.browse();
    }
    catch (error: any) {
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
  async explodeUri(uri: string): Promise<QueueItem[]> {
    yt2.getLogger().info(`[youtube2-browse] explodeUri: ${uri}`);

    if (!ExplodeHelper.validateExplodeUri(uri)) {
      // Try convert from legacy
      const convertedUri = await ExplodeHelper.convertLegacyExplodeUri(uri);
      if (!convertedUri) {
        yt2.getLogger().error(`[youtube2-browse] Could not explode URI: ${uri}`);
        yt2.toast('error', yt2.getI18n('YOUTUBE2_ERR_INVALID_URI'));
        throw Error(yt2.getI18n('YOUTUBE2_ERR_INVALID_URI'));
      }
      yt2.getLogger().info(`[youtube2-browse] Converted legacy explode URI to: ${convertedUri}`);
      return this.explodeUri(convertedUri);
    }

    const handler = this.#getHandler(uri);
    try {
      return await handler.explode();
    }
    catch (error: any) {
      yt2.getLogger().error(yt2.getErrorMessage('', error, true));
      throw error;
    }
  }

  #getHandler<V extends View>(uri: string): BaseViewHandler<V> {
    return ViewHandlerFactory.getHandler(uri);
  }
}
