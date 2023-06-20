import UserView, { UserViewType } from '../../../../entities/UserView';
import { CollectionsView } from '../CollectionsViewHandler';
import { FolderView } from '../FolderViewHandler';
import { LibraryView } from '../LibraryViewHandler';
import { PlaylistView } from '../PlaylistViewHandler';
import ViewHelper from '../ViewHelper';
import BaseRenderer, { RenderedListItem } from './BaseRenderer';

export default class UserViewRenderer extends BaseRenderer<UserView> {

  renderToListItem(data: UserView): RenderedListItem | null {
    let targetView: CollectionsView | PlaylistView | LibraryView | FolderView;
    let type: RenderedListItem['type'];

    switch (data.userViewType) {
      case UserViewType.Collections:
        targetView = {
          name: 'collections',
          parentId: data.id
        };
        type = 'streaming-category';
        break;

      case UserViewType.Playlists:
        targetView = {
          name: 'playlists'
        };
        type = 'streaming-category';
        break;

      case UserViewType.Library:
        targetView = {
          name: 'library',
          parentId: data.id
        };
        type = 'folder';
        break;

      case UserViewType.Folders:
        targetView = {
          name: 'folder',
          parentId: data.id
        };
        type = 'streaming-category';
        break;

      default:
        return null;
    }

    return {
      service: 'jellyfin',
      type,
      title: data.name,
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(targetView)}`,
      albumart: this.getAlbumArt(data)
    };
  }
}
