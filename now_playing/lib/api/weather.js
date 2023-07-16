const OpenWeatherMapAPI = require('./openweathermap');
const md5 = require('md5');
const { parseCoordinates } = require("../config");
const np = require(nowPlayingPluginLibRoot + '/np');
const Cache = require(nowPlayingPluginLibRoot + '/cache');

const WEATHER_ICONS_BASE_PATH = '/assets/weather-icons';
const ICON_CODE_MAPPINGS = {
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

const fetchPromises = {};

const api = new OpenWeatherMapAPI({});
const weatherCache = new Cache(
  { weather: 600 },
  { weather: 10 });

let currentConfig = {
  coordinates: {},
  units: 'standard'
};

let ready = false;

function clearCache() {
  weatherCache.clear();
}

function config(opts) {
  let { coordinates, units } = opts;
  let coord = parseCoordinates(coordinates);
  ready = coord;
  if (!ready) {
    return;
  }
  let configChanged = false;
  let {coordinates: currentCoordinates, units: currentUnits} = currentConfig;
  if (coord.lat !== currentCoordinates.lat || coord.lon !== currentCoordinates.lon) {
    api.setCoordinates(coord.lat, coord.lon);
    configChanged = true;
  }
  if (units !== undefined && currentUnits !== units) {
    api.setUnits(units);
    configChanged = true;
  }
  if (configChanged) {
    currentConfig = {...currentConfig, ...opts};

    fetchInfo().then(refreshedInfo => {
      np.broadcastMessage('npPushWeatherOnServiceChange', {
        success: true,
        data: refreshedInfo
      });
    })
    .catch(e => {
      np.broadcastMessage('npPushWeatherOnServiceChange', {
        success: false,
        error: e.message || e
      });
    });
  }
}

function getFetchPromise(callback) {
  const key = md5(JSON.stringify(currentConfig));
  if (fetchPromises[key]) {
    return fetchPromises[key];
  }
  else {
    const promise = callback();
    fetchPromises[key] = promise;
    promise.finally(() => {
      delete fetchPromises[key];
    });
    return promise;
  }
}

function getWeatherIconPath(iconCode, style, animated) {
  if (ICON_CODE_MAPPINGS[iconCode]) {
    return `${WEATHER_ICONS_BASE_PATH}/${style}/svg${(!animated ? '-static' : '')}/${ICON_CODE_MAPPINGS[iconCode]}`;
  }
  else {
    return null;
  }
};

function getWeatherIconUrls(appUrl, iconCode) {
  return {
    'filledStatic': appUrl + getWeatherIconPath(iconCode, 'fill', false),
    'filledAnimated': appUrl + getWeatherIconPath(iconCode, 'fill', true),
    'outlineStatic': appUrl + getWeatherIconPath(iconCode, 'line', false),
    'outlineAnimated': appUrl + getWeatherIconPath(iconCode, 'line', true),
    'monoStatic': appUrl + getWeatherIconPath(iconCode, 'monochrome', false),
    'monoAnimated': appUrl + getWeatherIconPath(iconCode, 'monochrome', true)
  };
}

function getTemperatureText(value, short = false) {
  const valueText = value.toFixed(0);
  if (short) {
    return valueText + '°';
  }
  switch(currentConfig.units) {
    case 'metric':
      return valueText + '°C';
    case 'imperial':
      return valueText + '°F';
    default: // 'standard'
      return valueText + 'K';
  }
}

function getWindSpeedText(value) {
  const valueText = value.toFixed(1);
  switch(currentConfig.units) {
    case 'metric': // meter/s
      return valueText + ' m/s';
    case 'imperial': // miles per hour
      return valueText + ' mph';
    default: // 'standard' - meter/s
      return valueText + ' m/s';
  }
}

function getHumidityText(value) {
  return value.toFixed(0) + '%';
}

function parseCurrent(data) {
  const currentData = data.current;
  const appUrl = np.get('pluginInfo').appUrl;
  const temp = currentData.temp.now;
  const humidity = currentData.humidity;
  const windSpeed = currentData.windSpeed;
  const tempMin = currentData.temp.min;
  const tempMax = currentData.temp.max;
  const result = {
    temp: {
      now: {
        value: temp,
        text: getTemperatureText(temp),
        shortText: getTemperatureText(temp, true)
      },
      min: {
        value: tempMin,
        text: getTemperatureText(tempMin),
        shortText: getTemperatureText(tempMin, true)
      },
      max: {
        value: tempMax,
        text: getTemperatureText(tempMax),
        shortText: getTemperatureText(tempMax, true)
      }
    },
    humidity: {
      value: humidity,
      text: getHumidityText(humidity)
    },
    windSpeed: {
      value: windSpeed,
      text: getWindSpeedText(windSpeed)
    },
    description: currentData.description,
    iconUrl: {
      condition: getWeatherIconUrls(appUrl, currentData.icon),
      humidity: getWeatherIconUrls(appUrl, '_humidity'),
      windspeed: getWeatherIconUrls(appUrl, '_windSpeed'),
    }
  };
  return result;
}

function parseForecast(data) {
  const appUrl = np.get('pluginInfo').appUrl;
  const forecast = [];
  for (const dailyWeather of data.daily) {
    const tempMin = dailyWeather.temp.min;
    const tempMax = dailyWeather.temp.max;
    const humidity = dailyWeather.humidity;
    const windSpeed = dailyWeather.windSpeed;
    forecast.push({
      temp: {
        min: {
          value: tempMin,
          text: getTemperatureText(tempMin),
          shortText: getTemperatureText(tempMin, true)
        },
        max: {
          value: tempMax,
          text: getTemperatureText(tempMax),
          shortText: getTemperatureText(tempMax, true)
        }
      },
      humidity: {
        value: humidity,
        text: getHumidityText(humidity)
      },
      windSpeed: {
        value: windSpeed,
        text: getWindSpeedText(windSpeed)
      },
      iconUrl: {
        condition: getWeatherIconUrls(appUrl, dailyWeather.icon),
        humidity: getWeatherIconUrls(appUrl, '_humidity'),
        windspeed: getWeatherIconUrls(appUrl, '_windSpeed'),
      },
      dateTimeMillis: dailyWeather.dateTimeMillis
    });
  }
  return forecast.slice(1); // First day of forecast is actually current day
}

function parseHourly(data) {
  const appUrl = np.get('pluginInfo').appUrl;
  const hourly = [];
  for (const hourlyWeather of data.hourly) {
    const temp = hourlyWeather.temp;
    const humidity = hourlyWeather.humidity;
    const windSpeed = hourlyWeather.windSpeed;
    hourly.push({
      temp: {
        value: temp,
        text: getTemperatureText(temp),
        shortText: getTemperatureText(temp, true)
      },
      humidity: {
        value: humidity,
        text: getHumidityText(humidity)
      },
      windSpeed: {
        value: windSpeed,
        text: getWindSpeedText(windSpeed)
      },
      iconUrl: {
        condition: getWeatherIconUrls(appUrl, hourlyWeather.icon),
        humidity: getWeatherIconUrls(appUrl, '_humidity'),
        windspeed: getWeatherIconUrls(appUrl, '_windSpeed'),
      },
      dateTimeMillis: hourlyWeather.dateTimeMillis
    });
  }
  return hourly;
}

async function doFetchInfo() {
  return getFetchPromise(async() => {
    const weather = await api.getWeather();

    return {
      location: weather.location,
      current: parseCurrent(weather),
      forecast: parseForecast(weather),
      hourly: parseHourly(weather),
      units: currentConfig.units
    };
  });
}

async function fetchInfo() {
  if (!ready) {
    return Promise.reject(np.getI18n('NOW_PLAYING_ERR_WEATHER_MISCONFIG'));
  }
  try {
    let info = {};
    const cacheKey = md5(JSON.stringify(currentConfig));
    info = await weatherCache.getOrSet('weather', cacheKey, () => doFetchInfo());
    return Promise.resolve(info);
  } catch (e) {
    msg = np.getI18n('NOW_PLAYING_ERR_WEATHER_FETCH') + (e.message ? `: ${e.message}` : '');
    return Promise.reject(msg);
  }
}

module.exports = {
  config,
  fetchInfo,
  clearCache
};
