import bandcamp from '../../../BandcampContext';
import { ModelType } from '../../../model';
import { SearchItemType, SearchModelGetSearchResultsParams } from '../../../model/SearchModel';
import UIHelper from '../../../util/UIHelper';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
import { RendererType } from './renderers';
import { RenderedListItem } from './renderers/BaseRenderer';

export interface SearchView extends View {
  name: 'search';
  query: string;
  combinedSearch?: '1';
  itemType?: SearchItemType
}

export default class SearchViewHandler extends BaseViewHandler<SearchView> {

  async browse(): Promise<RenderedPage> {
    const view = this.currentView;

    if (!view.query) {
      throw Error('Search query missing');
    }

    const modelParams: SearchModelGetSearchResultsParams = {
      query: view.query,
      itemType: SearchItemType.All,
      limit: view.combinedSearch ? bandcamp.getConfigValue('combinedSearchResults', 17) : bandcamp.getConfigValue('itemsPerPage', 47)
    };

    if (view.pageRef) {
      modelParams.pageToken = view.pageRef.pageToken;
      modelParams.pageOffset = view.pageRef.pageOffset;
    }

    if (view.itemType) {
      modelParams.itemType = view.itemType;
    }

    const searchResults = await this.getModel(ModelType.Search).getSearchResults(modelParams);
    const renderer = this.getRenderer(RendererType.SearchResult);
    const listItems = searchResults.items.reduce<RenderedListItem[]>((result, item) => {
      const rendered = renderer.renderToListItem(item);
      if (rendered) {
        result.push(rendered);
      }
      return result;
    }, []);

    const nextPageRef = this.constructPageRef(searchResults.nextPageToken, searchResults.nextPageOffset);
    if (nextPageRef) {
      const nextUri = this.constructNextUri(nextPageRef);
      listItems.push(this.constructNextPageItem(nextUri));
    }

    let titleKey;
    switch (view.itemType) {
      case SearchItemType.ArtistsAndLabels:
        titleKey = 'BANDCAMP_SEARCH_ARTISTS_AND_LABELS_TITLE';
        break;
      case SearchItemType.Albums:
        titleKey = 'BANDCAMP_SEARCH_ALBUMS_TITLE';
        break;
      case SearchItemType.Tracks:
        titleKey = 'BANDCAMP_SEARCH_TRACKS_TITLE';
        break;
      default:
        titleKey = 'BANDCAMP_SEARCH_TITLE';
    }
    if (!view.combinedSearch) {
      titleKey += '_FULL';
    }
    const pageTitle = UIHelper.addBandcampIconToListTitle(bandcamp.getI18n(titleKey, view.query));

    return {
      navigation: {
        prev: { uri: this.constructPrevUri() },
        lists: [
          {
            availableListViews: [ 'list', 'grid' ],
            items: listItems,
            title: pageTitle
          }
        ]
      }
    };
  }
}
