import lodash from 'lodash';
import np from '../NowPlayingContext';
import ConfigHelper from './ConfigHelper';
import { CommonSettingsCategory, CommonSettingsOf, DefaultSettings } from 'now-playing-common';

const mergeSettingsCustomizer = (target: any, src: any): any => {
  if (typeof target === 'object') {
    return lodash.mergeWith(target, src, mergeSettingsCustomizer);
  }
  if (target === undefined || target === null || (typeof target === 'string' && target.trim() === '')) {
    return src;
  }
  return target;
};

export default class CommonSettingsLoader {

  static get<T extends CommonSettingsCategory>(category: T) {
    if (category === CommonSettingsCategory.Localization) {
      return this.#getLocalizationSettings() as unknown as CommonSettingsOf<T>;
    }

    return this.#getDefaultNormalized(category);
  }

  static #getLocalizationSettings() {
    const localization = this.#getDefaultNormalized(CommonSettingsCategory.Localization);

    switch (localization.locale) {
      case 'matchVolumio':
        localization.resolvedLocale = ConfigHelper.getVolumioLocale();
        break;
      case 'matchClient':
      case 'localeListDivider':
        localization.resolvedLocale = null;
        break;
      default:
        localization.resolvedLocale = localization.locale;
    }

    switch (localization.timezone) {
      case 'matchClient':
      case 'timezoneListDivider':
        localization.resolvedTimezone = null;
        break;
      case 'matchGeoCoordinates':
        localization.resolvedTimezone = localization.geoTimezone || null;
        break;
      default:
        localization.resolvedTimezone = localization.timezone;
    }

    return localization;
  }

  static #getDefaultNormalized<T extends CommonSettingsCategory>(category: T): CommonSettingsOf<T> {
    const settings = np.getConfigValue(category);
    const merged = lodash.mergeWith({}, settings, DefaultSettings[category], mergeSettingsCustomizer);
    return merged;
  }
}
