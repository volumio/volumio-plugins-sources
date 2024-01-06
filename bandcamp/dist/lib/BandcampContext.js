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
var _BandcampContext_instances, _BandcampContext_singletons, _BandcampContext_data, _BandcampContext_pluginContext, _BandcampContext_pluginConfig, _BandcampContext_i18n, _BandcampContext_i18nDefaults, _BandcampContext_i18CallbackRegistered, _BandcampContext_cache, _BandcampContext_getSingleton, _BandcampContext_loadI18n, _BandcampContext_onSystemLanguageChanged, _BandcampContext_onPlayerNameChanged;
Object.defineProperty(exports, "__esModule", { value: true });
const string_format_1 = __importDefault(require("string-format"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const Cache_1 = __importDefault(require("./util/Cache"));
class BandcampContext {
    constructor() {
        _BandcampContext_instances.add(this);
        _BandcampContext_singletons.set(this, void 0);
        _BandcampContext_data.set(this, void 0);
        _BandcampContext_pluginContext.set(this, void 0);
        _BandcampContext_pluginConfig.set(this, void 0);
        _BandcampContext_i18n.set(this, void 0);
        _BandcampContext_i18nDefaults.set(this, void 0);
        _BandcampContext_i18CallbackRegistered.set(this, void 0);
        _BandcampContext_cache.set(this, void 0);
        __classPrivateFieldSet(this, _BandcampContext_singletons, {}, "f");
        __classPrivateFieldSet(this, _BandcampContext_data, {}, "f");
        __classPrivateFieldSet(this, _BandcampContext_i18n, {}, "f");
        __classPrivateFieldSet(this, _BandcampContext_i18nDefaults, {}, "f");
        __classPrivateFieldSet(this, _BandcampContext_i18CallbackRegistered, false, "f");
    }
    set(key, value) {
        __classPrivateFieldGet(this, _BandcampContext_data, "f")[key] = value;
    }
    get(key, defaultValue) {
        return (__classPrivateFieldGet(this, _BandcampContext_data, "f")[key] !== undefined) ? __classPrivateFieldGet(this, _BandcampContext_data, "f")[key] : (defaultValue || null);
    }
    delete(key) {
        delete __classPrivateFieldGet(this, _BandcampContext_data, "f")[key];
    }
    init(pluginContext, pluginConfig) {
        __classPrivateFieldSet(this, _BandcampContext_pluginContext, pluginContext, "f");
        __classPrivateFieldSet(this, _BandcampContext_pluginConfig, pluginConfig, "f");
        __classPrivateFieldGet(this, _BandcampContext_instances, "m", _BandcampContext_loadI18n).call(this);
        if (!__classPrivateFieldGet(this, _BandcampContext_i18CallbackRegistered, "f")) {
            __classPrivateFieldGet(this, _BandcampContext_pluginContext, "f").coreCommand.sharedVars.registerCallback('language_code', __classPrivateFieldGet(this, _BandcampContext_instances, "m", _BandcampContext_onSystemLanguageChanged).bind(this));
            __classPrivateFieldSet(this, _BandcampContext_i18CallbackRegistered, true, "f");
        }
        __classPrivateFieldSet(this, _BandcampContext_cache, new Cache_1.default(this.getConfigValue('cacheTTL', 1800), this.getConfigValue('cacheMaxEntries', 5000)), "f");
    }
    toast(type, message, title = 'Bandcamp Discover') {
        __classPrivateFieldGet(this, _BandcampContext_pluginContext, "f").coreCommand.pushToastMessage(type, title, message);
    }
    getLogger() {
        return __classPrivateFieldGet(this, _BandcampContext_pluginContext, "f").logger;
    }
    getConfigValue(key, defaultValue, json = false) {
        if (__classPrivateFieldGet(this, _BandcampContext_pluginConfig, "f").has(key)) {
            const val = __classPrivateFieldGet(this, _BandcampContext_pluginConfig, "f").get(key);
            if (json) {
                try {
                    return JSON.parse(val);
                }
                catch (e) {
                    return defaultValue;
                }
            }
            else {
                return val;
            }
        }
        else {
            return defaultValue;
        }
    }
    deleteConfigValue(key) {
        __classPrivateFieldGet(this, _BandcampContext_pluginConfig, "f").delete(key);
    }
    setConfigValue(key, value, json = false) {
        __classPrivateFieldGet(this, _BandcampContext_pluginConfig, "f").set(key, json ? JSON.stringify(value) : value);
    }
    getAlbumArtPlugin() {
        return __classPrivateFieldGet(this, _BandcampContext_instances, "m", _BandcampContext_getSingleton).call(this, 'albumArtPlugin', () => __classPrivateFieldGet(this, _BandcampContext_pluginContext, "f").coreCommand.pluginManager.getPlugin('miscellanea', 'albumart'));
    }
    getMpdPlugin() {
        return __classPrivateFieldGet(this, _BandcampContext_instances, "m", _BandcampContext_getSingleton).call(this, 'mpdPlugin', () => __classPrivateFieldGet(this, _BandcampContext_pluginContext, "f").coreCommand.pluginManager.getPlugin('music_service', 'mpd'));
    }
    getStateMachine() {
        return __classPrivateFieldGet(this, _BandcampContext_pluginContext, "f").coreCommand.stateMachine;
    }
    getCache() {
        return __classPrivateFieldGet(this, _BandcampContext_cache, "f");
    }
    getPlaylistManager() {
        return __classPrivateFieldGet(this, _BandcampContext_pluginContext, "f").coreCommand.playListManager;
    }
    reset() {
        __classPrivateFieldSet(this, _BandcampContext_pluginContext, null, "f");
        __classPrivateFieldSet(this, _BandcampContext_pluginConfig, null, "f");
        __classPrivateFieldSet(this, _BandcampContext_singletons, {}, "f");
        __classPrivateFieldSet(this, _BandcampContext_data, {}, "f");
        __classPrivateFieldGet(this, _BandcampContext_cache, "f").clear();
    }
    getI18n(key, ...formatValues) {
        let str;
        if (key.indexOf('.') > 0) {
            const mainKey = key.split('.')[0];
            const secKey = key.split('.')[1];
            str = __classPrivateFieldGet(this, _BandcampContext_i18n, "f")[mainKey]?.[secKey] ||
                __classPrivateFieldGet(this, _BandcampContext_i18nDefaults, "f")[mainKey]?.[secKey] ||
                key;
        }
        else {
            str = (__classPrivateFieldGet(this, _BandcampContext_i18n, "f")[key] || __classPrivateFieldGet(this, _BandcampContext_i18nDefaults, "f")[key] || key);
        }
        if (str && formatValues.length) {
            str = (0, string_format_1.default)(str, ...formatValues);
        }
        return str;
    }
    get volumioCoreCommand() {
        return __classPrivateFieldGet(this, _BandcampContext_pluginContext, "f")?.coreCommand || null;
    }
}
_BandcampContext_singletons = new WeakMap(), _BandcampContext_data = new WeakMap(), _BandcampContext_pluginContext = new WeakMap(), _BandcampContext_pluginConfig = new WeakMap(), _BandcampContext_i18n = new WeakMap(), _BandcampContext_i18nDefaults = new WeakMap(), _BandcampContext_i18CallbackRegistered = new WeakMap(), _BandcampContext_cache = new WeakMap(), _BandcampContext_instances = new WeakSet(), _BandcampContext_getSingleton = function _BandcampContext_getSingleton(key, getValue) {
    if (__classPrivateFieldGet(this, _BandcampContext_singletons, "f")[key] == undefined) {
        __classPrivateFieldGet(this, _BandcampContext_singletons, "f")[key] = getValue();
    }
    return __classPrivateFieldGet(this, _BandcampContext_singletons, "f")[key];
}, _BandcampContext_loadI18n = function _BandcampContext_loadI18n() {
    if (__classPrivateFieldGet(this, _BandcampContext_pluginContext, "f")) {
        const i18nPath = `${__dirname}/../i18n`;
        try {
            __classPrivateFieldSet(this, _BandcampContext_i18nDefaults, fs_extra_1.default.readJsonSync(`${i18nPath}/strings_en.json`), "f");
        }
        catch (e) {
            __classPrivateFieldSet(this, _BandcampContext_i18nDefaults, {}, "f");
        }
        try {
            const language_code = __classPrivateFieldGet(this, _BandcampContext_pluginContext, "f").coreCommand.sharedVars.get('language_code');
            __classPrivateFieldSet(this, _BandcampContext_i18n, fs_extra_1.default.readJsonSync(`${i18nPath}/strings_${language_code}.json`), "f");
        }
        catch (e) {
            __classPrivateFieldSet(this, _BandcampContext_i18n, __classPrivateFieldGet(this, _BandcampContext_i18nDefaults, "f"), "f");
        }
    }
}, _BandcampContext_onSystemLanguageChanged = function _BandcampContext_onSystemLanguageChanged() {
    __classPrivateFieldGet(this, _BandcampContext_instances, "m", _BandcampContext_loadI18n).call(this);
}, _BandcampContext_onPlayerNameChanged = function _BandcampContext_onPlayerNameChanged() {
    this.delete('deviceInfo');
    this.toast('warning', 'Detected change in system settings. Please restart plugin for changes to take effect.');
};
exports.default = new BandcampContext();
//# sourceMappingURL=BandcampContext.js.map