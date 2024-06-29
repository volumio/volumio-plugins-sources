import ConnectionManager from '../../../connection/ConnectionManager';
import ServerConnection from '../../../connection/ServerConnection';
import AlbumViewHandler from './AlbumViewHandler';
import ArtistViewHandler from './ArtistViewHandler';
import BaseViewHandler from './BaseViewHandler';
import CollectionViewHandler from './CollectionViewHandler';
import FilterSelectionViewHandler from './FilterSelectionViewHandler';
import FolderViewHandler from './FolderViewHandler';
import GenreViewHandler from './GenreViewHandler';
import LibraryViewHandler from './LibraryViewHandler';
import PlaylistViewHandler from './PlaylistViewHandler';
import RootViewHandler from './RootViewHandler';
import View from './View';
import ViewHelper from './ViewHelper';
import UserViewViewHandler from './UserViewViewHandler';
import SongViewHandler from './SongViewHandler';
import CollectionsViewHandler from './CollectionsViewHandler';
import ServerHelper from '../../../util/ServerHelper';

type HandlerClass<V extends View, T extends BaseViewHandler<V>> =
  new (uri: string, currentView: V, previousViews: View[], connection: ServerConnection | null) => T;

const VIEW_NAME_TO_CLASS: Record<string, HandlerClass<any, any>> = {
  'root': RootViewHandler,
  'userViews': UserViewViewHandler,
  'library': LibraryViewHandler,
  'albums': AlbumViewHandler,
  'albumArtists': ArtistViewHandler,
  'artists': ArtistViewHandler,
  'playlists': PlaylistViewHandler,
  'genres': GenreViewHandler,
  'songs': SongViewHandler,
  'song': SongViewHandler,
  'collections': CollectionsViewHandler,
  'collection': CollectionViewHandler,
  'folder': FolderViewHandler,
  'filter.az': FilterSelectionViewHandler,
  'filter.genre': FilterSelectionViewHandler,
  'filter.year': FilterSelectionViewHandler,
  'filter.filter': FilterSelectionViewHandler,
  'filter.sort': FilterSelectionViewHandler
};

export default class ViewHandlerFactory {

  static async getHandler<V extends View>(uri: string, connection: ServerConnection): Promise<BaseViewHandler<V>>;
  static async getHandler<V extends View>(uri: string, connectionManager: ConnectionManager): Promise<BaseViewHandler<V>>;
  static async getHandler<V extends View>(uri: string, connectionTarget: ConnectionManager | ServerConnection): Promise<BaseViewHandler<V>> {
    const views = ViewHelper.getViewsFromUri(uri);
    const currentView = views.pop();
    const previousViews = views;

    if (!currentView) {
      throw Error('Invalid URI: no parseable view.');
    }

    const connection = await ServerHelper.getConnectionByView(currentView, connectionTarget);

    return new VIEW_NAME_TO_CLASS[currentView.name](uri, currentView, previousViews, connection);
  }
}
