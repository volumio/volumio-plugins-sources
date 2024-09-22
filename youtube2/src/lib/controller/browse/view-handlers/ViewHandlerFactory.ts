
import BaseViewHandler from './BaseViewHandler';
import GenericViewHandler from './GenericViewHandler';
import OptionSelectionViewHandler from './OptionSelectionViewHandler';
import PlaylistViewHandler from './PlaylistViewHandler';
import RootViewHandler from './RootViewHandler';
import SearchViewHandler from './SearchViewHandler';
import SubscriptionsViewHandler from './SubscriptionsViewHandler';
import VideoViewHandler from './VideoViewHandler';
import View from './View';
import ViewHelper from './ViewHelper';

type HandlerClass<V extends View, T extends BaseViewHandler<V>> =
  new (uri: string, currentView: V, previousViews: View[]) => T;

const VIEW_NAME_TO_CLASS: Record<string, HandlerClass<any, any>> = {
  'root': RootViewHandler,
  'generic': GenericViewHandler,
  'video': VideoViewHandler,
  'playlist': PlaylistViewHandler,
  'optionSelection': OptionSelectionViewHandler,
  'search': SearchViewHandler,
  'subscriptions': SubscriptionsViewHandler
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
