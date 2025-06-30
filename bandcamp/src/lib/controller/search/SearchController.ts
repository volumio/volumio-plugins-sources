import bandcamp from '../../BandcampContext';
import { SearchItemType } from '../../model/SearchModel';
import { SearchView } from '../browse/view-handlers/SearchViewHandler';
import { RenderedList } from '../browse/view-handlers/ViewHandler';
import ViewHandlerFactory from '../browse/view-handlers/ViewHandlerFactory';
import ViewHelper from '../browse/view-handlers/ViewHelper';

export interface SearchQuery {
  value: string;
}

export default class SearchController {

  async search(query: SearchQuery) {
    const safeQuery = query.value.replace(/"/g, '\\"');
    const searchView: SearchView = {
      name: 'search',
      query: safeQuery
    };

    const browsePromises = [];
    if (bandcamp.getConfigValue('searchByItemType', true)) {
      [ SearchItemType.ArtistsAndLabels, SearchItemType.Albums, SearchItemType.Tracks ].forEach((itemType) => {
        const searchByTypeView: SearchView = {
          ...searchView,
          itemType
        };
        const handler = ViewHandlerFactory.getHandler(`bandcamp/${ViewHelper.constructUriSegmentFromView(searchByTypeView)}@combinedSearch=1`);
        browsePromises.push(handler.browse());
      });
    }
    else {
      const handler = ViewHandlerFactory.getHandler(`bandcamp/${ViewHelper.constructUriSegmentFromView(searchView)}@combinedSearch=1`);
      browsePromises.push(handler.browse());
    }

    const searchResultPages = await Promise.all(browsePromises);
    const allLists = searchResultPages.reduce<RenderedList[]>((result, page) => {
      if (page.navigation?.lists) {
        result.push(...page.navigation.lists.filter((list) => list.items.length > 0));
      }
      return result;
    }, []);

    return allLists;
  }
}
