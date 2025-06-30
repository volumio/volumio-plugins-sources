import { Misc as YTMisc } from 'volumio-youtubei.js';
import { EndpointType } from '../types/Endpoint';
import { BaseModel } from './BaseModel';
import InnertubeResultParser from './InnertubeResultParser';
import { findInObject } from '../util';
import { getAccountInitialInfo } from './AccountModelHelper';

export default class AccountModel extends BaseModel {

  async getInfo() {
    const { innertube } = await this.getInnertube();
    const account = await getAccountInitialInfo(innertube);
    if (account.isSignedIn) {
      const channel = await this.#getChannelInfo();
      if (channel) {
        account.active.channel = channel;
      }
    }
    return account;
  }

  async #getChannelInfo() {
    const menu = await this.fetchAccountMenu();
    const title = findInObject(menu, (key) => key === 'manageAccountTitle')[0];
    if (title) {
      const text = new YTMisc.Text(title);
      const endpoint = InnertubeResultParser.parseEndpoint(text.endpoint, EndpointType.Browse);
      if (text.text && endpoint?.payload.browseId.startsWith('UC')) {
        return {
          title: text.text,
          endpoint
        };
      }
    }
    return null;
  }
}
