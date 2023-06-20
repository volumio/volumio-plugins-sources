'use strict';

const yt2 = require('../../../youtube2');
const Auth = require('../../../utils/auth');
const GenericViewHandler = require('./generic');

const CHANNEL_DISPLAY_LIMIT = 6;

class SubscriptionsViewHandler extends GenericViewHandler {

  // Override
  async getContents() {
    const contents = (await super.getContents()) || {};

    if (contents?.type === 'continuation') {
      return contents;
    }

    // We should never come to this, but just in case...
    if (!contents.sections || contents.sections.length === 0) {
      contents.sections = [];
    }

    const authStatus = Auth.getAuthStatus();
    if (authStatus.status === Auth.SIGNED_IN) {
      const endpointModel = this.getModel('endpoint');
      const channelsEndpoint = {
        type: 'browse',
        payload: {
          browseId: 'FEchannels'
        }
      };
      const channelList = await endpointModel.getContents(channelsEndpoint);
      const channels = this.findAllItemsInSection(channelList?.sections, (item) => item.type === 'channel');

      const hasMoreChannels = channels.length > CHANNEL_DISPLAY_LIMIT;
      if (hasMoreChannels) {
        channels.splice(CHANNEL_DISPLAY_LIMIT - 1);
      }
      if (channels.length > 0) {
        const insertSection = {
          items: channels
        };
        if (hasMoreChannels) {
          insertSection.items.push({
            type: 'endpoint',
            title: yt2.getI18n('YOUTUBE2_SEE_ALL'),
            endpoint: channelsEndpoint
          });
        }
        contents.sections.unshift(insertSection);
      }
    }

    return contents;
  }
}

module.exports = SubscriptionsViewHandler;
