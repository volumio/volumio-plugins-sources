import yt2 from '../../../YouTube2Context';
import { ModelType } from '../../../model';
import InnertubeLoader from '../../../model/InnertubeLoader';
import { ContentItem, PageElement } from '../../../types';
import { PageContent } from '../../../types/Content';
import { AuthStatus } from '../../../util/Auth';
import { ExplodedTrackInfo } from './ExplodableViewHandler';
import FeedViewHandler, { FeedView } from './FeedViewHandler';
import { RenderedPage } from './ViewHandler';

export interface RootView extends FeedView {
  name: 'root';
}

export default class RootViewHandler extends FeedViewHandler<RootView> {

  protected getTracksOnExplode(): Promise<ExplodedTrackInfo | ExplodedTrackInfo[]> {
    throw Error('Operation not supported');
  }

  async browse(): Promise<RenderedPage> {
    const result = await super.browse();
    if (result.navigation?.lists && result.navigation.lists.length > 0) {
      result.navigation.lists[0].title = yt2.getI18n('YOUTUBE2_TITLE');
    }
    return result;
  }

  protected async getContents(): Promise<PageContent | null> {
    const contentType = yt2.getConfigValue('rootContentType');
    const rootModel = this.getModel(ModelType.Root);
    let contents = await rootModel.getContents({ contentType });

    if (!contents) {
      contents = {
        sections: [] as PageElement.Section[]
      } as PageContent;
    }
    // We should never come to this, but just in case...
    else if (!contents.sections || contents.sections.length === 0) {
      contents.sections = [];
    }

    const { auth } = await InnertubeLoader.getInstance();
    if (auth.getStatus().status === AuthStatus.SignedIn) {
      const accountModel = this.getModel(ModelType.Account);
      const account = await accountModel.getInfo();
      if (account?.channel) {
        contents.sections.unshift({
          type: 'section',
          items: [
            {
              type: 'endpointLink',
              title: account.channel.title,
              thumbnail: account.photo,
              endpoint: account.channel.endpoint
            } as ContentItem.EndpointLink
          ]
        });
      }
    }

    if (contentType === 'simple' && contents.sections.length > 1) {
      // Place all items into one section
      const allItems = this.findAllItemsInSection(contents.sections);
      contents.sections = [
        {
          ...contents.sections[0],
          items: allItems
        }
      ];
    }

    return contents;
  }

  protected getAvailableListViews(): ('list' | 'grid')[] {
    const contentType = yt2.getConfigValue('rootContentType');
    return contentType === 'simple' ? [ 'grid', 'list' ] : [ 'list' ];
  }
}
