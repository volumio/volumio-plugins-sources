import AlbumViewHandler from './AlbumViewHandler';
import ArticleViewHandler from './ArticleViewHandler';
import BandViewHandler from './BandViewHandler';
import BaseViewHandler from './BaseViewHandler';
import DiscoverViewHandler from './DiscoverViewHandler';
import FanViewHandler from './FanViewHandler';
import RootViewHandler from './RootViewHandler';
import SearchViewHandler from './SearchViewHandler';
import ShowViewHandler from './ShowViewHandler';
import TagViewHandler from './TagViewHandler';
import TrackViewHandler from './TrackViewHandler';
import View from './View';
import ViewHelper from './ViewHelper';

type HandlerClass<V extends View, T extends BaseViewHandler<V>> =
  new (uri: string, currentView: V, previousViews: View[]) => T;

const VIEW_NAME_TO_CLASS: Record<string, HandlerClass<any, any>> = {
  'root': RootViewHandler,
  'discover': DiscoverViewHandler,
  'band': BandViewHandler,
  'album': AlbumViewHandler,
  'track': TrackViewHandler,
  'search': SearchViewHandler,
  'show': ShowViewHandler,
  'article': ArticleViewHandler,
  'tag': TagViewHandler,
  'fan': FanViewHandler
};

export default class ViewHandlerFactory {

  static getHandler<V extends View>(uri: string): BaseViewHandler<V> {
    const views = ViewHelper.getViewsFromUri(uri);
    const currentView = views.pop();
    const previousViews = views;

    if (!currentView) {
      throw Error('Invalid URI: no parseable view.');
    }

    /**
     * 'artist' and 'label' views are obsolete (replaced by single 'band' view),
     * but may still exist in Volumio playlists or favourites. We still want to be able
     * to play them, so we translate these URIs into their 'band' equivalent.
     */
    if (currentView.name === 'artist' || currentView.name === 'label') {
      currentView.name = 'band';

      if (currentView.artistUrl) {
        currentView.bandUrl = currentView.artistUrl;
        delete currentView.artistUrl;
      }

      if (currentView.labelUrl) {
        currentView.bandUrl = currentView.labelUrl;
        delete currentView.labelUrl;
      }
    }
    /**
     * 'articles' and 'shows' are also absolute (replaced by singular form)
     */
    else if (currentView.name === 'articles') {
      currentView.name = 'article';
    }
    else if (currentView.name === 'shows') {
      currentView.name = 'show';
    }

    return new VIEW_NAME_TO_CLASS[currentView.name](uri, currentView, previousViews);
  }
}
