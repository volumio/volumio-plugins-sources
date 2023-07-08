import { PluginConfig } from '../types';
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
    const name = InnertubeResultParser.unwrap(account?.account_name);

    if (account && name) {
      const result: PluginConfig.Account = {
        name,
        photo: InnertubeResultParser.parseThumbnail(account.account_photo)
      };

      return result;
    }

    return null;
  }
}
