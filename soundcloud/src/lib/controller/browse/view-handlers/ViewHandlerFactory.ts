import AlbumViewHandler from './AlbumViewHandler';
import BaseViewHandler from './BaseViewHandler';
import HistoryViewHandler from './HistoryViewHandler';
import LibraryViewHandler from './LibraryViewHandler';
import PlaylistViewHandler from './PlaylistViewHandler';
import RootViewHandler from './RootViewHandler';
import SelectionViewHandler from './SelectionViewHandler';
import TrackViewHandler from './TrackViewHandler';
import UserViewHandler from './UserViewHandler';
import View from './View';
import ViewHelper from './ViewHelper';

type HandlerClass<V extends View, T extends BaseViewHandler<V>> =
  new (uri: string, currentView: V, previousViews: View[]) => T;

const VIEW_NAME_TO_CLASS: Record<string, HandlerClass<any, any>> = {
  'root': RootViewHandler,
  'selections': SelectionViewHandler,
  'users': UserViewHandler,
  'albums': AlbumViewHandler,
  'playlists': PlaylistViewHandler,
  'tracks': TrackViewHandler,
  'track': TrackViewHandler,
  'history': HistoryViewHandler,
  'library': LibraryViewHandler
};

export default class ViewHandlerFactory {

  static getHandler<V extends View>(uri: string): BaseViewHandler<V> {
    const views = ViewHelper.getViewsFromUri(uri);
    const currentView = views.pop();
    const previousViews = views;

    if (!currentView) {
      throw Error('Invalid URI: no parseable view.');
    }

    return new VIEW_NAME_TO_CLASS[currentView.name](uri, currentView, previousViews);
  }
}
