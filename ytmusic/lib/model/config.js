'use strict';

const Text = require('volumio-youtubei.js').Misc.Text;
const ytmusic = require(ytmusicPluginLibRoot + '/ytmusic');
const BaseModel = require(__dirname + '/base');

const CATEGORY_IDS = {
  'i18n': 'SETTING_CAT_I18N'
};

const OPTION_IDS = {
  'region': 'I18N_REGION',
  'language': 'I18N_LANGUAGE'
}

const DEFAULT_I18N_OPTIONS = {
  region: {
    label: ytmusic.getI18n('YTMUSIC_REGION'),
    optionValues: [
      {label: 'United States', value: 'US'}
    ]
  },
  language: {
    label: ytmusic.getI18n('YTMUSIC_LANGUAGE'),
    optionValues: [
      {label: 'English (US)', value: 'en'}
    ]
  }
};

class ConfigModel extends BaseModel {

  async getI18nOptions() {
    const cached = ytmusic.get('configI18nOptions');
    if (cached) {
      return cached;
    }

    let noCache = false;
    const response = await this._fetchSettingsPage();
    const settings = this._getCategoryFromSettingsPageResponse('i18n', response);

    if (!settings) {
      noCache = true;
    }

    const result = settings?.items?.reduce((result, item) => {
      const optionId = item.settingSingleOptionMenuRenderer?.itemId;
      let key;
      switch(optionId) {
        case OPTION_IDS['region']:
          key = 'region';
          break;
        case OPTION_IDS['language']:
          key = 'language';
          break;
        default:
          key = null
      }
      if (key) {
        result[key] = {
          label: new Text(item.settingSingleOptionMenuRenderer.title).text,
          optionValues: item.settingSingleOptionMenuRenderer.items?.map((item) => ({
            label: item.settingMenuItemRenderer?.name,
            value: item.settingMenuItemRenderer?.value
          }))
        }
        return result;
      }
    }, {}) || {};

    ['region', 'language'].forEach((key) => {
      if (!result[key]) {
        result[key] = {};
      }
      if (!result[key].optionValues || result[key].optionValues.length === 0) {
        noCache = true;
        result[key].optionValues = DEFAULT_I18N_OPTIONS[key].optionValues;
      }
      if (!result[key].label) {
        result[key].label = DEFAULT_I18N_OPTIONS[key].label;
      }
    });

    if (!noCache) {
      ytmusic.set('configI18nOptions', result);
    }

    return result;
  }

  clearCache() {
    ytmusic.set('configI18nOptions', null);
  }

  async _fetchSettingsPage() {
    const innerTube = this.getInnerTube();

    const requestData = {
      client: 'YTMUSIC'
    };

    try {
      const response = await innerTube.session.http.fetch(`/account/get_setting`, {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'Content-Type': 'application/json'
        },
      });

      return JSON.parse(await response.text());
    } catch (error) {
      ytmusic.getLogger().error(ytmusic.getErrorMessage('[ytmusic] Error in ConfigModel._fetchSettingsPage(): ', error));
      return null;
    }
  }

  _getCategoryFromSettingsPageResponse(categoryName, response) {
    const categoryId = CATEGORY_IDS[categoryName];
    if (categoryId) {
      return response?.items?.find((item) => item.settingCategoryCollectionRenderer?.categoryId === categoryId).settingCategoryCollectionRenderer || null;
    }
    return null;
  }
}

module.exports = ConfigModel;
