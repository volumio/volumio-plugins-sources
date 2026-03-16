import bandcamp from '../../BandcampContext';
import type BaseViewHandler from './view-handlers/BaseViewHandler';
import { type ExplodedTrackInfo } from './view-handlers/ExplodableViewHandler';
import type View from './view-handlers/View';
import { type RenderedPage } from './view-handlers/ViewHandler';
import ViewHandlerFactory from './view-handlers/ViewHandlerFactory';

export default class BrowseController {

  /*
   *  Uri follows a hierarchical view structure, starting with 'bandcamp'.
   * - If nothing follows 'bandcamp', the view would be 'root'.
   *
   * After 'bandcamp/', the uri consists of segments representing the following views:
   * - discover[@genre=...][@subgenre=...][@sortBy=...][@location=...][@category=...][@time=...][@customTags=...][@pageRef=...]
   * - album[@albumUrl=...]
   * - search[@query=...][@itemType=...][@pageRef=...]
   * - band[@bandUrl=...][band.type==='label': @view=artists|discography][@pageRef=...]*
   * - track[@trackUrl=...]
   * - shows[@showUrl=...|@pageRef=...][@view=tracks|albums]
   * - tag
   * - fan[@username=...][@view=collection|wishlist|followingArtistsAndLabels|followingGenres][@pageRef=...]
   *
   * *Replaces obsolete 'artist' and 'label' views
   */
  async browseUri(uri: string): Promise<RenderedPage> {
    bandcamp.getLogger().info(`[bandcamp-browse] browseUri: ${uri}`);

    const handler = this.#getHandler(uri);
    return handler.browse();
  }

  /**
   * Explodable uris:
   * - track[@trackUrl=...]
   * - album[@albumUrl=...]
   * - shows[@showUrl=...]
   * - discover[@...]
   */
  explodeUri(uri: string): Promise<ExplodedTrackInfo[]> {
    bandcamp.getLogger().info(`[bandcamp-browse] explodeUri: ${uri}`);

    const handler = this.#getHandler(uri);
    return handler.explode();
  }

  #getHandler<V extends View>(uri: string): BaseViewHandler<V> {
    return ViewHandlerFactory.getHandler(uri);
  }
}
