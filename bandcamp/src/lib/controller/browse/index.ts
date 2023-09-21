import bandcamp from '../../BandcampContext';
import BaseViewHandler from './view-handlers/BaseViewHandler';
import { ExplodedTrackInfo } from './view-handlers/ExplodableViewHandler';
import View from './view-handlers/View';
import { RenderedPage } from './view-handlers/ViewHandler';
import ViewHandlerFactory from './view-handlers/ViewHandlerFactory';

export default class BrowseController {

  /*
   *  Uri follows a hierarchical view structure, starting with 'bandcamp'.
   * - If nothing follows 'bandcamp', the view would be 'root'.
   *
   * After 'bandcamp/', the uri consists of segments representing the following views:
   * - discover[@genre=...][@subgenre=...][@sortBy=...][@artistRecommendationType=...][@location=...][@format=...][@time=...][@pageRef=...]
   * - album[@albumUrl=...]
   * - search[@query=...][@itemType=...][@pageRef=...]
   * - band[@bandUrl=...][band.type==='label': @view=artists|discography][@pageRef=...]*
   * - track[@trackUrl=...]
   * - shows[@showUrl=...|@pageRef=...][@view=tracks|albums]
   * - tag[@tagUrl=...][@select=...][@format=...][@location=...][@sort=...][@pageRef=...]
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
