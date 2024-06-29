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
var _NowPlayingContext_instances, _NowPlayingContext_data, _NowPlayingContext_pluginContext, _NowPlayingContext_pluginConfig, _NowPlayingContext_i18n, _NowPlayingContext_i18nDefaults, _NowPlayingContext_i18CallbackRegistered, _NowPlayingContext_loadI18n, _NowPlayingContext_onSystemLanguageChanged;
Object.defineProperty(exports, "__esModule", { value: true });
const string_format_1 = __importDefault(require("string-format"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const PluginConfig_1 = require("./config/PluginConfig");
const Misc_1 = require("./utils/Misc");
const DUMMY_DEVICE_INFO = {
    name: 'Volumio',
    id: '1234567890',
    host: 'http://127.0.0.1'
};
class NowPlayingContext {
    constructor() {
        _NowPlayingContext_instances.add(this);
        _NowPlayingContext_data.set(this, void 0);
        _NowPlayingContext_pluginContext.set(this, void 0);
        _NowPlayingContext_pluginConfig.set(this, void 0);
        _NowPlayingContext_i18n.set(this, void 0);
        _NowPlayingContext_i18nDefaults.set(this, void 0);
        _NowPlayingContext_i18CallbackRegistered.set(this, void 0);
        __classPrivateFieldSet(this, _NowPlayingContext_data, {}, "f");
        __classPrivateFieldSet(this, _NowPlayingContext_i18n, {}, "f");
        __classPrivateFieldSet(this, _NowPlayingContext_i18nDefaults, {}, "f");
        __classPrivateFieldSet(this, _NowPlayingContext_i18CallbackRegistered, false, "f");
    }
    set(key, value) {
        __classPrivateFieldGet(this, _NowPlayingContext_data, "f")[key] = value;
    }
    get(key, defaultValue) {
        return (__classPrivateFieldGet(this, _NowPlayingContext_data, "f")[key] !== undefined) ? __classPrivateFieldGet(this, _NowPlayingContext_data, "f")[key] : (defaultValue || null);
    }
    delete(key) {
        delete __classPrivateFieldGet(this, _NowPlayingContext_data, "f")[key];
    }
    init(pluginContext, pluginConfig) {
        __classPrivateFieldSet(this, _NowPlayingContext_pluginContext, pluginContext, "f");
        __classPrivateFieldSet(this, _NowPlayingContext_pluginConfig, pluginConfig, "f");
        __classPrivateFieldGet(this, _NowPlayingContext_instances, "m", _NowPlayingContext_loadI18n).call(this);
        if (!__classPrivateFieldGet(this, _NowPlayingContext_i18CallbackRegistered, "f")) {
            __classPrivateFieldGet(this, _NowPlayingContext_pluginContext, "f").coreCommand.sharedVars.registerCallback('language_code', __classPrivateFieldGet(this, _NowPlayingContext_instances, "m", _NowPlayingContext_onSystemLanguageChanged).bind(this));
            __classPrivateFieldSet(this, _NowPlayingContext_i18CallbackRegistered, true, "f");
        }
    }
    toast(type, message, title = 'Now Playing') {
        __classPrivateFieldGet(this, _NowPlayingContext_pluginContext, "f").coreCommand.pushToastMessage(type, title, message);
    }
    broadcastMessage(msg, value) {
        return __classPrivateFieldGet(this, _NowPlayingContext_pluginContext, "f").coreCommand.broadcastMessage(msg, value);
    }
    refreshUIConfig() {
        __classPrivateFieldGet(this, _NowPlayingContext_pluginContext, "f").coreCommand.getUIConfigOnPlugin('user_interface', 'now_playing', {}).then((config) => {
            __classPrivateFieldGet(this, _NowPlayingContext_pluginContext, "f").coreCommand.broadcastMessage('pushUiConfig', config);
        });
    }
    getLogger() {
        return __classPrivateFieldGet(this, _NowPlayingContext_pluginContext, "f").logger;
    }
    getDeviceInfo() {
        if (!this.get('deviceInfo', null)) {
            const deviceInfo = __classPrivateFieldGet(this, _NowPlayingContext_pluginContext, "f").coreCommand.executeOnPlugin('system_controller', 'volumiodiscovery', 'getThisDevice');
            this.set('deviceInfo', deviceInfo);
        }
        const deviceInfo = this.get('deviceInfo', null);
        if (!deviceInfo) {
            this.getLogger().warn('[now-playing] Failed to get device info!');
            return DUMMY_DEVICE_INFO;
        }
        return deviceInfo;
    }
    getLanguageCode() {
        return __classPrivateFieldGet(this, _NowPlayingContext_pluginContext, "f").coreCommand.sharedVars.get('language_code');
    }
    getPluginSetting(type, plugin, setting) {
        return __classPrivateFieldGet(this, _NowPlayingContext_pluginContext, "f").coreCommand.executeOnPlugin(type, plugin, 'getConfigParam', setting);
    }
    getMusicServicePlugin(name) {
        return __classPrivateFieldGet(this, _NowPlayingContext_pluginContext, "f").coreCommand.pluginManager.getPlugin('music_service', name) || null;
    }
    getErrorMessage(message, error, stack = true) {
        let result = message;
        if (typeof error == 'object') {
            if (stack && error.stack) {
                result += ` ${error.stack}`;
            }
            else if (error.message) {
                result += ` ${error.message}`;
            }
        }
        else if (typeof error == 'string') {
            result += ` ${error}`;
        }
        return result.trim();
    }
    hasConfigKey(key) {
        return __classPrivateFieldGet(this, _NowPlayingContext_pluginConfig, "f").has(key);
    }
    getConfigValue(key, raw = false) {
        if (raw) {
            return __classPrivateFieldGet(this, _NowPlayingContext_pluginConfig, "f").has(key) ? __classPrivateFieldGet(this, _NowPlayingContext_pluginConfig, "f").get(key) : undefined;
        }
        const schema = PluginConfig_1.PLUGIN_CONFIG_SCHEMA[key];
        if (__classPrivateFieldGet(this, _NowPlayingContext_pluginConfig, "f").has(key)) {
            const val = __classPrivateFieldGet(this, _NowPlayingContext_pluginConfig, "f").get(key);
            if (schema.json) {
                try {
                    const parseVal = JSON.parse(val);
                    const merged = (0, Misc_1.assignObjectEmptyProps)({}, parseVal, schema.defaultValue);
                    return merged;
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
        __classPrivateFieldGet(this, _NowPlayingContext_pluginConfig, "f").delete(key);
    }
    setConfigValue(key, value) {
        const schema = PluginConfig_1.PLUGIN_CONFIG_SCHEMA[key];
        __classPrivateFieldGet(this, _NowPlayingContext_pluginConfig, "f").set(key, schema.json ? JSON.stringify(value) : value);
    }
    getConfigFilePath() {
        return __classPrivateFieldGet(this, _NowPlayingContext_pluginConfig, "f").filePath;
    }
    reset() {
        __classPrivateFieldSet(this, _NowPlayingContext_pluginContext, null, "f");
        __classPrivateFieldSet(this, _NowPlayingContext_pluginConfig, null, "f");
        __classPrivateFieldSet(this, _NowPlayingContext_data, {}, "f");
    }
    getI18n(key, ...formatValues) {
        let str;
        if (key.indexOf('.') > 0) {
            const mainKey = key.split('.')[0];
            const secKey = key.split('.')[1];
            str = __classPrivateFieldGet(this, _NowPlayingContext_i18n, "f")[mainKey]?.[secKey] ||
                __classPrivateFieldGet(this, _NowPlayingContext_i18nDefaults, "f")[mainKey]?.[secKey] ||
                key;
        }
        else {
            str = (__classPrivateFieldGet(this, _NowPlayingContext_i18n, "f")[key] || __classPrivateFieldGet(this, _NowPlayingContext_i18nDefaults, "f")[key] || key);
        }
        if (str && formatValues.length) {
            str = (0, string_format_1.default)(str, ...formatValues);
        }
        return str;
    }
}
_NowPlayingContext_data = new WeakMap(), _NowPlayingContext_pluginContext = new WeakMap(), _NowPlayingContext_pluginConfig = new WeakMap(), _NowPlayingContext_i18n = new WeakMap(), _NowPlayingContext_i18nDefaults = new WeakMap(), _NowPlayingContext_i18CallbackRegistered = new WeakMap(), _NowPlayingContext_instances = new WeakSet(), _NowPlayingContext_loadI18n = function _NowPlayingContext_loadI18n() {
    if (__classPrivateFieldGet(this, _NowPlayingContext_pluginContext, "f")) {
        const i18nPath = `${__dirname}/../i18n`;
        try {
            __classPrivateFieldSet(this, _NowPlayingContext_i18nDefaults, fs_extra_1.default.readJsonSync(`${i18nPath}/strings_en.json`), "f");
        }
        catch (e) {
            __classPrivateFieldSet(this, _NowPlayingContext_i18nDefaults, {}, "f");
        }
        try {
            const language_code = __classPrivateFieldGet(this, _NowPlayingContext_pluginContext, "f").coreCommand.sharedVars.get('language_code');
            __classPrivateFieldSet(this, _NowPlayingContext_i18n, fs_extra_1.default.readJsonSync(`${i18nPath}/strings_${language_code}.json`), "f");
        }
        catch (e) {
            __classPrivateFieldSet(this, _NowPlayingContext_i18n, __classPrivateFieldGet(this, _NowPlayingContext_i18nDefaults, "f"), "f");
        }
    }
}, _NowPlayingContext_onSystemLanguageChanged = function _NowPlayingContext_onSystemLanguageChanged() {
    __classPrivateFieldGet(this, _NowPlayingContext_instances, "m", _NowPlayingContext_loadI18n).call(this);
};
exports.default = new NowPlayingContext();
//# sourceMappingURL=NowPlayingContext.js.map