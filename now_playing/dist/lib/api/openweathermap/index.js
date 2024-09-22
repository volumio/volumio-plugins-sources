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
var _OpenWeatherMapAPI_instances, _OpenWeatherMapAPI_apiKey, _OpenWeatherMapAPI_apiKeyPromise, _OpenWeatherMapAPI_coordinates, _OpenWeatherMapAPI_lang, _OpenWeatherMapAPI_units, _OpenWeatherMapAPI_getApiKey, _OpenWeatherMapAPI_createUrl, _OpenWeatherMapAPI_parseLocation, _OpenWeatherMapAPI_parseCurrent, _OpenWeatherMapAPI_parseDaily, _OpenWeatherMapAPI_parseHourly;
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const NowPlayingContext_1 = __importDefault(require("../../NowPlayingContext"));
const BASE_URL = 'https://openweathermap.org';
const ONECALL_PATH = '/data/2.5/onecall';
const WEATHER_PATH = '/data/2.5/weather';
async function fetchPage(url, json = false) {
    try {
        const response = await (0, node_fetch_1.default)(url);
        if (response.ok) {
            return json ? response.json() : response.text();
        }
        throw Error(`Response error: ${response.status} - ${response.statusText}`);
    }
    catch (error) {
        NowPlayingContext_1.default.getLogger().error(NowPlayingContext_1.default.getErrorMessage(`[now-playing] Error fetching ${url}:`, error));
        throw error;
    }
}
class OpenWeatherMapAPI {
    constructor(args) {
        _OpenWeatherMapAPI_instances.add(this);
        _OpenWeatherMapAPI_apiKey.set(this, void 0);
        _OpenWeatherMapAPI_apiKeyPromise.set(this, void 0);
        _OpenWeatherMapAPI_coordinates.set(this, void 0);
        _OpenWeatherMapAPI_lang.set(this, void 0);
        _OpenWeatherMapAPI_units.set(this, void 0);
        __classPrivateFieldSet(this, _OpenWeatherMapAPI_apiKey, null, "f");
        __classPrivateFieldSet(this, _OpenWeatherMapAPI_apiKeyPromise, null, "f");
        __classPrivateFieldSet(this, _OpenWeatherMapAPI_coordinates, null, "f");
        __classPrivateFieldSet(this, _OpenWeatherMapAPI_lang, null, "f");
        __classPrivateFieldSet(this, _OpenWeatherMapAPI_units, null, "f");
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
    setCoordinates(lat, lon) {
        if (typeof lat === 'number' && typeof lon === 'number' && -90 <= lat && lat <= 90 && -180 <= lon && lon <= 180) {
            __classPrivateFieldSet(this, _OpenWeatherMapAPI_coordinates, { lat, lon }, "f");
            return;
        }
        throw Error('Invalid coordinates');
    }
    setLang(lang) {
        __classPrivateFieldSet(this, _OpenWeatherMapAPI_lang, lang, "f");
    }
    setUnits(units) {
        __classPrivateFieldSet(this, _OpenWeatherMapAPI_units, units, "f");
    }
    async getWeather() {
        const fetchData = async (forceRefreshApiKey = false) => {
            if (forceRefreshApiKey) {
                __classPrivateFieldSet(this, _OpenWeatherMapAPI_apiKey, null, "f");
            }
            const [oneCallUrl, weatherUrl] = await Promise.all([
                __classPrivateFieldGet(this, _OpenWeatherMapAPI_instances, "m", _OpenWeatherMapAPI_createUrl).call(this, ONECALL_PATH),
                __classPrivateFieldGet(this, _OpenWeatherMapAPI_instances, "m", _OpenWeatherMapAPI_createUrl).call(this, WEATHER_PATH)
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
        const [weatherData, locationData] = await fetchData();
        const result = {
            location: __classPrivateFieldGet(this, _OpenWeatherMapAPI_instances, "m", _OpenWeatherMapAPI_parseLocation).call(this, locationData),
            current: __classPrivateFieldGet(this, _OpenWeatherMapAPI_instances, "m", _OpenWeatherMapAPI_parseCurrent).call(this, weatherData),
            daily: __classPrivateFieldGet(this, _OpenWeatherMapAPI_instances, "m", _OpenWeatherMapAPI_parseDaily).call(this, weatherData),
            hourly: __classPrivateFieldGet(this, _OpenWeatherMapAPI_instances, "m", _OpenWeatherMapAPI_parseHourly).call(this, weatherData)
        };
        return result;
    }
}
exports.default = OpenWeatherMapAPI;
_OpenWeatherMapAPI_apiKey = new WeakMap(), _OpenWeatherMapAPI_apiKeyPromise = new WeakMap(), _OpenWeatherMapAPI_coordinates = new WeakMap(), _OpenWeatherMapAPI_lang = new WeakMap(), _OpenWeatherMapAPI_units = new WeakMap(), _OpenWeatherMapAPI_instances = new WeakSet(), _OpenWeatherMapAPI_getApiKey = async function _OpenWeatherMapAPI_getApiKey() {
    if (__classPrivateFieldGet(this, _OpenWeatherMapAPI_apiKey, "f")) {
        return __classPrivateFieldGet(this, _OpenWeatherMapAPI_apiKey, "f");
    }
    if (__classPrivateFieldGet(this, _OpenWeatherMapAPI_apiKeyPromise, "f")) {
        return __classPrivateFieldGet(this, _OpenWeatherMapAPI_apiKeyPromise, "f");
    }
    const doGet = async () => {
        NowPlayingContext_1.default.getLogger().info('[now-playing] Fetching API key...');
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
    __classPrivateFieldSet(this, _OpenWeatherMapAPI_apiKeyPromise, doGet()
        .then((appId) => {
        __classPrivateFieldSet(this, _OpenWeatherMapAPI_apiKey, appId, "f");
        NowPlayingContext_1.default.getLogger().info('[now-playing] OpenWeatherMap API key obtained.');
        return appId;
    })
        .finally(() => {
        __classPrivateFieldSet(this, _OpenWeatherMapAPI_apiKeyPromise, null, "f");
    }), "f");
    return __classPrivateFieldGet(this, _OpenWeatherMapAPI_apiKeyPromise, "f");
}, _OpenWeatherMapAPI_createUrl = async function _OpenWeatherMapAPI_createUrl(path = ONECALL_PATH) {
    if (!__classPrivateFieldGet(this, _OpenWeatherMapAPI_coordinates, "f")) {
        throw Error('No coordinates specified');
    }
    const url = new URL(path, BASE_URL);
    url.searchParams.append('appid', await __classPrivateFieldGet(this, _OpenWeatherMapAPI_instances, "m", _OpenWeatherMapAPI_getApiKey).call(this));
    url.searchParams.append('lat', __classPrivateFieldGet(this, _OpenWeatherMapAPI_coordinates, "f").lat.toString());
    url.searchParams.append('lon', __classPrivateFieldGet(this, _OpenWeatherMapAPI_coordinates, "f").lon.toString());
    if (__classPrivateFieldGet(this, _OpenWeatherMapAPI_lang, "f")) {
        url.searchParams.append('lang', __classPrivateFieldGet(this, _OpenWeatherMapAPI_lang, "f"));
    }
    if (__classPrivateFieldGet(this, _OpenWeatherMapAPI_units, "f")) {
        url.searchParams.append('units', __classPrivateFieldGet(this, _OpenWeatherMapAPI_units, "f"));
    }
    return url.toString();
}, _OpenWeatherMapAPI_parseLocation = function _OpenWeatherMapAPI_parseLocation(data) {
    return {
        name: data.name,
        country: data.sys?.country
    };
}, _OpenWeatherMapAPI_parseCurrent = function _OpenWeatherMapAPI_parseCurrent(data) {
    const current = data.current || {};
    const parsed = {
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
}, _OpenWeatherMapAPI_parseDaily = function _OpenWeatherMapAPI_parseDaily(data) {
    return data.daily?.map((daily) => {
        const parsed = {
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
}, _OpenWeatherMapAPI_parseHourly = function _OpenWeatherMapAPI_parseHourly(data) {
    return data.hourly?.map((hourly) => {
        const parsed = {
            temp: hourly.temp,
            humidity: hourly.humidity,
            windSpeed: hourly.wind_speed,
            icon: hourly.weather?.[0]?.icon,
            dateTimeMillis: hourly.dt * 1000
        };
        return parsed;
    }) || [];
};
//# sourceMappingURL=index.js.map