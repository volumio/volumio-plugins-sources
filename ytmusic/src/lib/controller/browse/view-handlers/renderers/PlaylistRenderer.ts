import { ContentItem, PageElement } from '../../../../types';
import { GenericView } from '../GenericViewHandler';
import { PlaylistView } from '../PlaylistViewHandler';
import View from '../View';
import MusicFolderRenderer from './MusicFolderRenderer';

export default class PlaylistRenderer extends MusicFolderRenderer<ContentItem.Playlist, PageElement.PlaylistHeader> {
  protected getTargetViewForListItem(data: ContentItem.Playlist): PlaylistView | null {
    const endpoints: any = {
      watch: data.endpoint,
      browse: data.browseEndpoint
    };
    const targetView: PlaylistView = {
      name: 'playlist',
      endpoints
    };
    return targetView;

  }
  protected getTargetViewForHeader(data: PageElement.PlaylistHeader): View | null {
    if (!data.endpoint) {
      return null;
    }
    const targetView: GenericView = {
      name: 'generic',
      endpoint: data.endpoint
    };
    return targetView;
  }

  protected getSubtitleForListItem(data: ContentItem.Playlist): string | null | undefined {
    return data.subtitle;
  }
  protected getSubtitleForHeader(data: PageElement.PlaylistHeader): string | null | undefined {
    return data.author?.name;
  }
}
