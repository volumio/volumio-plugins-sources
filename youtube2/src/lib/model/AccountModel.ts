import { ConfigData } from '../types';
import { BaseModel } from './BaseModel';
import InnertubeResultParser from './InnertubeResultParser';

export default class AccountModel extends BaseModel {

  async getInfo(): Promise<ConfigData.Account | null> {
    const innertube = this.getInnertube();

    if (innertube) {
      const info = await innertube.account.getInfo();

      // This plugin supports single sign-in, so there should only be one account in contents.
      // But we still get the 'selected' one just to be sure.
      const account = info.contents?.contents.find((ac: any) => ac.is_selected);

      if (account) {
        const result: ConfigData.Account = {
          name: InnertubeResultParser.unwrap(account.account_name),
          photo: InnertubeResultParser.parseThumbnail(account.account_photo)
        };

        if (info.footers?.endpoint) { // Channel
          result.channel = {
            title: InnertubeResultParser.unwrap(info.footers.title), // 'Your channel'
            endpoint: InnertubeResultParser.parseEndpoint(info.footers.endpoint)
          };
        }

        return result;
      }
    }

    return null;
  }
}
