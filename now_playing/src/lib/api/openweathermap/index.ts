import fetch from 'node-fetch';
import np from '../../NowPlayingContext';

const BASE_URL = 'https://openweathermap.org';
const ONECALL_PATH = '/data/2.5/onecall';
const WEATHER_PATH = '/data/2.5/weather';

async function fetchPage(url: string, json = false) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      return json ? response.json() : response.text();
    }
    throw Error(`Response error: ${response.status} - ${response.statusText}`);
  }
  catch (error) {
    np.getLogger().error(np.getErrorMessage(`[now-playing] Error fetching ${url}:`, error));
    throw error;
  }
}

export interface OpenWeatherMapAPIConstructorOptions {
  lat?: number;
  lon?: number;
  lang?: string;
  units?: string;
}

export interface OpenWeatherMapAPIGetWeatherResult {
  location: {
    name?: string;
    country?: string;
  };
  current: {
    temp: {
      now?: number;
      min?: number;
      max?: number;
    };
    humidity?: number;
    windSpeed?: number;
    icon?: string;
  };
  daily: {
    temp: {
      min?: number;
      max?: number;
    };
    humidity?: number;
    windSpeed?: number;
    icon?: string;
    dateTimeMillis?: number;
  }[];
  hourly: {
    temp?: number;
    humidity?: number;
    windSpeed?: number;
    icon?: string;
    dateTimeMillis?: number;
  }[];
}

export default class OpenWeatherMapAPI {

  #apiKey: string | null;
  #apiKeyPromise: Promise<any> | null;
  #coordinates: { lat: number, lon: number } | null;
  #lang: string | null;
  #units: string | null;

  constructor(args?: OpenWeatherMapAPIConstructorOptions) {
    this.#apiKey = null;
    this.#apiKeyPromise = null;
    this.#coordinates = null;
    this.#lang = null;
    this.#units = null;

    if (args?.lat !== undefined && args?.lon !== undefined && !isNaN(args.lat) && !isNaN(args.lon)) {
      this.setCoordinates(args.lat, args.lon);
    }
    if (args?.lang) {
      this.setLang(args.lang);
    }
    if (args?.units) {
      this.setUnits(args.units);
    }
  }

  setCoordinates(lat: number, lon: number) {
    if (typeof lat === 'number' && typeof lon === 'number' && -90 <= lat && lat <= 90 && -180 <= lon && lon <= 180) {
      this.#coordinates = { lat, lon };
      return;
    }

    throw Error('Invalid coordinates');
  }

  setLang(lang: string) {
    this.#lang = lang;
  }

  setUnits(units: string) {
    this.#units = units;
  }

  async #getApiKey() {
    if (this.#apiKey) {
      return this.#apiKey;
    }

    if (this.#apiKeyPromise) {
      return this.#apiKeyPromise;
    }

    const doGet = async () => {
      np.getLogger().info('[now-playing] Fetching API key...');
      const widgetPathRegExp = /<script(?:\s+)src=['"]((?:.+)weather-app.(?:.+).js)['"]><\/script>/gm;
      const appIdRegExp = /appid:"(.+?)"/gm;

      const page = await fetchPage(BASE_URL);
      const widgetPath = page ? widgetPathRegExp.exec(page)?.[1] : null;
      const widgetSrc = widgetPath ? await fetchPage(new URL(widgetPath, BASE_URL).toString()) : Promise.resolve(null);
      const appId = widgetSrc ? appIdRegExp.exec(widgetSrc)?.[1] : null;

      if (!appId) {
        throw Error('Could not obtain API key');
      }

      return appId;
    };

    this.#apiKeyPromise = doGet()
      .then((appId) => {
        this.#apiKey = appId;
        np.getLogger().info('[now-playing] OpenWeatherMap API key obtained.');
        return appId;
      })
      .finally(() => {
        this.#apiKeyPromise = null;
      });

    return this.#apiKeyPromise;
  }

  async getWeather(): Promise<OpenWeatherMapAPIGetWeatherResult> {
    const fetchData = async (forceRefreshApiKey = false): Promise<any> => {
      if (forceRefreshApiKey) {
        this.#apiKey = null;
      }

      const [ oneCallUrl, weatherUrl ] = await Promise.all([
        this.#createUrl(ONECALL_PATH),
        this.#createUrl(WEATHER_PATH)
      ]);

      // Note that location data is actually resolved from
      // WeatherUrl, whereas the rest is from onecall.
      try {
        return await Promise.all([
          fetchPage(oneCallUrl, true),
          fetchPage(weatherUrl, true)
        ]);
      }
      catch (error) {
        if (!forceRefreshApiKey) {
          // Retry with forceRefreshApiKey
          return fetchData(true);
        }

        throw error;
      }
    };

    const [ weatherData, locationData ] = await fetchData();
    const result = {
      location: this.#parseLocation(locationData),
      current: this.#parseCurrent(weatherData),
      daily: this.#parseDaily(weatherData),
      hourly: this.#parseHourly(weatherData)
    };
    return result;
  }

  async #createUrl(path = ONECALL_PATH) {
    if (!this.#coordinates) {
      throw Error('No coordinates specified');
    }
    const url = new URL(path, BASE_URL);
    url.searchParams.append('appid', await this.#getApiKey());
    url.searchParams.append('lat', this.#coordinates.lat.toString());
    url.searchParams.append('lon', this.#coordinates.lon.toString());

    if (this.#lang) {
      url.searchParams.append('lang', this.#lang);
    }
    if (this.#units) {
      url.searchParams.append('units', this.#units);
    }

    return url.toString();
  }

  #parseLocation(data: any) {
    return {
      name: data.name,
      country: data.sys?.country
    };
  }

  #parseCurrent(data: any): OpenWeatherMapAPIGetWeatherResult['current'] {
    const current = data.current || {};
    const parsed: OpenWeatherMapAPIGetWeatherResult['current'] = {
      temp: {
        now: current.temp,
        // First day of daily forecast is current day
        min: data.daily?.[0]?.temp?.min,
        max: data.daily?.[0]?.temp?.max
      },
      humidity: current.humidity,
      windSpeed: current.wind_speed,
      icon: current.weather?.[0]?.icon
    };
    return parsed;
  }

  #parseDaily(data: any): OpenWeatherMapAPIGetWeatherResult['daily'] {
    return data.daily?.map((daily: any) => {
      const parsed: OpenWeatherMapAPIGetWeatherResult['daily'][number] = {
        temp: {
          min: daily.temp?.min,
          max: daily.temp?.max
        },
        humidity: daily.humidity,
        windSpeed: daily.wind_speed,
        icon: daily.weather?.[0]?.icon,
        dateTimeMillis: daily.dt * 1000
      };
      return parsed;
    }) || [];
  }

  #parseHourly(data: any): OpenWeatherMapAPIGetWeatherResult['hourly'] {
    return data.hourly?.map((hourly: any) => {
      const parsed: OpenWeatherMapAPIGetWeatherResult['hourly'][number] = {
        temp: hourly.temp,
        humidity: hourly.humidity,
        windSpeed: hourly.wind_speed,
        icon: hourly.weather?.[0]?.icon,
        dateTimeMillis: hourly.dt * 1000
      };
      return parsed;
    }) || [];
  }
}
