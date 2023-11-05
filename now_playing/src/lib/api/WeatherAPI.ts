import OpenWeatherMapAPI, { OpenWeatherMapAPIGetWeatherResult } from './openweathermap';
import md5 from 'md5';
import np from '../NowPlayingContext';
import Cache from '../utils/Cache';
import ConfigHelper from '../config/ConfigHelper';
import { DefaultLocalizationSettings } from 'now-playing-common';
import { getPluginInfo } from '../utils/System';
import { WeatherData, WeatherDataCurrent, WeatherDataForecastDay, WeatherDataHourly, WeatherDataLocation } from 'now-playing-common';

const WEATHER_ICONS_BASE_PATH = '/assets/weather-icons';
const ICON_CODE_MAPPINGS: Record<string, string> = {
  '01d': 'clear-day.svg',
  '01n': 'clear-night.svg',
  '02d': 'partly-cloudy-day.svg',
  '02n': 'partly-cloudy-night.svg',
  '03d': 'cloudy.svg',
  '03n': 'cloudy.svg',
  '04d': 'overcast-day.svg',
  '04n': 'overcast-night.svg',
  '09d': 'partly-cloudy-day-drizzle.svg',
  '09n': 'partly-cloudy-night-drizzle.svg',
  '10d': 'partly-cloudy-day-rain.svg',
  '10n': 'partly-cloudy-night-rain.svg',
  '11d': 'thunderstorms-day.svg',
  '11n': 'thunderstorms-night.svg',
  '13d': 'partly-cloudy-day-snow.svg',
  '13n': 'partly-cloudy-night-snow.svg',
  '50d': 'mist.svg',
  '50n': 'mist.svg',
  '_humidity': 'humidity.svg',
  '_windSpeed': 'wind.svg'
};

export interface WeatherAPIConfig {
  coordinates: string;
  units: 'imperial' | 'metric' | 'standard';
}

export interface WeatherAPIParsedConfig {
  coordinates?: {
    lon: number;
    lat: number;
  };
  units: 'imperial' | 'metric' | 'standard';
}

class WeatherAPI {

