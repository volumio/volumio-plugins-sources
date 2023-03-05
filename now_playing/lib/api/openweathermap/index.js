const fetch = require('node-fetch');
const np = require(nowPlayingPluginLibRoot + '/np');

const BASE_URL = 'https://openweathermap.org';
const ONECALL_PATH = '/data/2.5/onecall';
const WEATHER_PATH = '/data/2.5/weather';

async function fetchPage(url, json = false) {
  try {
    const response = await fetch(url);
    if (response.ok) {
        return json ? response.json() : response.text();
    }
    throw new Error(`Response error: ${response.status} - ${response.statusText}`);
  } catch (error) {
    np.getLogger().error(np.getErrorMessage(`[now-playing-weather] Error fetching ${url}:`, error));
    throw error;
  }

}

class OpenWeatherMapApi {

  #apiKey;
  #apiKeyPromise;
  #coordinates;
  #lang;
  #units;

  constructor(args) {
    if (!isNaN(args?.lat) && !isNaN(args?.lon)) {
      this.setCoordinates(args.lat, args.lon);
    }
    if (args?.lang) {
      this.setLang(args.lang);
    }
    if (args?.units) {
      this.setUnits(args.units);
    }
  }

  setCoordinates(lat, lon) {
    if (typeof lat === "number" && typeof lon === "number" && -90 <= lat && lat <= 90 && -180 <= lon && lon <= 180) {
      this.#coordinates = { lat, lon };
      return;
    }

    throw new Error("Invalid coordinates");
  }

  setLang(lang) {
    this.#lang = lang;
  }

  setUnits(units) {
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
      np.getLogger().info('[now-playing-weather] Fetching API key...');
      const widgetPathRegExp = /<script src=\"((?:.+)weather-widget-new.(?:.+).js)"><\/script>/gm;
      const appIdRegExp = /appid:"(.+?)"/gm;

      const page = await fetchPage(BASE_URL);
      const widgetPath = page ? widgetPathRegExp.exec(page)[1] : null;
      const widgetSrc = widgetPath ? await fetchPage(new URL(widgetPath, BASE_URL).toString()) : Promise.resolve(null);
      const appId = widgetSrc ? appIdRegExp.exec(widgetSrc)[1] : null;

      if (!appId) {
        throw new Error('Could not obtain API key');
      }

      return appId;
    }

    this.#apiKeyPromise = doGet()
      .then((appId) => {
        this.#apiKey = appId;
        np.getLogger().info('[now-playing-weather] API key obtained.');
        return appId;
      })
      .finally(() => {
        this.#apiKeyPromise = null;
      });

    return this.#apiKeyPromise;
  }

  async getWeather() {

    const fetchData = async (forceRefreshApiKey = false) => {
      if (forceRefreshApiKey) {
        this.#apiKey = null;
      }

      const [oneCallUrl, weatherUrl] = await Promise.all([
        this.#createUrl(ONECALL_PATH),
        this.#createUrl(WEATHER_PATH)
      ]);
  
      // Note that location data is actually resolved from
      // weatherUrl, whereas the rest is from onecall.
      try {
        return await Promise.all([
          fetchPage(oneCallUrl, true),
          fetchPage(weatherUrl, true)
        ]);
      } catch (error) {
        if (!forceRefreshApiKey) {
          // Retry with forceRefreshApiKey
          return fetchData(true);
        }

        throw error;
      }
    }
    
    const [weatherData, locationData] = await fetchData();
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
      throw new Error('No coordinates specified');
    }
    const url = new URL(path, BASE_URL);
    url.searchParams.append('appid', await this.#getApiKey());
    url.searchParams.append('lat', this.#coordinates.lat);
    url.searchParams.append('lon', this.#coordinates.lon);

    if (this.#lang) {
      url.searchParams.append('lang', this.#lang);
    }
    if (this.#units) {
      url.searchParams.append('units', this.#units);
    }

    return url.toString();
  }

  #parseLocation(data) {
    return {
      name: data.name,
      country: data.sys?.country
    };
  }

  #parseCurrent(data) {
    const current = data.current || {};
    const parsed = {};
    parsed.temp = {
      now: current.temp,
      // First day of daily forecast is current day
      min: data.daily?.[0]?.temp?.min,
      max: data.daily?.[0]?.temp?.max,
    }
    parsed.humidity = current.humidity;
    parsed.windSpeed = current.wind_speed;
    parsed.icon = current.weather?.[0]?.icon || null;

    return parsed;
  }

  #parseDaily(data) {
    return data.daily?.map((daily) => {
      const parsed = {};
      parsed.temp = {
        min: daily.temp?.min,
        max: daily.temp?.max
      };
      parsed.humidity = daily.humidity;
      parsed.windSpeed = daily.wind_speed;
      parsed.icon = daily.weather?.[0]?.icon || null;
      parsed.dateTimeMillis = daily.dt * 1000;

      return parsed;
    }) || [];
  }

  #parseHourly(data) {
    return data.hourly?.map((hourly) => {
      const parsed = {};
      parsed.temp = hourly.temp;
      parsed.humidity = hourly.humidity;
      parsed.windSpeed = hourly.wind_speed;
      parsed.icon = hourly.weather?.[0]?.icon || null;
      parsed.dateTimeMillis = hourly.dt * 1000;

      return parsed;
    }) || [];
  }
}

module.exports = OpenWeatherMapApi;
