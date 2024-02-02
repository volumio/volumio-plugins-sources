import { Parser, RawNode, YTNodes, Misc as YTMisc } from 'volumio-youtubei.js';
import yt2 from '../YouTube2Context';
import { findInObject } from '../util';
import { BaseModel } from './BaseModel';
import InnertubeResultParser from './InnertubeResultParser';
import { PluginConfig } from '../types';
import { I18nOptions, PluginConfigSchema } from '../types/PluginConfig';

export const PLUGIN_CONFIG_SCHEMA: PluginConfigSchema = {
  region: { defaultValue: 'US', json: false },
  language: { defaultValue: 'en', json: false },
  rootContentType: { defaultValue: 'full', json: false },
  loadFullPlaylists: { defaultValue: false, json: false },
  autoplay: { defaultValue: false, json: false },
  autoplayClearQueue: { defaultValue: false, json: false },
  autoplayPrefMixRelated: { defaultValue: false, json: false },
  addToHistory: { defaultValue: true, json: false },
  liveStreamQuality: { defaultValue: 'auto', json: false },
  prefetch: { defaultValue: true, json: false },
  ytPlaybackMode: { defaultValue: {
    feedVideos: true,
    playlistVideos: false
  }, json: true},
  authCredentials: { defaultValue: undefined, json: true }
};

export default class ConfigModel extends BaseModel {

  async getI18nOptions(): Promise<I18nOptions> {
    const cached = yt2.get('configI18nOptions');
    if (cached) {
      return cached;
    }

    const __createPredicate = (targetSelectCommandKey: string, targetCodeProp: string) => {
      return (key: string, value: any) => {
        // Match is true if:
        // 1. property is identified by `key` = 'multiPageMenuRenderer'; and
        // 2. somewhere in the nested properties of `value`, there exists `targetSelectCommandKey` which itself has the property `targetCodeProp`
        // We use a second predicate for testing condition 2.

        const secondaryPredicate = (k: string, v: any) => {
          return (k === targetSelectCommandKey && v[targetCodeProp]);
        };

        return key === 'multiPageMenuRenderer' && findInObject(value, secondaryPredicate).length > 0;
      };
    };

    const __parseMenu = (contents: RawNode, targetSelectCommandKey: string, targetCodeProp: string) => {
      const header = Parser.parseItem(contents.header);
      let label: string | null = null;
      if (header?.hasKey('title')) {
        label = InnertubeResultParser.unwrap(header.title);
      }
      const menuItems = findInObject(contents, (key, value) => {
        return key === 'compactLinkRenderer' && value.serviceEndpoint?.signalServiceEndpoint?.actions?.find((action: any) => action[targetSelectCommandKey]);
      });
      const optionValues = menuItems.reduce((ov, item) => {
        const label = InnertubeResultParser.unwrap(new YTMisc.Text(item.title));
        const value = new YTNodes.NavigationEndpoint(item.serviceEndpoint)?.payload?.actions?.find((action: any) => action[targetSelectCommandKey])?.[targetSelectCommandKey]?.[targetCodeProp];

        if (label && value) {
          ov.push({ label, value });
        }

        return ov;
      }, []);

      if (optionValues.length > 0) {
        return {
          label,
          optionValues
        };
      }

      return null;
    };

    let noCache = false;
    const contents = await this.#fetchAccountMenu();
    const languageMenu = findInObject(contents, __createPredicate('selectLanguageCommand', 'hl'))?.[0];
    const regionMenu = findInObject(contents, __createPredicate('selectCountryCommand', 'gl'))?.[0];

    const defualtI18nOptions = this.#getDefaultI18nOptions();
    const results: PluginConfig.I18nOptions = {};

    if (languageMenu) {
      const languageOption = __parseMenu(languageMenu, 'selectLanguageCommand', 'hl');
      if (languageOption) {
        results.language = {
          label: languageOption.label || defualtI18nOptions.language.label,
          optionValues: languageOption.optionValues
        };
      }
    }

    if (regionMenu) {
      const regionOption = __parseMenu(regionMenu, 'selectCountryCommand', 'gl');
      if (regionOption) {
        results.region = {
          label: regionOption.label || defualtI18nOptions.region.label,
          optionValues: regionOption.optionValues
        };
      }
    }

    if (!results.language) {
      results.language = defualtI18nOptions.language;
      noCache = true;
    }

    if (!results.region) {
      results.region = defualtI18nOptions.region;
      noCache = true;
    }


    if (!noCache) {
      yt2.set('configI18nOptions', results);
    }

    return results;
  }

  clearCache() {
    yt2.set('configI18nOptions', null);
  }

  async #fetchAccountMenu() {
    const { innertube } = await this.getInnertube();

    const requestData = {
      client: 'WEB'
    };

    try {
      const response = await innertube.session.http.fetch('/account/account_menu', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return JSON.parse(await response.text());
    }
    catch (error) {
      yt2.getLogger().error(yt2.getErrorMessage('[youtube2] Error in ConfigModel.#fetchAccountMenu(): ', error));
      return null;
    }
  }

  getRootContentTypeOptions() {
    return [
      {
        'label': yt2.getI18n('YOUTUBE2_SIMPLE'),
        'value': 'simple'
      },
      {
        'label': yt2.getI18n('YOUTUBE2_FULL'),
        'value': 'full'
      }
    ];
  }

  getLiveStreamQualityOptions() {
    return [
      {
        'label': yt2.getI18n('YOUTUBE2_AUTO'),
        'value': 'auto'
      },
      {
        'label': '144p',
        'value': '144p'
      },
      {
        'label': '240p',
        'value': '240p'
      },
      {
        'label': '360p',
        'value': '360p'
      },
      {
        'label': '480p',
        'value': '480p'
      },
      {
        'label': '720p',
        'value': '720p'
      },
      {
        'label': '1080p',
        'value': '1080p'
      }
    ];
  }

  #getDefaultI18nOptions() {
    return {
      region: {
        label: yt2.getI18n('YOUTUBE2_REGION'),
        optionValues: [
          { label: 'United States', value: 'US' }
        ]
      },
      language: {
        label: yt2.getI18n('YOUTUBE2_LANGUAGE'),
        optionValues: [
          { label: 'English (US)', value: 'en' }
        ]
      }
    };
  }
}
