import yt2 from '../../../YouTube2Context';
import { ModelType } from '../../../model';
import InnertubeLoader from '../../../model/InnertubeLoader';
import { ContentItem, PageElement } from '../../../types';
import { PageContent } from '../../../types/Content';
import { BrowseEndpoint, EndpointType } from '../../../types/Endpoint';
import { SectionItem } from '../../../types/PageElement';
import { AuthStatus } from '../../../util/Auth';
import GenericViewHandler, { GenericView } from './GenericViewHandler';

const CHANNEL_DISPLAY_LIMIT = 6;

export interface SubscriptionsView extends Omit<GenericView, 'name'> {
  name: 'subscriptions';
}

export default class SubscriptionsViewHandler extends GenericViewHandler<SubscriptionsView> {

  // Override
  protected async getContents(): Promise<PageContent> {
    const contents = (await super.getContents()) || {};

    if (contents.isContinuation) {
      return contents;
    }

    // We should never come to this, but just in case...
    if (!contents.sections || contents.sections.length === 0) {
      contents.sections = [];
    }

    const { auth } = await InnertubeLoader.getInstance();
    if (auth.getStatus().status === AuthStatus.SignedIn) {
      const endpointModel = this.getModel(ModelType.Endpoint);
      const channelsEndpoint: BrowseEndpoint = {
        type: EndpointType.Browse,
        payload: {
          browseId: 'FEchannels'
        }
      };
      const channelList = await endpointModel.getContents(channelsEndpoint);

      let channels: SectionItem[],
        hasMoreChannels = false;
      if (channelList?.sections) {
        channels = this.findAllItemsInSection(channelList?.sections, (item) => item.type === 'channel');
        hasMoreChannels = channels.length > CHANNEL_DISPLAY_LIMIT;
        if (hasMoreChannels) {
          channels.splice(CHANNEL_DISPLAY_LIMIT - 1);
        }
      }
      else {
        channels = [];
      }

      if (channels.length > 0) {
        const insertSection: PageElement.Section = {
          type: 'section',
          items: channels
        };
        if (hasMoreChannels) {
          insertSection.items.push({
            type: 'endpointLink',
            title: yt2.getI18n('YOUTUBE2_SEE_ALL'),
            endpoint: channelsEndpoint
          } as ContentItem.EndpointLink);
        }
        contents.sections.unshift(insertSection);
      }
    }

    return contents;
  }
}
