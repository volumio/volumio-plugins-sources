"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _WeatherAPI_instances, _WeatherAPI_api, _WeatherAPI_fetchPromises, _WeatherAPI_cache, _WeatherAPI_config, _WeatherAPI_ready, _WeatherAPI_getFetchPromise, _WeatherAPI_getWeatherIconPath, _WeatherAPI_getWeatherIconUrls, _WeatherAPI_getTemperatureText, _WeatherAPI_getWindSpeedText, _WeatherAPI_getHumidityText, _WeatherAPI_parseLocation, _WeatherAPI_parseCurrent, _WeatherAPI_parseForecast, _WeatherAPI_parseHourly, _WeatherAPI_doFetchInfo;
Object.defineProperty(exports, "__esModule", { value: true });
const openweathermap_1 = __importDefault(require("./openweathermap"));
const md5_1 = __importDefault(require("md5"));
const NowPlayingContext_1 = __importDefault(require("../NowPlayingContext"));
const Cache_1 = __importDefault(require("../utils/Cache"));
const ConfigHelper_1 = __importDefault(require("../config/ConfigHelper"));
const now_playing_common_1 = require("now-playing-common");
const System_1 = require("../utils/System");
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
class WeatherAPI {
    constructor() {
        _WeatherAPI_instances.add(this);
        _WeatherAPI_api.set(this, void 0);
        _WeatherAPI_fetchPromises.set(this, void 0);
        _WeatherAPI_cache.set(this, void 0);
        _WeatherAPI_config.set(this, void 0);
        _WeatherAPI_ready.set(this, void 0);
        __classPrivateFieldSet(this, _WeatherAPI_api, new openweathermap_1.default(), "f");
        __classPrivateFieldSet(this, _WeatherAPI_fetchPromises, {}, "f");
        __classPrivateFieldSet(this, _WeatherAPI_cache, new Cache_1.default({ weather: 600 }, { weather: 10 }), "f");
        __classPrivateFieldSet(this, _WeatherAPI_config, {
            units: now_playing_common_1.DefaultLocalizationSettings.unitSystem
        }, "f");
        __classPrivateFieldSet(this, _WeatherAPI_ready, false, "f");
    }
    clearCache() {
        __classPrivateFieldGet(this, _WeatherAPI_cache, "f").clear();
    }
    setConfig(opts) {
        const { coordinates, units } = opts;
        const coord = ConfigHelper_1.default.parseCoordinates(coordinates);
        __classPrivateFieldSet(this, _WeatherAPI_ready, !!coord, "f");
        if (!coord) {
            return;
        }
        let configChanged = false;
        const { coordinates: currentCoordinates, units: currentUnits } = __classPrivateFieldGet(this, _WeatherAPI_config, "f");
        if (coord.lat !== currentCoordinates?.lat || coord.lon !== currentCoordinates?.lon) {
            __classPrivateFieldGet(this, _WeatherAPI_api, "f").setCoordinates(coord.lat, coord.lon);
            configChanged = true;
        }
        if (units !== undefined && currentUnits !== units) {
            __classPrivateFieldGet(this, _WeatherAPI_api, "f").setUnits(units);
            configChanged = true;
        }
        if (configChanged) {
            __classPrivateFieldSet(this, _WeatherAPI_config, {
                ...__classPrivateFieldGet(this, _WeatherAPI_config, "f"),
                coordinates: coord,
                units
            }, "f");
            this.fetchInfo().then((refreshedInfo) => {
                NowPlayingContext_1.default.broadcastMessage('npPushWeatherOnServiceChange', {
                    success: true,
                    data: refreshedInfo
                });
            })
                .catch((e) => {
                NowPlayingContext_1.default.broadcastMessage('npPushWeatherOnServiceChange', {
                    success: false,
                    error: e.message || e
                });
            });
        }
    }
    async fetchInfo() {
        if (!__classPrivateFieldGet(this, _WeatherAPI_ready, "f")) {
            throw Error(NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_WEATHER_MISCONFIG'));
        }
        try {
            const cacheKey = (0, md5_1.default)(JSON.stringify(__classPrivateFieldGet(this, _WeatherAPI_config, "f")));
            return await __classPrivateFieldGet(this, _WeatherAPI_cache, "f").getOrSet('weather', cacheKey, () => __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_doFetchInfo).call(this));
        }
        catch (e) {
            const msg = NowPlayingContext_1.default.getI18n('NOW_PLAYING_ERR_WEATHER_FETCH') + (e.message ? `: ${e.message}` : '');
            throw Error(msg);
        }
    }
}
_WeatherAPI_api = new WeakMap(), _WeatherAPI_fetchPromises = new WeakMap(), _WeatherAPI_cache = new WeakMap(), _WeatherAPI_config = new WeakMap(), _WeatherAPI_ready = new WeakMap(), _WeatherAPI_instances = new WeakSet(), _WeatherAPI_getFetchPromise = function _WeatherAPI_getFetchPromise(callback) {
    const key = (0, md5_1.default)(JSON.stringify(__classPrivateFieldGet(this, _WeatherAPI_config, "f")));
    if (Object.keys(__classPrivateFieldGet(this, _WeatherAPI_fetchPromises, "f")).includes(key)) {
        return __classPrivateFieldGet(this, _WeatherAPI_fetchPromises, "f")[key];
    }
    const promise = callback();
    __classPrivateFieldGet(this, _WeatherAPI_fetchPromises, "f")[key] = promise;
    promise.finally(() => {
        delete __classPrivateFieldGet(this, _WeatherAPI_fetchPromises, "f")[key];
    });
    return promise;
}, _WeatherAPI_getWeatherIconPath = function _WeatherAPI_getWeatherIconPath(iconCode, style, animated) {
    if (ICON_CODE_MAPPINGS[iconCode]) {
        return `${WEATHER_ICONS_BASE_PATH}/${style}/svg${(!animated ? '-static' : '')}/${ICON_CODE_MAPPINGS[iconCode]}`;
    }
    return null;
}, _WeatherAPI_getWeatherIconUrls = function _WeatherAPI_getWeatherIconUrls(appUrl, iconCode) {
    if (!iconCode) {
        iconCode = '';
    }
    return {
        'filledStatic': appUrl + __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getWeatherIconPath).call(this, iconCode, 'fill', false),
        'filledAnimated': appUrl + __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getWeatherIconPath).call(this, iconCode, 'fill', true),
        'outlineStatic': appUrl + __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getWeatherIconPath).call(this, iconCode, 'line', false),
        'outlineAnimated': appUrl + __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getWeatherIconPath).call(this, iconCode, 'line', true),
        'monoStatic': appUrl + __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getWeatherIconPath).call(this, iconCode, 'monochrome', false),
        'monoAnimated': appUrl + __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getWeatherIconPath).call(this, iconCode, 'monochrome', true)
    };
}, _WeatherAPI_getTemperatureText = function _WeatherAPI_getTemperatureText(value, short = false) {
    if (value === undefined) {
        return 'NaN';
    }
    const valueText = value.toFixed(0);
    if (short) {
        return `${valueText}°`;
    }
    switch (__classPrivateFieldGet(this, _WeatherAPI_config, "f").units) {
        case 'metric':
            return `${valueText}°C`;
        case 'imperial':
            return `${valueText}°F`;
        default: // 'standard'
            return `${valueText}K`;
    }
}, _WeatherAPI_getWindSpeedText = function _WeatherAPI_getWindSpeedText(value) {
    if (value === undefined) {
        return 'NaN';
    }
    const valueText = value.toFixed(1);
    switch (__classPrivateFieldGet(this, _WeatherAPI_config, "f").units) {
        case 'metric': // Meter/s
            return `${valueText} m/s`;
        case 'imperial': // Miles per hour
            return `${valueText} mph`;
        default: // 'standard' - meter/s
            return `${valueText} m/s`;
    }
}, _WeatherAPI_getHumidityText = function _WeatherAPI_getHumidityText(value) {
    if (value === undefined) {
        return 'NaN';
    }
    return `${value.toFixed(0)}%`;
}, _WeatherAPI_parseLocation = function _WeatherAPI_parseLocation(data) {
    const locationData = data.location;
    return {
        name: locationData.name || '',
        country: locationData.country || ''
    };
}, _WeatherAPI_parseCurrent = function _WeatherAPI_parseCurrent(data) {
    const currentData = data.current;
    const appUrl = (0, System_1.getPluginInfo)().appUrl;
    const temp = currentData.temp.now;
    const humidity = currentData.humidity;
    const windSpeed = currentData.windSpeed;
    const tempMin = currentData.temp.min;
    const tempMax = currentData.temp.max;
    const result = {
        temp: {
            now: {
                value: temp || NaN,
                text: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getTemperatureText).call(this, temp),
                shortText: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getTemperatureText).call(this, temp, true)
            },
            min: {
                value: tempMin || NaN,
                text: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getTemperatureText).call(this, tempMin),
                shortText: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getTemperatureText).call(this, tempMin, true)
            },
            max: {
                value: tempMax || NaN,
                text: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getTemperatureText).call(this, tempMax),
                shortText: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getTemperatureText).call(this, tempMax, true)
            }
        },
        humidity: {
            value: humidity || NaN,
            text: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getHumidityText).call(this, humidity)
        },
        windSpeed: {
            value: windSpeed || NaN,
            text: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getWindSpeedText).call(this, windSpeed)
        },
        iconUrl: {
            condition: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getWeatherIconUrls).call(this, appUrl, currentData.icon),
            humidity: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getWeatherIconUrls).call(this, appUrl, '_humidity'),
            windSpeed: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getWeatherIconUrls).call(this, appUrl, '_windSpeed')
        }
    };
    return result;
}, _WeatherAPI_parseForecast = function _WeatherAPI_parseForecast(data) {
    const appUrl = (0, System_1.getPluginInfo)().appUrl;
    const forecast = [];
    for (const dailyWeather of data.daily) {
        const tempMin = dailyWeather.temp.min;
        const tempMax = dailyWeather.temp.max;
        const humidity = dailyWeather.humidity;
        const windSpeed = dailyWeather.windSpeed;
        forecast.push({
            temp: {
                min: {
                    value: tempMin || NaN,
                    text: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getTemperatureText).call(this, tempMin),
                    shortText: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getTemperatureText).call(this, tempMin, true)
                },
                max: {
                    value: tempMax || NaN,
                    text: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getTemperatureText).call(this, tempMax),
                    shortText: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getTemperatureText).call(this, tempMax, true)
                }
            },
            humidity: {
                value: humidity || NaN,
                text: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getHumidityText).call(this, humidity)
            },
            windSpeed: {
                value: windSpeed || NaN,
                text: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getWindSpeedText).call(this, windSpeed)
            },
            iconUrl: {
                condition: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getWeatherIconUrls).call(this, appUrl, dailyWeather.icon),
                humidity: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getWeatherIconUrls).call(this, appUrl, '_humidity'),
                windSpeed: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getWeatherIconUrls).call(this, appUrl, '_windSpeed')
            },
            dateTimeMillis: dailyWeather.dateTimeMillis || NaN
        });
    }
    return forecast.slice(1); // First day of forecast is actually current day
}, _WeatherAPI_parseHourly = function _WeatherAPI_parseHourly(data) {
    const appUrl = (0, System_1.getPluginInfo)().appUrl;
    const hourly = [];
    for (const hourlyWeather of data.hourly) {
        const temp = hourlyWeather.temp;
        const humidity = hourlyWeather.humidity;
        const windSpeed = hourlyWeather.windSpeed;
        hourly.push({
            temp: {
                value: temp || NaN,
                text: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getTemperatureText).call(this, temp),
                shortText: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getTemperatureText).call(this, temp, true)
            },
            humidity: {
                value: humidity || NaN,
                text: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getHumidityText).call(this, humidity)
            },
            windSpeed: {
                value: windSpeed || NaN,
                text: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getWindSpeedText).call(this, windSpeed)
            },
            iconUrl: {
                condition: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getWeatherIconUrls).call(this, appUrl, hourlyWeather.icon),
                humidity: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getWeatherIconUrls).call(this, appUrl, '_humidity'),
                windSpeed: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getWeatherIconUrls).call(this, appUrl, '_windSpeed')
            },
            dateTimeMillis: hourlyWeather.dateTimeMillis || NaN
        });
    }
    return hourly;
}, _WeatherAPI_doFetchInfo = async function _WeatherAPI_doFetchInfo() {
    return __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_getFetchPromise).call(this, async () => {
        const weather = await __classPrivateFieldGet(this, _WeatherAPI_api, "f").getWeather();
        return {
            location: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_parseLocation).call(this, weather),
            current: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_parseCurrent).call(this, weather),
            forecast: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_parseForecast).call(this, weather),
            hourly: __classPrivateFieldGet(this, _WeatherAPI_instances, "m", _WeatherAPI_parseHourly).call(this, weather),
            units: __classPrivateFieldGet(this, _WeatherAPI_config, "f").units
        };
    });
};
const weatherAPI = new WeatherAPI();
exports.default = weatherAPI;
//# sourceMappingURL=WeatherAPI.js.map