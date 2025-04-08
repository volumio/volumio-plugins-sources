
import AlbumViewHandler from './AlbumViewHandler';
import type BaseViewHandler from './BaseViewHandler';
import GenericViewHandler from './GenericViewHandler';
import MusicItemViewHandler from './MusicItemViewHandler';
import OptionSelectionViewHandler from './OptionSelectionViewHandler';
import PlaylistViewHandler from './PlaylistViewHandler';
import PodcastViewHandler from './PodcastViewHandler';
import RootViewHandler from './RootViewHandler';
import SearchViewHandler from './SearchViewHandler';
import type View from './View';
import ViewHelper from './ViewHelper';

type HandlerClass<V extends View, T extends BaseViewHandler<V>> =
  new (uri: string, currentView: V, previousViews: View[]) => T;

const VIEW_NAME_TO_CLASS: Record<string, HandlerClass<any, any>> = {
  'root': RootViewHandler,
  'generic': GenericViewHandler,
  'video': MusicItemViewHandler,
  'song': MusicItemViewHandler,
  'album': AlbumViewHandler,
  'playlist': PlaylistViewHandler,
  'podcast': PodcastViewHandler,
  'optionSelection': OptionSelectionViewHandler,
  'search': SearchViewHandler
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
