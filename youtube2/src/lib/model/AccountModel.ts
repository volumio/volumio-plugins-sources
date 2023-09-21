import { PluginConfig } from '../types';
import { EndpointType } from '../types/Endpoint';
import { AuthStatus } from '../util/Auth';
import { BaseModel } from './BaseModel';
import InnertubeResultParser from './InnertubeResultParser';

export default class AccountModel extends BaseModel {

  async getInfo(): Promise<PluginConfig.Account | null> {
    const { innertube, auth } = await this.getInnertube();

    if (auth.getStatus().status !== AuthStatus.SignedIn) {
      return null;
    }

    const info = await innertube.account.getInfo();

    // This plugin supports single sign-in, so there should only be one account in contents.
    // But we still get the 'selected' one just to be sure.
    const account = info.contents?.contents.find((ac: any) => ac.is_selected);
    const accountName = InnertubeResultParser.unwrap(account?.account_name);

    if (account && accountName) {
      const result: PluginConfig.Account = {
        name: accountName,
        photo: InnertubeResultParser.parseThumbnail(account.account_photo)
      };

      const channelTitle = InnertubeResultParser.unwrap(info.footers?.title); // 'Your channel'
      const channelEndpoint = InnertubeResultParser.parseEndpoint(info.footers?.endpoint, EndpointType.Browse);
      if (channelTitle && channelEndpoint) { // Channel
        result.channel = {
          title: channelTitle,
          endpoint: channelEndpoint
        };
      }

      return result;
    }

    return null;
  }
}
