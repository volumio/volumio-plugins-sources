import { type YTNodes } from 'volumio-youtubei.js';
import { type PluginConfig } from '../types';
import type Innertube from "volumio-youtubei.js";
import InnertubeResultParser from './InnertubeResultParser';

export type AccountInfo = {
  isSignedIn: true,
  list: PluginConfig.Account[],
  active: PluginConfig.Account
} | {
  isSignedIn: false,
  list: null,
  active: null
}

const SIGNED_OUT: AccountInfo = {
  isSignedIn: false,
  list: null,
  active: null
};

function convertAccountItem(data: YTNodes.AccountItem): PluginConfig.Account | null {
  const name = InnertubeResultParser.unwrap(data.account_name);
  const photo = InnertubeResultParser.parseThumbnail(data.account_photo);
  const handle = InnertubeResultParser.unwrap(data.channel_handle);
  const [ pageId, datasyncIdToken ] = (() => {
    let pageId: string | undefined = undefined;
    let datasyncIdToken: string | undefined = undefined;
    if (Array.isArray(data.endpoint.payload.supportedTokens)) {
      for (const token of data.endpoint.payload.supportedTokens) {
        if (Reflect.has(token, 'pageIdToken') && Reflect.has(token.pageIdToken, 'pageId')) {
          pageId = String(token.pageIdToken.pageId);
        }
        else if (Reflect.has(token, 'datasyncIdToken') && Reflect.has(token.datasyncIdToken, 'datasyncIdToken')) {
          datasyncIdToken = String(token.datasyncIdToken.datasyncIdToken);
        }
      }
    }
    return [ pageId, datasyncIdToken ];
  })();
  if (!name || !handle || !datasyncIdToken) {
    return null;
  }
  return {
    name,
    photo,
    active: data.is_selected,
    handle,
    pageId,
    datasyncIdToken
  };
}

export async function getAccountInitialInfo(innertube: Innertube): Promise<AccountInfo> {
  if (!innertube.session.logged_in) {
    return SIGNED_OUT;
  }
  const accounts = await innertube.account.getInfo(true);
  const list = accounts.reduce<PluginConfig.Account[]>((result, ac) => {
    if (!ac.is_disabled) {
      const item = convertAccountItem(ac);
      if (item) {
        result.push(item);
      }
    }
    return result;
  }, []);
  const active = list.find((ac) => ac.active);
  if (!active) {
    return SIGNED_OUT;
  }
  return {
    isSignedIn: true,
    list,
    active
  };
}
