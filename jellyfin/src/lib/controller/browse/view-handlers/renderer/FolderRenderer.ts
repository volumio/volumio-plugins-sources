import BaseRenderer, { RenderedListItem } from './BaseRenderer';
import Folder, { FolderType } from '../../../../entities/Folder';
import { EntityType } from '../../../../entities';
import ViewHelper from '../ViewHelper';
import { CollectionsView } from '../CollectionsViewHandler';
import { FolderView } from '../FolderViewHandler';

export default class FolderRenderer extends BaseRenderer<Folder> {

  renderToListItem(data: Folder): RenderedListItem | null {
    let title;
    if (data.type === EntityType.Folder) {
      title = `
        <div style='display: inline-flex; align-items: center;'>
            <i class='fa fa-folder-o' style='font-size: 20px; margin: -3px 8px 0 1px;'></i> <span>${data.name}</span>
        </div>
      `;
    }
    else {
      title = data.name;
    }

    const targetView: CollectionsView | FolderView = {
      name: data.folderType === FolderType.Collections ? 'collections' : 'folder',
      parentId: data.id
    };

    return {
      service: 'jellyfin',
      type: 'streaming-category',
      title,
      uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(targetView)}`,
      albumart: this.getAlbumArt(data)
    };
  }
}
