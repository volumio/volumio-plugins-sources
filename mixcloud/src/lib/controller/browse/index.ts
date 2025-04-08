import mixcloud from '../../MixcloudContext';
import BaseViewHandler from './view-handlers/BaseViewHandler';
import { ExplodedTrackInfo } from './view-handlers/ExplodableViewHandler';
import View from './view-handlers/View';
import { RenderedPage } from './view-handlers/ViewHandler';
import ViewHandlerFactory from './view-handlers/ViewHandlerFactory';

export default class BrowseController {

  /**
   *  Uri follows a hierarchical view structure, starting with 'mixcloud'.
   * - If nothing follows 'mixcloud', the view would be 'root'.
   *
   * After 'mixcloud/', the uri consists of segments representing the following views:
   * - discover[@slug=...][@orderBy=...][@country=...]
   * - featured[@slug=...][@orderBy=...]
   * - user[@username=...]
   * - cloudcasts[@username=...[@orderBy=...]][@playlistId=...]
   * - cloudcast[@cloudcastId=...][@showMoreFromUser=1]
   * ...
   */
  async browseUri(uri: string): Promise<RenderedPage> {
    mixcloud.getLogger().info(`[mixcloud] browseUri: ${uri}`);

    const handler = this.#getHandler(uri);
    return handler.browse();
  }

  /**
   * Explodable uris:
   * - cloudcast[@cloudcastId=...][@owner=...]
   * - liveStream[@username=...]
   */
  explodeUri(uri: string): Promise<ExplodedTrackInfo[]> {
    mixcloud.getLogger().info(`[mixcloud] explodeUri: ${uri}`);

    const handler = this.#getHandler(uri);
    return handler.explode();
  }

  #getHandler<V extends View>(uri: string): BaseViewHandler<V> {
    return ViewHandlerFactory.getHandler(uri);
  }
}
