import sc from '../../SoundCloudContext';
import BaseViewHandler from './view-handlers/BaseViewHandler';
import { QueueItem } from './view-handlers/ExplodableViewHandler';
import View from './view-handlers/View';
import { RenderedPage } from './view-handlers/ViewHandler';
import ViewHandlerFactory from './view-handlers/ViewHandlerFactory';

export default class BrowseController {

  /*
   * `uri` follows a hierarchical view structure, starting with 'soundcloud'.
   * - If nothing follows 'soundcloud', the view would be 'root' (show root items)
   *
   * After 'soundcloud', the uri consists of segments representing the following views:
   * - selections[@selectionId=...][@pageRef=...][@prevPageRefs=...]
   * - users[@userId=...|@search=...][@title=...][@pageRef=...][@prevPageRefs=...]
   * - playlists[@playlistId=...[@type=...]|@userId=...|@search=...][@title=...][@pageRef=...][@prevPageRefs=...]
   * - albums[@albumId=...|@userId=...|@search=...][@title=...][@pageRef=...][@prevPageRefs=...]
   * - tracks[@userId=...|@search=...|@topFeatured=1][@title=...][@pageRef=...][@prevPageRefs=...]
   */
  async browseUri(uri: string): Promise<RenderedPage> {
    sc.getLogger().info(`[soundcloud] browseUri: ${uri}`);

    const handler = this.#getHandler(uri);
    try {
      return await handler.browse();
    }
    catch (error: any) {
      sc.getLogger().error(sc.getErrorMessage('[soundcloud] browseUri error:', error, true));
      /**
       * Toast error message despite chance it might not show up because Volumio
       * pushes its generic 'No Results' toast which might overlay this one.
       */
      sc.toast('error', sc.getErrorMessage('', error, false));
      throw error;
    }
  }

  /**
   * Explodable uris:
   * - track[@trackId=...]
   * - playlists[@playlistId=...]
   * - albums[@albumId=...]
   * - users[@userId=...]
   */
  async explodeUri(uri: string): Promise<QueueItem[]> {
    sc.getLogger().info(`[soundcloud] explodeUri: ${uri}`);

    const handler = this.#getHandler(uri);
    try {
      return await handler.explode();
    }
    catch (error: any) {
      sc.getLogger().error(sc.getErrorMessage('[soundcloud] explodeUri error:', error, true));
      throw error;
    }
  }

  #getHandler<V extends View>(uri: string): BaseViewHandler<V> {
    return ViewHandlerFactory.getHandler(uri);
  }
}
