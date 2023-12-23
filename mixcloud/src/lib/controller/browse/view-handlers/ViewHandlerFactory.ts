import BaseViewHandler from './BaseViewHandler';
import RootViewHandler from './RootViewHandler';
import CloudcastViewHandler from './CloudcastViewHandler';
import View from './View';
import ViewHelper from './ViewHelper';
import DiscoverViewHandler from './DiscoverViewHandler';
import FeaturedViewHandler from './FeaturedViewHandler';
import PlaylistViewHandler from './PlaylistViewHandler';
import TagViewHandler from './TagViewHandler';
import UserViewHandler from './UserViewHandler';
import LiveStreamViewHandler from './LiveStreamViewHandler';

type HandlerClass<V extends View, T extends BaseViewHandler<V>> =
  new (uri: string, currentView: V, previousViews: View[]) => T;

const VIEW_NAME_TO_CLASS: Record<string, HandlerClass<any, any>> = {
  'root': RootViewHandler,
  'cloudcast': CloudcastViewHandler,
  'cloudcasts': CloudcastViewHandler,
  'discover': DiscoverViewHandler,
  'featured': FeaturedViewHandler,
  'playlist': PlaylistViewHandler,
  'playlists': PlaylistViewHandler,
  'tags': TagViewHandler,
  'user': UserViewHandler,
  'users': UserViewHandler,
  'liveStream': LiveStreamViewHandler,
  'liveStreams': LiveStreamViewHandler
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
