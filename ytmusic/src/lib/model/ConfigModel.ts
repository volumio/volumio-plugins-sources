import { Misc as YTMisc } from 'volumio-youtubei.js';
import ytmusic from '../YTMusicContext';
import { I18nOptionValue, I18nOptions, PluginConfigSchema } from '../types/PluginConfig';
import { BaseModel } from './BaseModel';

const CATEGORY_IDS: Record<string, string> = {
  'i18n': 'SETTING_CAT_I18N'
};

const OPTION_IDS: Record<string, string> = {
  'region': 'I18N_REGION',
  'language': 'I18N_LANGUAGE'
};

export const PLUGIN_CONFIG_SCHEMA: PluginConfigSchema = {
  region: { defaultValue: 'US', json: false },
  language: { defaultValue: 'en', json: false },
  loadFullPlaylists: { defaultValue: false, json: false },
  autoplay: { defaultValue: false, json: false },
  autoplayClearQueue: { defaultValue: false, json: false },
  addToHistory: { defaultValue: true, json: false },
  prefetch: { defaultValue: true, json: false },
  preferOpus: { defaultValue: false, json: false },
  authCredentials: { defaultValue: undefined, json: true }
};

export default class ConfigModel extends BaseModel {

  async getI18nOptions() {
    const cached = ytmusic.get<I18nOptions>('configI18nOptions');
    if (cached) {
      return cached;
    }

    const response = await this.#fetchSettingsPage();
    const settings = this.#getCategoryFromSettingsPageResponse('i18n', response);

    if (Array.isArray(settings?.items)) {
      const tmpResult = (settings.items as Array<any>).reduce<Partial<I18nOptions>>((result, item) => {
        const optionId = item.settingSingleOptionMenuRenderer?.itemId;
        let key: keyof I18nOptions | null;
        switch (optionId) {
          case OPTION_IDS['region']:
            key = 'region';
            break;
          case OPTION_IDS['language']:
            key = 'language';
            break;
          default:
            key = null;
        }
        if (key) {
          const label = new YTMisc.Text(item.settingSingleOptionMenuRenderer.title).text;
          let optionValues: I18nOptionValue[] | null = null;
          if (Array.isArray(item.settingSingleOptionMenuRenderer.items)) {
            optionValues = (item.settingSingleOptionMenuRenderer.items as Array<any>).reduce<I18nOptionValue[]>((result, item: any) => {
              const label = item.settingMenuItemRenderer?.name;
              const value = item.settingMenuItemRenderer?.value;
              if (label && value) {
                result.push({ label, value });
              }
              return result;
            }, []);
          }
          if (label && optionValues && optionValues.length > 0) {
            result[key] = { label, optionValues };
          }
        }
        return result;
      }, {});

      const defaultI18nOptions = this.#getDefaultI18nOptions();
      const result: I18nOptions = {
        region: tmpResult.region || defaultI18nOptions.region,
        language: tmpResult.language || defaultI18nOptions.language
      };
      if (tmpResult.region && tmpResult.language) {
        ytmusic.set('configI18nOptions', result);
      }

      return result;
    }

    return { ...this.#getDefaultI18nOptions() };
  }

  clearCache() {
    ytmusic.set('configI18nOptions', null);
  }

  async #fetchSettingsPage() {
    const { innertube } = await this.getInnertube();

    const requestData = {
      client: 'YTMUSIC'
    };

    try {
      const response = await innertube.session.http.fetch('/account/get_setting', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return JSON.parse(await response.text());
    }
    catch (error) {
      ytmusic.getLogger().error(ytmusic.getErrorMessage('[ytmusic] Error in ConfigModel._fetchSettingsPage(): ', error));
      return null;
    }
  }

  #getCategoryFromSettingsPageResponse(categoryName: string, response: any) {
    const categoryId = CATEGORY_IDS[categoryName];
    if (categoryId) {
      return response?.items?.find((item: any) => item.settingCategoryCollectionRenderer?.categoryId === categoryId).settingCategoryCollectionRenderer || null;
    }
    return null;
  }

  #getDefaultI18nOptions(): I18nOptions {
    return {
      region: {
        label: ytmusic.getI18n('YTMUSIC_REGION'),
        optionValues: [
          { label: 'United States', value: 'US' }
        ]
      },
      language: {
        label: ytmusic.getI18n('YTMUSIC_LANGUAGE'),
        optionValues: [
          { label: 'English (US)', value: 'en' }
        ]
      }
    };
  }
}
