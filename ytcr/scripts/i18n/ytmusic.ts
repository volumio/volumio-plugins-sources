import { I18nOptions, InnertubeInstance } from './common';

const CATEGORY_IDS = {
  'i18n': 'SETTING_CAT_I18N'
} as Record<string, string>;

const OPTION_IDS = {
  'region': 'I18N_REGION',
  'language': 'I18N_LANGUAGE'
} as Record<string, string>;

export async function getI18nOptions(): Promise<I18nOptions> {
  const response = await fetchSettingsPage();
  const settings = getCategoryFromSettingsPageResponse('i18n', response);

  const result = Array.isArray(settings?.items) ? (settings.items as any[]).reduce<I18nOptions>((options, item: any) => {
    const optionId = item.settingSingleOptionMenuRenderer?.itemId;
    let key: string | null;
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
    if (key === 'region' || key === 'language') {
      options[key] = item.settingSingleOptionMenuRenderer.items?.map((item: any) => ({
        label: item.settingMenuItemRenderer?.name,
        value: item.settingMenuItemRenderer?.value
      }));
    }
    return options;
  }, {}) : {};

  return result;
}

async function fetchSettingsPage(): Promise<any> {
  const innerTube = await InnertubeInstance.get();

  const requestPayload = {
    client: 'YTMUSIC'
  };

  const response = await innerTube.session.http.fetch('/account/get_setting', {
    method: 'POST',
    body: JSON.stringify(requestPayload),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return JSON.parse(await response.text());
}

function getCategoryFromSettingsPageResponse(categoryName: string, response: any) {
  const categoryId = CATEGORY_IDS[categoryName];
  if (categoryId) {
    return response?.items?.find((item: any) => item.settingCategoryCollectionRenderer?.categoryId === categoryId).settingCategoryCollectionRenderer || null;
  }
  return null;
}
