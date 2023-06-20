'use strict';

const { InnerTubeParser, InnerTubeBaseModel } = require('./innertube');

class AccountModel extends InnerTubeBaseModel {

  async getInfo() {
    const innerTube = this.getInnerTube();
    const info = await innerTube.account.getInfo();

    // This plugin supports single sign-in, so there should only be one account in contents.
    // But we still get the 'selected' one just to be sure.
    const account = info.contents.contents.find((ac) => ac.is_selected);
    
    if (account) {
      const result = {
        name: InnerTubeParser.unwrap(account.account_name),
        photo: InnerTubeParser.getThumbnail(account.account_photo)
      };

      if (info.footers?.endpoint) { // Channel
        result.channel = {
          title: InnerTubeParser.unwrap(info.footers.title),  // 'Your channel'
          endpoint: InnerTubeParser.sanitizeEndpoint(info.footers.endpoint)
        };
      }

      return result;
    }
    
    return null;
  }
}

module.exports = AccountModel;
