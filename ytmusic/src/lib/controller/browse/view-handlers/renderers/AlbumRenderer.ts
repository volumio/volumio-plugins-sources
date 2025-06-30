import { type ContentItem, type PageElement } from '../../../../types';
import { type AlbumView } from '../AlbumViewHandler';
import { type GenericView } from '../GenericViewHandler';
import type View from '../View';
import MusicFolderRenderer from './MusicFolderRenderer';

export default class AlbumRenderer extends MusicFolderRenderer<ContentItem.Album, PageElement.AlbumHeader> {
  protected getTargetViewForListItem(data: ContentItem.Album): AlbumView | null {
    const endpoints: any = {
      watch: data.endpoint,
      browse: data.browseEndpoint
    };
    const targetView: AlbumView = {
      name: 'album',
      endpoints
    };
    return targetView;

  }
  protected getTargetViewForHeader(data: PageElement.AlbumHeader): View | null {
    if (!data.endpoint) {
      return null;
    }
    const targetView: GenericView = {
      name: 'generic',
      endpoint: data.endpoint
    };
    return targetView;
  }

  protected getSubtitleForListItem(data: ContentItem.Album): string | null | undefined {
    return data.subtitle;
  }
  protected getSubtitleForHeader(data: PageElement.AlbumHeader): string | null | undefined {
    return data.artist?.name;
  }
}
