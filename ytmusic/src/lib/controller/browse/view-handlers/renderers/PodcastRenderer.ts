import { type ContentItem, type PageElement } from '../../../../types';
import { type GenericView } from '../GenericViewHandler';
import { type PodcastView } from '../PodcastViewHandler';
import type View from '../View';
import MusicFolderRenderer from './MusicFolderRenderer';

export default class PodcastRenderer extends MusicFolderRenderer<ContentItem.Podcast, PageElement.PodcastHeader> {
  protected getTargetViewForListItem(data: ContentItem.Podcast): PodcastView | null {
    const endpoints: any = {
      watch: data.endpoint,
      browse: data.browseEndpoint
    };
    const targetView: PodcastView = {
      name: 'podcast',
      endpoints
    };
    return targetView;

  }
  protected getTargetViewForHeader(data: PageElement.PodcastHeader): View | null {
    const endpoint = data.endpoint || this.currentView.endpoints?.watch ||
      this.currentView.endpoints?.browse || this.currentView.endpoint;
    if (!endpoint) {
      return null;
    }
    const targetView: GenericView = {
      name: 'generic',
      endpoint
    };
    return targetView;
  }

  protected getSubtitleForListItem(data: ContentItem.Podcast): string | null | undefined {
    return data.subtitle;
  }
  protected getSubtitleForHeader(data: PageElement.PodcastHeader): string | null | undefined {
    return data.description;
  }
}
