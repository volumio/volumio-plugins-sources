import locales from 'windows-locale';
import np from '../NowPlayingContext';

interface ListEntry {
  value: string;
  label: string;
}

export default class ConfigHelper {

  static parseCoordinates(str: string) {
    if (!str) {
      return null;
    }
    const parts = str.split(',');
    if (parts[0] !== undefined && parts[1] !== undefined) {
      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);

      if (!isNaN(lat) && !isNaN(lon)) {
        return { lat, lon };
      }
    }

    return null;
  }

  static getVolumioLocale() {
    return np.getLanguageCode().replace('_', '-');
  }

  static getLocaleList() {
    let localeList = np.get<ListEntry[]>('localeList');
    const matchVolumioLabel = np.getI18n('NOW_PLAYING_LOCALE_VOLUMIO', this.getVolumioLocale());
    if (!localeList) {
      localeList = [
        {
          value: 'matchVolumio',
          label: matchVolumioLabel
        },
        {
          value: 'matchClient',
          label: np.getI18n('NOW_PLAYING_LOCALE_CLIENT')
        },
        {
          value: 'localeListDivider',
          label: '----------------------------------------'
        }
      ];
      for (const lc of Object.values(locales)) {
        localeList.push({
          value: lc.tag,
          label: `${lc.language + (lc.location ? ` (${lc.location})` : '')} - ${lc.tag}`
        });
      }
      np.set('localeList', localeList);
    }
    else {
      localeList[0].label = matchVolumioLabel;
    }
    return localeList;
  }

  static async getTimezoneList() {
    let timezoneList = np.get<ListEntry[]>('timezoneList');
    if (!timezoneList) {
      timezoneList = [
        {
          value: 'matchClient',
          label: np.getI18n('NOW_PLAYING_TIMEZONE_CLIENT')
        },
        {
          value: 'matchGeoCoordinates',
          label: np.getI18n('NOW_PLAYING_TIMEZONE_GEO_COORD')
        },
        {
          value: 'timezoneListDivider',
          label: '----------------------------------------'
        }
      ];
      const ct = await import('countries-and-timezones');
      for (const tz of Object.values(ct.getAllTimezones())) {
        timezoneList.push({
          value: tz.name,
          label: `${tz.name} (GMT${tz.utcOffsetStr})`
        });
      }
      np.set('timezoneList', timezoneList);
    }
    return timezoneList;
  }
}
