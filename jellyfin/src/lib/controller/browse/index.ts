import ConnectionManager from '../../connection/ConnectionManager';
import jellyfin from '../../JellyfinContext';
import BaseViewHandler from './view-handlers/BaseViewHandler';
import { ExplodedTrackInfo } from './view-handlers/Explodable';
import View from './view-handlers/View';
import { RenderedPage } from './view-handlers/ViewHandler';
import ViewHandlerFactory from './view-handlers/ViewHandlerFactory';

export default class BrowseController {

  #connectionManager: ConnectionManager;

  constructor(connectionManager: ConnectionManager) {
    this.#connectionManager = connectionManager;
  }

  /*
   *  Uri follows a hierarchical view structure, starting with 'jellyfin'.
   * - If nothing follows 'jellyfin', the view would be 'root' (show server list)
   * - The next segment that follows is 'serverId', i.e. 'jellyfin/{username}@{serverId}'. If there are no further segments, the view would be 'userViews' (shows user views for the server specified by serverId)
   *
   * After 'jellyfin/{username}@{serverId}', the uri consists of segments representing the following views:
   * - library[@parentId=...]: shows 'Albums', 'Artists'...for the specified library
   * - albums[@parentId=...][@artistId=...| @albumArtistId=...| @genreId=...][@startIndex=...][@viewType=latest|favorite][@search=...]: shows albums under the item specified by parentId, optionally filtered by artistId, albumArtistId, genreId...
   * - artists[@parentId=...][@startIndex=...][@viewType=favorite][@search=...]
   * - albumArtists[@parentId=...][@startIndex=...][@viewType=favorite]
   * - playlists[@startIndex=...]
   * - genres[@parentId=...][@startIndex=...]
   * - songs[@albumId=...] | [ [@playlistId=...| @parentId=...][@startIndex=...] ][@viewType=recentlyPlayed|frequentlyPlayed|favorite][@search=...]
   * - folder[@parentId=...][@startIndex=...]: lists contents of specified folder. Folders are shown in userViews when 'folder view' is enabled in Jellyfin.
   *
   */
  async browseUri(uri: string): Promise<RenderedPage> {
    jellyfin.getLogger().info(`[jellyfin-browse] browseUri: ${uri}`);

    const handler = await this.#getHandler(uri);
    return handler.browse();
  }

  /**
   * Explodable uris:
   * - song[@songId=...]
   * - songs[@albumId=...] | [ [@playlistId=...| @parentId=...] ]
   * - albums[@parentId=...][@genreId=...| @artistId=...| @albumArtistId=...]
   *
   */
  async explodeUri(uri: string): Promise<ExplodedTrackInfo[]> {
    jellyfin.getLogger().info(`[jellyfin-browse] explodeUri: ${uri}`);

    const handler = await this.#getHandler(uri);
    return handler.explode();
  }

  #getHandler<V extends View>(uri: string): Promise<BaseViewHandler<V>> {
    return ViewHandlerFactory.getHandler(uri, this.#connectionManager);
  }
}
