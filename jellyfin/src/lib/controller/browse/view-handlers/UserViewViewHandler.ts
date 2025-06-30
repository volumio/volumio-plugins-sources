import { EntityType } from '../../../entities';
import { ModelType } from '../../../model';
import BaseViewHandler from './BaseViewHandler';
import { RenderedListItem } from './renderer/BaseRenderer';
import View from './View';
import { RenderedList, RenderedPage, RenderedPageContents } from './ViewHandler';
import jellyfin from '../../../JellyfinContext';
import UserView, { UserViewType } from '../../../entities/UserView';
import { AlbumView } from './AlbumViewHandler';
import ViewHelper from './ViewHelper';

export interface UserViewView extends View {
  name: 'userViews';
  serverId: string;
  username: string;
}

export default class UserViewViewHandler extends BaseViewHandler<UserViewView> {

  async browse(): Promise<RenderedPage> {
    const prevUri = this.constructPrevUri();
    const lists: RenderedList[] = [];

    const model = this.getModel(ModelType.UserView);
    const renderer = this.getRenderer(EntityType.UserView);
    const userViews = await model.getUserViews();
    const myMediaItems = userViews.items.map((userView) =>
      renderer.renderToListItem(userView)).filter((item) => item) as RenderedListItem[];
    lists.push({
      availableListViews: [ 'list', 'grid' ],
      title: jellyfin.getI18n('JELLYFIN_MY_MEDIA'),
      items: myMediaItems
    });

    if (jellyfin.getConfigValue('showLatestMusicSection')) {
      const libraries = userViews.items.filter((userView) => userView.userViewType === UserViewType.Library);
      const latestLibraryAlbumLists = await Promise.all(libraries.map(
        (library) => this.#getLatestLibraryAlbumList(library)));

      latestLibraryAlbumLists.forEach((list) => {
        if (list.items.length > 0) {
          lists.push(list);
        }
      });
    }

    const pageContents: RenderedPageContents = {
      prev: {
        uri: prevUri
      },
      lists
    };

    await this.setPageTitle(pageContents);

    return {
      navigation: pageContents
    };
  }

  async #getLatestLibraryAlbumList(library: UserView): Promise<RenderedList> {
    const albumView: AlbumView = {
      name: 'albums',
      parentId: library.id,
      sortBy: 'DateCreated,SortName',
      sortOrder: 'Descending,Ascending',
      fixedView: 'latest'
    };
    const moreUri = `${this.uri}/${ViewHelper.constructUriSegmentFromView(albumView)}`;

    const model = this.getModel(ModelType.Album);
    const renderer = this.getRenderer(EntityType.Album);
    const modelQueryParams = this.getModelQueryParams({
      parentId: library.id,
      sortBy: 'DateCreated,SortName',
      sortOrder: 'Descending,Ascending',
      limit: jellyfin.getConfigValue('latestMusicSectionItems')
    });
    const albums = await model.getAlbums(modelQueryParams);
    const listItems = albums.items.map((album) =>
      renderer.renderToListItem(album)).filter((item) => item) as RenderedListItem[];

    if (albums.nextStartIndex) {
      listItems.push(this.constructNextPageItem(moreUri, `<span style='color: #7a848e;'>${jellyfin.getI18n('JELLYFIN_VIEW_MORE')}</span>`));
    }

    return {
      title: jellyfin.getI18n('JELLYFIN_LATEST_IN', library.name),
      availableListViews: [ 'list', 'grid' ],
      items: listItems
    };
  }
}
