'use strict';

const yt2 = require('../../../youtube2');
const Auth = require('../../../utils/auth');
const FeedViewHandler = require('./feed');

class RootViewHandler extends FeedViewHandler {

  async browse() {
    const result = await super.browse();
    if (result.navigation?.lists?.length > 0) {
      result.navigation.lists[0].title = yt2.getI18n('YOUTUBE2_TITLE');
    }
    return result;
  }

  async getContents() {
    const contentType = yt2.getConfigValue('rootContentType', 'full');
    const rootModel = this.getModel('root');
    const contents = (await rootModel.getContents({ contentType })) || {};

    // We should never come to this, but just in case...
    if (!contents.sections || contents.sections.length === 0) {
      contents.sections = [];
    }

    const authStatus = Auth.getAuthStatus();
    if (authStatus.status === Auth.SIGNED_IN) {
      const accountModel = this.getModel('account');
      const account = await accountModel.getInfo();
      if (account?.channel) {
        contents.sections.unshift({
          items: [
            {
              type: 'endpoint',
              title: account.channel.title,
              thumbnail: account.photo,
              endpoint: account.channel.endpoint
            }
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

  // Override
  getAvailableListViews(items) {
    const contentType = yt2.getConfigValue('rootContentType', 'full');
    return contentType === 'simple' ? ['grid', 'list'] : ['list'];
  }
}

module.exports = RootViewHandler;
