import { CloudcastView } from '../browse/view-handlers/CloudcastViewHandler';
import { TagView } from '../browse/view-handlers/TagViewHandler';
import { UserView } from '../browse/view-handlers/UserViewHandler';
import { RenderedList } from '../browse/view-handlers/ViewHandler';
import ViewHandlerFactory from '../browse/view-handlers/ViewHandlerFactory';
import ViewHelper from '../browse/view-handlers/ViewHelper';

export interface SearchQuery {
  value: string;
}

export default class SearchController {

  async search(query: SearchQuery) {
    const safeQuery = query.value.replace(/"/g, '\\"');

    const tagView: TagView = {
      name: 'tags',
      keywords: safeQuery
    };
    const cloudcastView: CloudcastView = {
      name: 'cloudcasts',
      keywords: safeQuery
    };
    const userView: UserView = {
      name: 'users',
      keywords: safeQuery
    };
    const searchUris = [
      `mixcloud/${ViewHelper.constructUriSegmentFromView(tagView)}@inSection=1`,
      `mixcloud/${ViewHelper.constructUriSegmentFromView(cloudcastView)}@inSection=1`,
      `mixcloud/${ViewHelper.constructUriSegmentFromView(userView)}@inSection=1`
    ];
    const browsePromises = searchUris.map((uri) => ViewHandlerFactory.getHandler(uri).browse());
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
