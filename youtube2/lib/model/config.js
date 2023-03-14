'use strict';

const yt2 = require('../youtube2');
const utils = require('../utils');
const innerTubeLib = require('volumio-youtubei.js');
const Text = innerTubeLib.Misc.Text;
const Parser = innerTubeLib.Parser;
const NavigationEndpoint = innerTubeLib.YTNodes.NavigationEndpoint;
const { InnerTubeParser, InnerTubeBaseModel } = require('./innertube');

const DEFAULT_I18N_OPTIONS = {
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

const ROOT_CONTENT_TYPE_OPTIONS = [
  {
    "label": yt2.getI18n('YOUTUBE2_SIMPLE'),
    "value": "simple"
  },
  {
    "label": yt2.getI18n('YOUTUBE2_FULL'),
    "value": "full"
  }
];

const LIVE_STREAM_QUALITY_OPTIONS = [
  {
    "label": yt2.getI18n('YOUTUBE2_AUTO'),
    "value": "auto"
  },
  {
    "label": "144p",
    "value": "144p"
  },
  {
    "label": "240p",
    "value": "240p"
  },
  {
    "label": "360p",
    "value": "360p"
  },
  {
    "label": "480p",
    "value": "480p"
  },
  {
    "label": "720p",
    "value": "720p"
  },
  {
    "label": "1080p",
    "value": "1080p"
  }
];

class ConfigModel extends InnerTubeBaseModel {

  async getI18nOptions() {
    const cached = yt2.get('configI18nOptions');
    if (cached) {
      return cached;
    }

    const __createPredicate = (targetSelectCommandKey, targetCodeProp) => {
      return (key, value) => {
        // Match is true if:
        // 1. property is identified by `key` = 'multiPageMenuRenderer'; and
        // 2. somewhere in the nested properties of `value`, there exists `targetSelectCommandKey` which itself has the property `targetCodeProp`
        // We use a second predicate for testing condition 2.

        const secondaryPredicate = (k, v) => {
          return (k === targetSelectCommandKey && v[targetCodeProp])
        }

        return key === 'multiPageMenuRenderer' && utils.findInObject(value, secondaryPredicate).length > 0;
      };
    };

    const __parseMenu = (contents, targetSelectCommandKey, targetCodeProp) => {
      const label = InnerTubeParser.unwrap(Parser.parseItem(contents.header)?.title);
      const menuItems = utils.findInObject(contents, (key, value) => {
        return key === 'compactLinkRenderer' && value.serviceEndpoint?.signalServiceEndpoint?.actions?.find((action) => action[targetSelectCommandKey]);
      });
      const optionValues = menuItems.reduce((ov, item) => {
        const label = InnerTubeParser.unwrap(new Text(item.title));
        const value = new NavigationEndpoint(item.serviceEndpoint)?.payload?.actions?.find((action) => action[targetSelectCommandKey])?.[targetSelectCommandKey]?.[targetCodeProp];

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
    const contents = await this._fetchAccountMenu();
    const languageMenu = utils.findInObject(contents, __createPredicate('selectLanguageCommand', 'hl'))?.[0];
    const regionMenu = utils.findInObject(contents, __createPredicate('selectCountryCommand', 'gl'))?.[0];

    const results = {};

    if (languageMenu) {
      const languageOption = __parseMenu(languageMenu, 'selectLanguageCommand', 'hl');
      if (languageOption) {
        results.language = {
          label: languageOption.label || DEFAULT_I18N_OPTIONS.language.label,
          optionValues: languageOption.optionValues
        };
      }
    }

    if (regionMenu) {
      const regionOption = __parseMenu(regionMenu, 'selectCountryCommand', 'gl');
      if (regionOption) {
        results.region = {
          label: regionOption.label || DEFAULT_I18N_OPTIONS.region.label,
          optionValues: regionOption.optionValues
        };
      }
    }

    if (!results.language) {
      results.language = DEFAULT_I18N_OPTIONS.language;
      noCache = true;
    }

    if (!results.region) {
      results.region = DEFAULT_I18N_OPTIONS.region;
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

  async _fetchAccountMenu() {
    const innerTube = this.getInnerTube();

    const requestData = {
      client: 'WEB'
    };

    try {
      const response = await innerTube.session.http.fetch(`/account/account_menu`, {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'Content-Type': 'application/json'
        },
      });

      return JSON.parse(await response.text());
    } catch (error) {
      yt2.getLogger().error(yt2.getErrorMessage('[youtube2] Error in ConfigModel._fetchAccountMenu(): ', error));
      return null;
    }
  }

  getRootContentTypeOptions() {
    return ROOT_CONTENT_TYPE_OPTIONS;
  }

  getLiveStreamQualityOptions() {
    return LIVE_STREAM_QUALITY_OPTIONS;
  }
}

module.exports = ConfigModel;
