import ConnectionManager from '../../connection/ConnectionManager';
import Server from '../../entities/Server';
import { RenderedList } from '../browse/view-handlers/ViewHandler';
import jellyfin from '../../JellyfinContext';
import ViewHandlerFactory from '../browse/view-handlers/ViewHandlerFactory';
import ServerHelper from '../../util/ServerHelper';
import { AlbumView } from '../browse/view-handlers/AlbumViewHandler';
import ViewHelper from '../browse/view-handlers/ViewHelper';
import { ArtistView } from '../browse/view-handlers/ArtistViewHandler';
import { SongView } from '../browse/view-handlers/SongViewHandler';
import View from '../browse/view-handlers/View';

export interface SearchQuery {
  value: string;
}

export default class SearchController {

  #connectionManager: ConnectionManager;

  constructor(connectionManager: ConnectionManager) {
    this.#connectionManager = connectionManager;
  }

  async search(query: SearchQuery): Promise<RenderedList[]> {
    if (!query) {
      return [];
    }
    const searchAlbums = jellyfin.getConfigValue('searchAlbums');
    const searchArtists = jellyfin.getConfigValue('searchArtists');
    const searchSongs = jellyfin.getConfigValue('searchSongs');

    if (!searchAlbums && !searchArtists && !searchSongs) {
      return [];
    }

    const serverConfEntries = ServerHelper.getServersFromConfig();
    const onlineServers = jellyfin.get<Server[]>('onlineServers', []);

    const searchedConnectionIds: string[] = [];
    const searchUris: string[] = serverConfEntries.reduce<string[]>((uris, conf) => {
      const server = onlineServers.find(
        (server) => ServerHelper.getConnectionUrl(conf.url) === server.connectionUrl);
      if (server) {
        const targetConnectionId = ServerHelper.generateConnectionId(conf.username, server);
        if (!searchedConnectionIds.includes(targetConnectionId)) {
          const baseView: Partial<View> = {
            search: query.value,
            collatedSearchResults: '1'
          };
          if (searchAlbums) {
            uris.push(`jellyfin/${targetConnectionId}/${ViewHelper.constructUriSegmentFromView<AlbumView>({ ...baseView, name: 'albums' })}`);
          }
          if (searchArtists) {
            uris.push(`jellyfin/${targetConnectionId}/${ViewHelper.constructUriSegmentFromView<ArtistView>({ ...baseView, name: 'artists' })}`);
          }
          if (searchSongs) {
            uris.push(`jellyfin/${targetConnectionId}/${ViewHelper.constructUriSegmentFromView<SongView>({ ...baseView, name: 'songs' })}`);
          }
          searchedConnectionIds.push(targetConnectionId);
        }
      }
      return uris;
    }, []);

    const searchResultListsPromises = searchUris.map((uri) => this.#getListsFromSearchUri(uri));
    const searchResultLists = (await Promise.all(searchResultListsPromises)).reduce((result, lists) => {
      lists.forEach((list) => {
        if (list.items.length > 0) {
          result.push(list);
        }
      });
      return result;
    }, []);

    return searchResultLists;
  }

  async #getListsFromSearchUri(uri: string): Promise<RenderedList[]> {
    try {
      const handler = await ViewHandlerFactory.getHandler(uri, this.#connectionManager);
      const searchResultsPage = await handler.browse();
      return searchResultsPage.navigation?.lists || [];
    }
    catch (error: any) {
      return [];
    }
  }
}