  #api: OpenWeatherMapAPI;
  #fetchPromises: {
    [key: string]: Promise<WeatherData>;
  };
  #cache: Cache;
  #config: WeatherAPIParsedConfig;
  #ready: boolean;

  constructor() {
    this.#api = new OpenWeatherMapAPI();
    this.#fetchPromises = {};
    this.#cache = new Cache({ weather: 600 }, { weather: 10 });
    this.#config = {
      units: DefaultLocalizationSettings.unitSystem
    };
    this.#ready = false;
  }

  clearCache() {
    this.#cache.clear();
  }

  setConfig(opts: WeatherAPIConfig) {
    const { coordinates, units } = opts;
    const coord = ConfigHelper.parseCoordinates(coordinates);
    this.#ready = !!coord;
    if (!coord) {
      return;
    }
    let configChanged = false;
    const {coordinates: currentCoordinates, units: currentUnits} = this.#config;
    if (coord.lat !== currentCoordinates?.lat || coord.lon !== currentCoordinates?.lon) {
      this.#api.setCoordinates(coord.lat, coord.lon);
      configChanged = true;
    }
    if (units !== undefined && currentUnits !== units) {
      this.#api.setUnits(units);
      configChanged = true;
    }
    if (configChanged) {
      this.#config = {
        ...this.#config,
        coordinates: coord,
        units
      };

      this.fetchInfo().then((refreshedInfo) => {
        np.broadcastMessage('npPushWeatherOnServiceChange', {
          success: true,
          data: refreshedInfo
        });
      })
        .catch((e) => {
          np.broadcastMessage('npPushWeatherOnServiceChange', {
            success: false,
            error: e.message || e
          });
        });
    }
  }

  #getFetchPromise(callback: () => Promise<WeatherData>): Promise<WeatherData> {
    const key = md5(JSON.stringify(this.#config));
    if (Object.keys(this.#fetchPromises).includes(key)) {
      return this.#fetchPromises[key];
    }

    const promise = callback();
    this.#fetchPromises[key] = promise;
    promise.finally(() => {
      delete this.#fetchPromises[key];
    });
    return promise;

  }

  #getWeatherIconPath(iconCode: string, style: string, animated: boolean) {
    if (ICON_CODE_MAPPINGS[iconCode]) {
      return `${WEATHER_ICONS_BASE_PATH}/${style}/svg${(!animated ? '-static' : '')}/${ICON_CODE_MAPPINGS[iconCode]}`;
    }

    return null;

  }

  #getWeatherIconUrls(appUrl: string, iconCode?: string) {
    if (!iconCode) {
      iconCode = '';
    }
    return {
      'filledStatic': appUrl + this.#getWeatherIconPath(iconCode, 'fill', false),
      'filledAnimated': appUrl + this.#getWeatherIconPath(iconCode, 'fill', true),
      'outlineStatic': appUrl + this.#getWeatherIconPath(iconCode, 'line', false),
      'outlineAnimated': appUrl + this.#getWeatherIconPath(iconCode, 'line', true),
      'monoStatic': appUrl + this.#getWeatherIconPath(iconCode, 'monochrome', false),
      'monoAnimated': appUrl + this.#getWeatherIconPath(iconCode, 'monochrome', true)
    };
  }

  #getTemperatureText(value?: number, short = false) {
    if (value === undefined) {
      return 'NaN';
    }
    const valueText = value.toFixed(0);
    if (short) {
      return `${valueText}°`;
    }
    switch (this.#config.units) {
      case 'metric':
        return `${valueText}°C`;
      case 'imperial':
        return `${valueText}°F`;
      default: // 'standard'
        return `${valueText}K`;
    }
  }

  #getWindSpeedText(value?: number) {
    if (value === undefined) {
      return 'NaN';
    }
    const valueText = value.toFixed(1);
    switch (this.#config.units) {
      case 'metric': // Meter/s
        return `${valueText} m/s`;
      case 'imperial': // Miles per hour
        return `${valueText} mph`;
      default: // 'standard' - meter/s
        return `${valueText} m/s`;
    }
  }

  #getHumidityText(value?: number) {
    if (value === undefined) {
      return 'NaN';
    }
    return `${value.toFixed(0)}%`;
  }

  #parseLocation(data: OpenWeatherMapAPIGetWeatherResult): WeatherDataLocation {
    const locationData = data.location;
    return {
      name: locationData.name || '',
      country: locationData.country || ''
    };
  }

  #parseCurrent(data: OpenWeatherMapAPIGetWeatherResult) {
    const currentData = data.current;
    const appUrl = getPluginInfo().appUrl;
    const temp = currentData.temp.now;
    const humidity = currentData.humidity;
    const windSpeed = currentData.windSpeed;
    const tempMin = currentData.temp.min;
    const tempMax = currentData.temp.max;
    const result: WeatherDataCurrent = {
      temp: {
        now: {
          value: temp || NaN,
          text: this.#getTemperatureText(temp),
          shortText: this.#getTemperatureText(temp, true)
        },
        min: {
          value: tempMin || NaN,
          text: this.#getTemperatureText(tempMin),
          shortText: this.#getTemperatureText(tempMin, true)
        },
        max: {
          value: tempMax || NaN,
          text: this.#getTemperatureText(tempMax),
          shortText: this.#getTemperatureText(tempMax, true)
        }
      },
      humidity: {
        value: humidity || NaN,
        text: this.#getHumidityText(humidity)
      },
      windSpeed: {
        value: windSpeed || NaN,
        text: this.#getWindSpeedText(windSpeed)
      },
      iconUrl: {
        condition: this.#getWeatherIconUrls(appUrl, currentData.icon),
        humidity: this.#getWeatherIconUrls(appUrl, '_humidity'),
        windSpeed: this.#getWeatherIconUrls(appUrl, '_windSpeed')
      }
    };
    return result;
  }

  #parseForecast(data: OpenWeatherMapAPIGetWeatherResult) {
    const appUrl = getPluginInfo().appUrl;
    const forecast: WeatherDataForecastDay[] = [];
    for (const dailyWeather of data.daily) {
      const tempMin = dailyWeather.temp.min;
      const tempMax = dailyWeather.temp.max;
      const humidity = dailyWeather.humidity;
      const windSpeed = dailyWeather.windSpeed;
      forecast.push({
        temp: {
          min: {
            value: tempMin || NaN,
            text: this.#getTemperatureText(tempMin),
            shortText: this.#getTemperatureText(tempMin, true)
          },
          max: {
            value: tempMax || NaN,
            text: this.#getTemperatureText(tempMax),
            shortText: this.#getTemperatureText(tempMax, true)
          }
        },
        humidity: {
          value: humidity || NaN,
          text: this.#getHumidityText(humidity)
        },
        windSpeed: {
          value: windSpeed || NaN,
          text: this.#getWindSpeedText(windSpeed)
        },
        iconUrl: {
          condition: this.#getWeatherIconUrls(appUrl, dailyWeather.icon),
          humidity: this.#getWeatherIconUrls(appUrl, '_humidity'),
          windSpeed: this.#getWeatherIconUrls(appUrl, '_windSpeed')
        },
        dateTimeMillis: dailyWeather.dateTimeMillis || NaN
      });
    }
    return forecast.slice(1); // First day of forecast is actually current day
  }

  #parseHourly(data: OpenWeatherMapAPIGetWeatherResult) {
    const appUrl = getPluginInfo().appUrl;
    const hourly: WeatherDataHourly[] = [];
    for (const hourlyWeather of data.hourly) {
      const temp = hourlyWeather.temp;
      const humidity = hourlyWeather.humidity;
      const windSpeed = hourlyWeather.windSpeed;
      hourly.push({
        temp: {
          value: temp || NaN,
          text: this.#getTemperatureText(temp),
          shortText: this.#getTemperatureText(temp, true)
        },
        humidity: {
          value: humidity || NaN,
          text: this.#getHumidityText(humidity)
        },
        windSpeed: {
          value: windSpeed || NaN,
          text: this.#getWindSpeedText(windSpeed)
        },
        iconUrl: {
          condition: this.#getWeatherIconUrls(appUrl, hourlyWeather.icon),
          humidity: this.#getWeatherIconUrls(appUrl, '_humidity'),
          windSpeed: this.#getWeatherIconUrls(appUrl, '_windSpeed')
        },
        dateTimeMillis: hourlyWeather.dateTimeMillis || NaN
      });
    }
    return hourly;
  }

  async #doFetchInfo(): Promise<WeatherData> {
    return this.#getFetchPromise(async() => {
      const weather = await this.#api.getWeather();

      return {
        location: this.#parseLocation(weather),
        current: this.#parseCurrent(weather),
        forecast: this.#parseForecast(weather),
        hourly: this.#parseHourly(weather),
        units: this.#config.units
      };
    });
  }

  async fetchInfo() {
    if (!this.#ready) {
      throw Error(np.getI18n('NOW_PLAYING_ERR_WEATHER_MISCONFIG'));
    }
    try {
      const cacheKey = md5(JSON.stringify(this.#config));
      return await this.#cache.getOrSet('weather', cacheKey, () => this.#doFetchInfo());
    }
    catch (e: any) {
      const msg = np.getI18n('NOW_PLAYING_ERR_WEATHER_FETCH') + (e.message ? `: ${e.message}` : '');
      throw Error(msg);
    }
  }
}

const weatherAPI = new WeatherAPI();

export default weatherAPI;
