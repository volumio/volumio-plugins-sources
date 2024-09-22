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
var _JellyfinContext_instances, _JellyfinContext_singletons, _JellyfinContext_data, _JellyfinContext_pluginContext, _JellyfinContext_pluginConfig, _JellyfinContext_i18n, _JellyfinContext_i18nDefaults, _JellyfinContext_i18CallbackRegistered, _JellyfinContext_playerNameCallbackRegistered, _JellyfinContext_getSingleton, _JellyfinContext_loadI18n, _JellyfinContext_onSystemLanguageChanged, _JellyfinContext_onPlayerNameChanged;
Object.defineProperty(exports, "__esModule", { value: true });
const string_format_1 = __importDefault(require("string-format"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const PluginConfig_1 = require("./util/PluginConfig");
const DUMMY_DEVICE_INFO = {
    name: 'Volumio',
    id: '1234567890',
    host: 'http://127.0.0.1'
};
class JellyfinContext {
    constructor() {
        _JellyfinContext_instances.add(this);
        _JellyfinContext_singletons.set(this, void 0);
        _JellyfinContext_data.set(this, void 0);
        _JellyfinContext_pluginContext.set(this, void 0);
        _JellyfinContext_pluginConfig.set(this, void 0);
        _JellyfinContext_i18n.set(this, void 0);
        _JellyfinContext_i18nDefaults.set(this, void 0);
        _JellyfinContext_i18CallbackRegistered.set(this, void 0);
        _JellyfinContext_playerNameCallbackRegistered.set(this, void 0);
        __classPrivateFieldSet(this, _JellyfinContext_singletons, {}, "f");
        __classPrivateFieldSet(this, _JellyfinContext_data, {}, "f");
        __classPrivateFieldSet(this, _JellyfinContext_i18n, {}, "f");
        __classPrivateFieldSet(this, _JellyfinContext_i18nDefaults, {}, "f");
        __classPrivateFieldSet(this, _JellyfinContext_i18CallbackRegistered, false, "f");
        __classPrivateFieldSet(this, _JellyfinContext_playerNameCallbackRegistered, false, "f");
    }
    set(key, value) {
        __classPrivateFieldGet(this, _JellyfinContext_data, "f")[key] = value;
    }
    get(key, defaultValue) {
        return (__classPrivateFieldGet(this, _JellyfinContext_data, "f")[key] !== undefined) ? __classPrivateFieldGet(this, _JellyfinContext_data, "f")[key] : (defaultValue || null);
    }
    delete(key) {
        delete __classPrivateFieldGet(this, _JellyfinContext_data, "f")[key];
    }
    init(pluginContext, pluginConfig) {
        __classPrivateFieldSet(this, _JellyfinContext_pluginContext, pluginContext, "f");
        __classPrivateFieldSet(this, _JellyfinContext_pluginConfig, pluginConfig, "f");
        __classPrivateFieldGet(this, _JellyfinContext_instances, "m", _JellyfinContext_loadI18n).call(this);
        if (!__classPrivateFieldGet(this, _JellyfinContext_i18CallbackRegistered, "f")) {
            __classPrivateFieldGet(this, _JellyfinContext_pluginContext, "f").coreCommand.sharedVars.registerCallback('language_code', __classPrivateFieldGet(this, _JellyfinContext_instances, "m", _JellyfinContext_onSystemLanguageChanged).bind(this));
            __classPrivateFieldSet(this, _JellyfinContext_i18CallbackRegistered, true, "f");
        }
        if (!__classPrivateFieldGet(this, _JellyfinContext_playerNameCallbackRegistered, "f")) {
            __classPrivateFieldGet(this, _JellyfinContext_pluginContext, "f").coreCommand.executeOnPlugin('system_controller', 'system', 'registerCallback', __classPrivateFieldGet(this, _JellyfinContext_instances, "m", _JellyfinContext_onPlayerNameChanged).bind(this));
            __classPrivateFieldSet(this, _JellyfinContext_playerNameCallbackRegistered, true, "f");
        }
    }
    toast(type, message, title = 'Jellyfin') {
        __classPrivateFieldGet(this, _JellyfinContext_pluginContext, "f").coreCommand.pushToastMessage(type, title, message);
    }
    getLogger() {
        return __classPrivateFieldGet(this, _JellyfinContext_pluginContext, "f").logger;
    }
    getDeviceInfo() {
        if (!this.get('deviceInfo', null)) {
            const deviceInfo = __classPrivateFieldGet(this, _JellyfinContext_pluginContext, "f").coreCommand.executeOnPlugin('system_controller', 'volumiodiscovery', 'getThisDevice');
            this.set('deviceInfo', deviceInfo);
        }
        const deviceInfo = this.get('deviceInfo', null);
        if (!deviceInfo) {
            this.getLogger().warn('[jellyfin] Failed to get device info!');
            return DUMMY_DEVICE_INFO;
        }
        return deviceInfo;
    }
    hasConfigKey(key) {
        return __classPrivateFieldGet(this, _JellyfinContext_pluginConfig, "f").has(key);
    }
    getConfigValue(key) {
        const schema = PluginConfig_1.PLUGIN_CONFIG_SCHEMA[key];
        if (__classPrivateFieldGet(this, _JellyfinContext_pluginConfig, "f").has(key)) {
            const val = __classPrivateFieldGet(this, _JellyfinContext_pluginConfig, "f").get(key);
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
        __classPrivateFieldGet(this, _JellyfinContext_pluginConfig, "f").delete(key);
    }
    setConfigValue(key, value) {
        const schema = PluginConfig_1.PLUGIN_CONFIG_SCHEMA[key];
        __classPrivateFieldGet(this, _JellyfinContext_pluginConfig, "f").set(key, schema.json ? JSON.stringify(value) : value);
    }
    getAlbumArtPlugin() {
        return __classPrivateFieldGet(this, _JellyfinContext_instances, "m", _JellyfinContext_getSingleton).call(this, 'albumArtPlugin', () => __classPrivateFieldGet(this, _JellyfinContext_pluginContext, "f").coreCommand.pluginManager.getPlugin('miscellanea', 'albumart'));
    }
    getMpdPlugin() {
        return __classPrivateFieldGet(this, _JellyfinContext_instances, "m", _JellyfinContext_getSingleton).call(this, 'mpdPlugin', () => __classPrivateFieldGet(this, _JellyfinContext_pluginContext, "f").coreCommand.pluginManager.getPlugin('music_service', 'mpd'));
    }
    getStateMachine() {
        return __classPrivateFieldGet(this, _JellyfinContext_pluginContext, "f").coreCommand.stateMachine;
    }
    getPlaylistManager() {
        return __classPrivateFieldGet(this, _JellyfinContext_pluginContext, "f").coreCommand.playListManager;
    }
    reset() {
        __classPrivateFieldSet(this, _JellyfinContext_pluginContext, null, "f");
        __classPrivateFieldSet(this, _JellyfinContext_pluginConfig, null, "f");
        __classPrivateFieldSet(this, _JellyfinContext_singletons, {}, "f");
        __classPrivateFieldSet(this, _JellyfinContext_data, {}, "f");
    }
    getI18n(key, ...formatValues) {
        let str;
        if (key.indexOf('.') > 0) {
            const mainKey = key.split('.')[0];
            const secKey = key.split('.')[1];
            str = __classPrivateFieldGet(this, _JellyfinContext_i18n, "f")[mainKey]?.[secKey] ||
                __classPrivateFieldGet(this, _JellyfinContext_i18nDefaults, "f")[mainKey]?.[secKey] ||
                key;
        }
        else {
            str = (__classPrivateFieldGet(this, _JellyfinContext_i18n, "f")[key] || __classPrivateFieldGet(this, _JellyfinContext_i18nDefaults, "f")[key] || key);
        }
        if (str && formatValues.length) {
            str = (0, string_format_1.default)(str, ...formatValues);
        }
        return str;
    }
    get volumioCoreCommand() {
        return __classPrivateFieldGet(this, _JellyfinContext_pluginContext, "f")?.coreCommand || null;
    }
}
_JellyfinContext_singletons = new WeakMap(), _JellyfinContext_data = new WeakMap(), _JellyfinContext_pluginContext = new WeakMap(), _JellyfinContext_pluginConfig = new WeakMap(), _JellyfinContext_i18n = new WeakMap(), _JellyfinContext_i18nDefaults = new WeakMap(), _JellyfinContext_i18CallbackRegistered = new WeakMap(), _JellyfinContext_playerNameCallbackRegistered = new WeakMap(), _JellyfinContext_instances = new WeakSet(), _JellyfinContext_getSingleton = function _JellyfinContext_getSingleton(key, getValue) {
    if (__classPrivateFieldGet(this, _JellyfinContext_singletons, "f")[key] == undefined) {
        __classPrivateFieldGet(this, _JellyfinContext_singletons, "f")[key] = getValue();
    }
    return __classPrivateFieldGet(this, _JellyfinContext_singletons, "f")[key];
}, _JellyfinContext_loadI18n = function _JellyfinContext_loadI18n() {
    if (__classPrivateFieldGet(this, _JellyfinContext_pluginContext, "f")) {
        const i18nPath = `${__dirname}/../i18n`;
        try {
            __classPrivateFieldSet(this, _JellyfinContext_i18nDefaults, fs_extra_1.default.readJsonSync(`${i18nPath}/strings_en.json`), "f");
        }
        catch (e) {
            __classPrivateFieldSet(this, _JellyfinContext_i18nDefaults, {}, "f");
        }
        try {
            const language_code = __classPrivateFieldGet(this, _JellyfinContext_pluginContext, "f").coreCommand.sharedVars.get('language_code');
            __classPrivateFieldSet(this, _JellyfinContext_i18n, fs_extra_1.default.readJsonSync(`${i18nPath}/strings_${language_code}.json`), "f");
        }
        catch (e) {
            __classPrivateFieldSet(this, _JellyfinContext_i18n, __classPrivateFieldGet(this, _JellyfinContext_i18nDefaults, "f"), "f");
        }
    }
}, _JellyfinContext_onSystemLanguageChanged = function _JellyfinContext_onSystemLanguageChanged() {
    __classPrivateFieldGet(this, _JellyfinContext_instances, "m", _JellyfinContext_loadI18n).call(this);
}, _JellyfinContext_onPlayerNameChanged = function _JellyfinContext_onPlayerNameChanged() {
    this.delete('deviceInfo');
    this.toast('warn', 'Detected change in system settings. Please restart plugin for changes to take effect.');
};
exports.default = new JellyfinContext();
//# sourceMappingURL=JellyfinContext.js.map