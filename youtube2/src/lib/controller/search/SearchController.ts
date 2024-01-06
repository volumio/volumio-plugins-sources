import { SearchView } from '../browse/view-handlers/SearchViewHandler';
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
    const searchUri = `youtube2/${ViewHelper.constructUriSegmentFromView(searchView)}`;
    const handler = ViewHandlerFactory.getHandler(searchUri);
    const page = await handler.browse();

    return page.navigation?.lists || [];
  }
}
