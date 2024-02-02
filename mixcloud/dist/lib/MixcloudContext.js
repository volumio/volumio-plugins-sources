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
var _MixcloudContext_instances, _MixcloudContext_singletons, _MixcloudContext_data, _MixcloudContext_pluginContext, _MixcloudContext_pluginConfig, _MixcloudContext_i18n, _MixcloudContext_i18nDefaults, _MixcloudContext_i18CallbackRegistered, _MixcloudContext_cache, _MixcloudContext_getSingleton, _MixcloudContext_loadI18n, _MixcloudContext_onSystemLanguageChanged;
Object.defineProperty(exports, "__esModule", { value: true });
const string_format_1 = __importDefault(require("string-format"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const Cache_1 = __importDefault(require("./util/Cache"));
const PluginConfig_1 = require("./util/PluginConfig");
class MixcloudContext {
    constructor() {
        _MixcloudContext_instances.add(this);
        _MixcloudContext_singletons.set(this, void 0);
        _MixcloudContext_data.set(this, void 0);
        _MixcloudContext_pluginContext.set(this, void 0);
        _MixcloudContext_pluginConfig.set(this, void 0);
        _MixcloudContext_i18n.set(this, void 0);
        _MixcloudContext_i18nDefaults.set(this, void 0);
        _MixcloudContext_i18CallbackRegistered.set(this, void 0);
        _MixcloudContext_cache.set(this, void 0);
        __classPrivateFieldSet(this, _MixcloudContext_singletons, {}, "f");
        __classPrivateFieldSet(this, _MixcloudContext_data, {}, "f");
        __classPrivateFieldSet(this, _MixcloudContext_i18n, {}, "f");
        __classPrivateFieldSet(this, _MixcloudContext_i18nDefaults, {}, "f");
        __classPrivateFieldSet(this, _MixcloudContext_i18CallbackRegistered, false, "f");
    }
    set(key, value) {
        __classPrivateFieldGet(this, _MixcloudContext_data, "f")[key] = value;
    }
    get(key, defaultValue) {
        return (__classPrivateFieldGet(this, _MixcloudContext_data, "f")[key] !== undefined) ? __classPrivateFieldGet(this, _MixcloudContext_data, "f")[key] : (defaultValue || null);
    }
    delete(key) {
        delete __classPrivateFieldGet(this, _MixcloudContext_data, "f")[key];
    }
    init(pluginContext, pluginConfig) {
        __classPrivateFieldSet(this, _MixcloudContext_pluginContext, pluginContext, "f");
        __classPrivateFieldSet(this, _MixcloudContext_pluginConfig, pluginConfig, "f");
        __classPrivateFieldGet(this, _MixcloudContext_instances, "m", _MixcloudContext_loadI18n).call(this);
        if (!__classPrivateFieldGet(this, _MixcloudContext_i18CallbackRegistered, "f")) {
            __classPrivateFieldGet(this, _MixcloudContext_pluginContext, "f").coreCommand.sharedVars.registerCallback('language_code', __classPrivateFieldGet(this, _MixcloudContext_instances, "m", _MixcloudContext_onSystemLanguageChanged).bind(this));
            __classPrivateFieldSet(this, _MixcloudContext_i18CallbackRegistered, true, "f");
        }
        __classPrivateFieldSet(this, _MixcloudContext_cache, new Cache_1.default(this.getConfigValue('cacheTTL'), this.getConfigValue('cacheMaxEntries')), "f");
    }
    toast(type, message, title = 'Mixcloud') {
        __classPrivateFieldGet(this, _MixcloudContext_pluginContext, "f").coreCommand.pushToastMessage(type, title, message);
    }
    getLogger() {
        return __classPrivateFieldGet(this, _MixcloudContext_pluginContext, "f").logger;
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
    getConfigValue(key) {
        const schema = PluginConfig_1.PLUGIN_CONFIG_SCHEMA[key];
        if (__classPrivateFieldGet(this, _MixcloudContext_pluginConfig, "f").has(key)) {
            const val = __classPrivateFieldGet(this, _MixcloudContext_pluginConfig, "f").get(key);
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
        __classPrivateFieldGet(this, _MixcloudContext_pluginConfig, "f").delete(key);
    }
    setConfigValue(key, value, json = false) {
        __classPrivateFieldGet(this, _MixcloudContext_pluginConfig, "f").set(key, json ? JSON.stringify(value) : value);
    }
    getAlbumArtPlugin() {
        return __classPrivateFieldGet(this, _MixcloudContext_instances, "m", _MixcloudContext_getSingleton).call(this, 'albumArtPlugin', () => __classPrivateFieldGet(this, _MixcloudContext_pluginContext, "f").coreCommand.pluginManager.getPlugin('miscellanea', 'albumart'));
    }
    getMpdPlugin() {
        return __classPrivateFieldGet(this, _MixcloudContext_instances, "m", _MixcloudContext_getSingleton).call(this, 'mpdPlugin', () => __classPrivateFieldGet(this, _MixcloudContext_pluginContext, "f").coreCommand.pluginManager.getPlugin('music_service', 'mpd'));
    }
    getStateMachine() {
        return __classPrivateFieldGet(this, _MixcloudContext_pluginContext, "f").coreCommand.stateMachine;
    }
    getCache() {
        return __classPrivateFieldGet(this, _MixcloudContext_cache, "f");
    }
    getPlaylistManager() {
        return __classPrivateFieldGet(this, _MixcloudContext_pluginContext, "f").coreCommand.playListManager;
    }
    reset() {
        __classPrivateFieldSet(this, _MixcloudContext_pluginContext, null, "f");
        __classPrivateFieldSet(this, _MixcloudContext_pluginConfig, null, "f");
        __classPrivateFieldSet(this, _MixcloudContext_singletons, {}, "f");
        __classPrivateFieldSet(this, _MixcloudContext_data, {}, "f");
        __classPrivateFieldGet(this, _MixcloudContext_cache, "f").clear();
    }
    getI18n(key, ...formatValues) {
        let str;
        if (key.indexOf('.') > 0) {
            const mainKey = key.split('.')[0];
            const secKey = key.split('.')[1];
            str = __classPrivateFieldGet(this, _MixcloudContext_i18n, "f")[mainKey]?.[secKey] ||
                __classPrivateFieldGet(this, _MixcloudContext_i18nDefaults, "f")[mainKey]?.[secKey] ||
                key;
        }
        else {
            str = (__classPrivateFieldGet(this, _MixcloudContext_i18n, "f")[key] || __classPrivateFieldGet(this, _MixcloudContext_i18nDefaults, "f")[key] || key);
        }
        if (str && formatValues.length) {
            str = (0, string_format_1.default)(str, ...formatValues);
        }
        return str;
    }
    get volumioCoreCommand() {
        return __classPrivateFieldGet(this, _MixcloudContext_pluginContext, "f")?.coreCommand || null;
    }
}
_MixcloudContext_singletons = new WeakMap(), _MixcloudContext_data = new WeakMap(), _MixcloudContext_pluginContext = new WeakMap(), _MixcloudContext_pluginConfig = new WeakMap(), _MixcloudContext_i18n = new WeakMap(), _MixcloudContext_i18nDefaults = new WeakMap(), _MixcloudContext_i18CallbackRegistered = new WeakMap(), _MixcloudContext_cache = new WeakMap(), _MixcloudContext_instances = new WeakSet(), _MixcloudContext_getSingleton = function _MixcloudContext_getSingleton(key, getValue) {
    if (__classPrivateFieldGet(this, _MixcloudContext_singletons, "f")[key] == undefined) {
        __classPrivateFieldGet(this, _MixcloudContext_singletons, "f")[key] = getValue();
    }
    return __classPrivateFieldGet(this, _MixcloudContext_singletons, "f")[key];
}, _MixcloudContext_loadI18n = function _MixcloudContext_loadI18n() {
    if (__classPrivateFieldGet(this, _MixcloudContext_pluginContext, "f")) {
        const i18nPath = `${__dirname}/../i18n`;
        try {
            __classPrivateFieldSet(this, _MixcloudContext_i18nDefaults, fs_extra_1.default.readJsonSync(`${i18nPath}/strings_en.json`), "f");
        }
        catch (e) {
            __classPrivateFieldSet(this, _MixcloudContext_i18nDefaults, {}, "f");
        }
        try {
            const language_code = __classPrivateFieldGet(this, _MixcloudContext_pluginContext, "f").coreCommand.sharedVars.get('language_code');
            __classPrivateFieldSet(this, _MixcloudContext_i18n, fs_extra_1.default.readJsonSync(`${i18nPath}/strings_${language_code}.json`), "f");
        }
        catch (e) {
            __classPrivateFieldSet(this, _MixcloudContext_i18n, __classPrivateFieldGet(this, _MixcloudContext_i18nDefaults, "f"), "f");
        }
    }
}, _MixcloudContext_onSystemLanguageChanged = function _MixcloudContext_onSystemLanguageChanged() {
    __classPrivateFieldGet(this, _MixcloudContext_instances, "m", _MixcloudContext_loadI18n).call(this);
};
exports.default = new MixcloudContext();
//# sourceMappingURL=MixcloudContext.js.map