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
var _YTMusicContext_instances, _YTMusicContext_singletons, _YTMusicContext_data, _YTMusicContext_pluginContext, _YTMusicContext_pluginConfig, _YTMusicContext_i18n, _YTMusicContext_i18nDefaults, _YTMusicContext_i18CallbackRegistered, _YTMusicContext_getSingleton, _YTMusicContext_loadI18n, _YTMusicContext_onSystemLanguageChanged;
Object.defineProperty(exports, "__esModule", { value: true });
const string_format_1 = __importDefault(require("string-format"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const ConfigModel_1 = require("./model/ConfigModel");
class YTMusicContext {
    constructor() {
        _YTMusicContext_instances.add(this);
        _YTMusicContext_singletons.set(this, void 0);
        _YTMusicContext_data.set(this, void 0);
        _YTMusicContext_pluginContext.set(this, void 0);
        _YTMusicContext_pluginConfig.set(this, void 0);
        _YTMusicContext_i18n.set(this, void 0);
        _YTMusicContext_i18nDefaults.set(this, void 0);
        _YTMusicContext_i18CallbackRegistered.set(this, void 0);
        __classPrivateFieldSet(this, _YTMusicContext_singletons, {}, "f");
        __classPrivateFieldSet(this, _YTMusicContext_data, {}, "f");
        __classPrivateFieldSet(this, _YTMusicContext_i18n, {}, "f");
        __classPrivateFieldSet(this, _YTMusicContext_i18nDefaults, {}, "f");
        __classPrivateFieldSet(this, _YTMusicContext_i18CallbackRegistered, false, "f");
    }
    set(key, value) {
        __classPrivateFieldGet(this, _YTMusicContext_data, "f")[key] = value;
    }
    get(key, defaultValue) {
        return (__classPrivateFieldGet(this, _YTMusicContext_data, "f")[key] !== undefined) ? __classPrivateFieldGet(this, _YTMusicContext_data, "f")[key] : (defaultValue || null);
    }
    delete(key) {
        delete __classPrivateFieldGet(this, _YTMusicContext_data, "f")[key];
    }
    init(pluginContext, pluginConfig) {
        __classPrivateFieldSet(this, _YTMusicContext_pluginContext, pluginContext, "f");
        __classPrivateFieldSet(this, _YTMusicContext_pluginConfig, pluginConfig, "f");
        __classPrivateFieldGet(this, _YTMusicContext_instances, "m", _YTMusicContext_loadI18n).call(this);
        if (!__classPrivateFieldGet(this, _YTMusicContext_i18CallbackRegistered, "f")) {
            __classPrivateFieldGet(this, _YTMusicContext_pluginContext, "f").coreCommand.sharedVars.registerCallback('language_code', __classPrivateFieldGet(this, _YTMusicContext_instances, "m", _YTMusicContext_onSystemLanguageChanged).bind(this));
            __classPrivateFieldSet(this, _YTMusicContext_i18CallbackRegistered, true, "f");
        }
    }
    toast(type, message, title = 'YouTube Music') {
        __classPrivateFieldGet(this, _YTMusicContext_pluginContext, "f").coreCommand.pushToastMessage(type, title, message);
    }
    refreshUIConfig() {
        __classPrivateFieldGet(this, _YTMusicContext_pluginContext, "f").coreCommand.getUIConfigOnPlugin('music_service', 'ytmusic', {}).then((config) => {
            __classPrivateFieldGet(this, _YTMusicContext_pluginContext, "f").coreCommand.broadcastMessage('pushUiConfig', config);
        });
    }
    getLogger() {
        return __classPrivateFieldGet(this, _YTMusicContext_pluginContext, "f").logger;
    }
    getErrorMessage(message, error, stack = true) {
        let result = message;
        if (typeof error == 'object') {
            if (error.message) {
                result += ` ${error.message}`;
            }
            if (stack && error.stack) {
                result += ` ${error.stack}`;
            }
        }
        else if (typeof error == 'string') {
            result += ` ${error}`;
        }
        return result.trim();
    }
    hasConfigKey(key) {
        return __classPrivateFieldGet(this, _YTMusicContext_pluginConfig, "f").has(key);
    }
    getConfigValue(key) {
        const schema = ConfigModel_1.PLUGIN_CONFIG_SCHEMA[key];
        if (__classPrivateFieldGet(this, _YTMusicContext_pluginConfig, "f").has(key)) {
            const val = __classPrivateFieldGet(this, _YTMusicContext_pluginConfig, "f").get(key);
            if (schema.json) {
                try {
                    return JSON.parse(val);
                }
                catch (e) {
                    return schema.defaultValue;
                }
            }
            else {
                return val;
            }
        }
        else {
            return schema.defaultValue;
        }
    }
    deleteConfigValue(key) {
        __classPrivateFieldGet(this, _YTMusicContext_pluginConfig, "f").delete(key);
    }
    setConfigValue(key, value) {
        const schema = ConfigModel_1.PLUGIN_CONFIG_SCHEMA[key];
        __classPrivateFieldGet(this, _YTMusicContext_pluginConfig, "f").set(key, schema.json ? JSON.stringify(value) : value);
    }
    getAlbumArtPlugin() {
        return __classPrivateFieldGet(this, _YTMusicContext_instances, "m", _YTMusicContext_getSingleton).call(this, 'albumArtPlugin', () => __classPrivateFieldGet(this, _YTMusicContext_pluginContext, "f").coreCommand.pluginManager.getPlugin('miscellanea', 'albumart'));
    }
    getMpdPlugin() {
        return __classPrivateFieldGet(this, _YTMusicContext_instances, "m", _YTMusicContext_getSingleton).call(this, 'mpdPlugin', () => __classPrivateFieldGet(this, _YTMusicContext_pluginContext, "f").coreCommand.pluginManager.getPlugin('music_service', 'mpd'));
    }
    getStateMachine() {
        return __classPrivateFieldGet(this, _YTMusicContext_pluginContext, "f").coreCommand.stateMachine;
    }
    reset() {
        __classPrivateFieldSet(this, _YTMusicContext_pluginContext, null, "f");
        __classPrivateFieldSet(this, _YTMusicContext_pluginConfig, null, "f");
        __classPrivateFieldSet(this, _YTMusicContext_singletons, {}, "f");
        __classPrivateFieldSet(this, _YTMusicContext_data, {}, "f");
    }
    getI18n(key, ...formatValues) {
        let str;
        if (key.indexOf('.') > 0) {
            const mainKey = key.split('.')[0];
            const secKey = key.split('.')[1];
            str = __classPrivateFieldGet(this, _YTMusicContext_i18n, "f")[mainKey]?.[secKey] ||
                __classPrivateFieldGet(this, _YTMusicContext_i18nDefaults, "f")[mainKey]?.[secKey] ||
                key;
        }
        else {
            str = (__classPrivateFieldGet(this, _YTMusicContext_i18n, "f")[key] || __classPrivateFieldGet(this, _YTMusicContext_i18nDefaults, "f")[key] || key);
        }
        if (str && formatValues.length) {
            str = (0, string_format_1.default)(str, ...formatValues);
        }
        return str;
    }
    get volumioCoreCommand() {
        return __classPrivateFieldGet(this, _YTMusicContext_pluginContext, "f")?.coreCommand || null;
    }
}
_YTMusicContext_singletons = new WeakMap(), _YTMusicContext_data = new WeakMap(), _YTMusicContext_pluginContext = new WeakMap(), _YTMusicContext_pluginConfig = new WeakMap(), _YTMusicContext_i18n = new WeakMap(), _YTMusicContext_i18nDefaults = new WeakMap(), _YTMusicContext_i18CallbackRegistered = new WeakMap(), _YTMusicContext_instances = new WeakSet(), _YTMusicContext_getSingleton = function _YTMusicContext_getSingleton(key, getValue) {
    if (__classPrivateFieldGet(this, _YTMusicContext_singletons, "f")[key] == undefined) {
        __classPrivateFieldGet(this, _YTMusicContext_singletons, "f")[key] = getValue();
    }
    return __classPrivateFieldGet(this, _YTMusicContext_singletons, "f")[key];
}, _YTMusicContext_loadI18n = function _YTMusicContext_loadI18n() {
    if (__classPrivateFieldGet(this, _YTMusicContext_pluginContext, "f")) {
        const i18nPath = `${__dirname}/../i18n`;
        try {
            __classPrivateFieldSet(this, _YTMusicContext_i18nDefaults, fs_extra_1.default.readJsonSync(`${i18nPath}/strings_en.json`), "f");
        }
        catch (e) {
            __classPrivateFieldSet(this, _YTMusicContext_i18nDefaults, {}, "f");
        }
        try {
            const language_code = __classPrivateFieldGet(this, _YTMusicContext_pluginContext, "f").coreCommand.sharedVars.get('language_code');
            __classPrivateFieldSet(this, _YTMusicContext_i18n, fs_extra_1.default.readJsonSync(`${i18nPath}/strings_${language_code}.json`), "f");
        }
        catch (e) {
            __classPrivateFieldSet(this, _YTMusicContext_i18n, __classPrivateFieldGet(this, _YTMusicContext_i18nDefaults, "f"), "f");
        }
    }
}, _YTMusicContext_onSystemLanguageChanged = function _YTMusicContext_onSystemLanguageChanged() {
    __classPrivateFieldGet(this, _YTMusicContext_instances, "m", _YTMusicContext_loadI18n).call(this);
};
exports.default = new YTMusicContext();
//# sourceMappingURL=YTMusicContext.js.map