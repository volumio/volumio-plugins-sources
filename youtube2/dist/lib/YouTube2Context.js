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
var _YouTube2Context_instances, _YouTube2Context_singletons, _YouTube2Context_data, _YouTube2Context_pluginContext, _YouTube2Context_pluginConfig, _YouTube2Context_i18n, _YouTube2Context_i18nDefaults, _YouTube2Context_i18CallbackRegistered, _YouTube2Context_getSingleton, _YouTube2Context_loadI18n, _YouTube2Context_onSystemLanguageChanged;
Object.defineProperty(exports, "__esModule", { value: true });
const string_format_1 = __importDefault(require("string-format"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const ConfigModel_1 = require("./model/ConfigModel");
class YouTube2Context {
    constructor() {
        _YouTube2Context_instances.add(this);
        _YouTube2Context_singletons.set(this, void 0);
        _YouTube2Context_data.set(this, void 0);
        _YouTube2Context_pluginContext.set(this, void 0);
        _YouTube2Context_pluginConfig.set(this, void 0);
        _YouTube2Context_i18n.set(this, void 0);
        _YouTube2Context_i18nDefaults.set(this, void 0);
        _YouTube2Context_i18CallbackRegistered.set(this, void 0);
        __classPrivateFieldSet(this, _YouTube2Context_singletons, {}, "f");
        __classPrivateFieldSet(this, _YouTube2Context_data, {}, "f");
        __classPrivateFieldSet(this, _YouTube2Context_i18n, {}, "f");
        __classPrivateFieldSet(this, _YouTube2Context_i18nDefaults, {}, "f");
        __classPrivateFieldSet(this, _YouTube2Context_i18CallbackRegistered, false, "f");
    }
    set(key, value) {
        __classPrivateFieldGet(this, _YouTube2Context_data, "f")[key] = value;
    }
    get(key, defaultValue) {
        return (__classPrivateFieldGet(this, _YouTube2Context_data, "f")[key] !== undefined) ? __classPrivateFieldGet(this, _YouTube2Context_data, "f")[key] : (defaultValue || null);
    }
    delete(key) {
        delete __classPrivateFieldGet(this, _YouTube2Context_data, "f")[key];
    }
    init(pluginContext, pluginConfig) {
        __classPrivateFieldSet(this, _YouTube2Context_pluginContext, pluginContext, "f");
        __classPrivateFieldSet(this, _YouTube2Context_pluginConfig, pluginConfig, "f");
        __classPrivateFieldGet(this, _YouTube2Context_instances, "m", _YouTube2Context_loadI18n).call(this);
        if (!__classPrivateFieldGet(this, _YouTube2Context_i18CallbackRegistered, "f")) {
            __classPrivateFieldGet(this, _YouTube2Context_pluginContext, "f").coreCommand.sharedVars.registerCallback('language_code', __classPrivateFieldGet(this, _YouTube2Context_instances, "m", _YouTube2Context_onSystemLanguageChanged).bind(this));
            __classPrivateFieldSet(this, _YouTube2Context_i18CallbackRegistered, true, "f");
        }
    }
    toast(type, message, title = 'YouTube2') {
        __classPrivateFieldGet(this, _YouTube2Context_pluginContext, "f").coreCommand.pushToastMessage(type, title, message);
    }
    refreshUIConfig() {
        __classPrivateFieldGet(this, _YouTube2Context_pluginContext, "f").coreCommand.getUIConfigOnPlugin('music_service', 'youtube2', {}).then((config) => {
            __classPrivateFieldGet(this, _YouTube2Context_pluginContext, "f").coreCommand.broadcastMessage('pushUiConfig', config);
        });
    }
    getLogger() {
        return __classPrivateFieldGet(this, _YouTube2Context_pluginContext, "f").logger;
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
        return __classPrivateFieldGet(this, _YouTube2Context_pluginConfig, "f").has(key);
    }
    getConfigValue(key) {
        const schema = ConfigModel_1.PLUGIN_CONFIG_SCHEMA[key];
        if (__classPrivateFieldGet(this, _YouTube2Context_pluginConfig, "f").has(key)) {
            const val = __classPrivateFieldGet(this, _YouTube2Context_pluginConfig, "f").get(key);
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
        __classPrivateFieldGet(this, _YouTube2Context_pluginConfig, "f").delete(key);
    }
    setConfigValue(key, value) {
        const schema = ConfigModel_1.PLUGIN_CONFIG_SCHEMA[key];
        __classPrivateFieldGet(this, _YouTube2Context_pluginConfig, "f").set(key, schema.json ? JSON.stringify(value) : value);
    }
    getAlbumArtPlugin() {
        return __classPrivateFieldGet(this, _YouTube2Context_instances, "m", _YouTube2Context_getSingleton).call(this, 'albumArtPlugin', () => __classPrivateFieldGet(this, _YouTube2Context_pluginContext, "f").coreCommand.pluginManager.getPlugin('miscellanea', 'albumart'));
    }
    getMpdPlugin() {
        return __classPrivateFieldGet(this, _YouTube2Context_instances, "m", _YouTube2Context_getSingleton).call(this, 'mpdPlugin', () => __classPrivateFieldGet(this, _YouTube2Context_pluginContext, "f").coreCommand.pluginManager.getPlugin('music_service', 'mpd'));
    }
    getStateMachine() {
        return __classPrivateFieldGet(this, _YouTube2Context_pluginContext, "f").coreCommand.stateMachine;
    }
    reset() {
        __classPrivateFieldSet(this, _YouTube2Context_pluginContext, null, "f");
        __classPrivateFieldSet(this, _YouTube2Context_pluginConfig, null, "f");
        __classPrivateFieldSet(this, _YouTube2Context_singletons, {}, "f");
        __classPrivateFieldSet(this, _YouTube2Context_data, {}, "f");
    }
    getI18n(key, ...formatValues) {
        let str;
        if (key.indexOf('.') > 0) {
            const mainKey = key.split('.')[0];
            const secKey = key.split('.')[1];
            str = __classPrivateFieldGet(this, _YouTube2Context_i18n, "f")[mainKey]?.[secKey] ||
                __classPrivateFieldGet(this, _YouTube2Context_i18nDefaults, "f")[mainKey]?.[secKey] ||
                key;
        }
        else {
            str = (__classPrivateFieldGet(this, _YouTube2Context_i18n, "f")[key] || __classPrivateFieldGet(this, _YouTube2Context_i18nDefaults, "f")[key] || key);
        }
        if (str && formatValues.length) {
            str = (0, string_format_1.default)(str, ...formatValues);
        }
        return str;
    }
    get volumioCoreCommand() {
        return __classPrivateFieldGet(this, _YouTube2Context_pluginContext, "f")?.coreCommand || null;
    }
}
_YouTube2Context_singletons = new WeakMap(), _YouTube2Context_data = new WeakMap(), _YouTube2Context_pluginContext = new WeakMap(), _YouTube2Context_pluginConfig = new WeakMap(), _YouTube2Context_i18n = new WeakMap(), _YouTube2Context_i18nDefaults = new WeakMap(), _YouTube2Context_i18CallbackRegistered = new WeakMap(), _YouTube2Context_instances = new WeakSet(), _YouTube2Context_getSingleton = function _YouTube2Context_getSingleton(key, getValue) {
    if (__classPrivateFieldGet(this, _YouTube2Context_singletons, "f")[key] == undefined) {
        __classPrivateFieldGet(this, _YouTube2Context_singletons, "f")[key] = getValue();
    }
    return __classPrivateFieldGet(this, _YouTube2Context_singletons, "f")[key];
}, _YouTube2Context_loadI18n = function _YouTube2Context_loadI18n() {
    if (__classPrivateFieldGet(this, _YouTube2Context_pluginContext, "f")) {
        const i18nPath = `${__dirname}/../i18n`;
        try {
            __classPrivateFieldSet(this, _YouTube2Context_i18nDefaults, fs_extra_1.default.readJsonSync(`${i18nPath}/strings_en.json`), "f");
        }
        catch (e) {
            __classPrivateFieldSet(this, _YouTube2Context_i18nDefaults, {}, "f");
        }
        try {
            const language_code = __classPrivateFieldGet(this, _YouTube2Context_pluginContext, "f").coreCommand.sharedVars.get('language_code');
            __classPrivateFieldSet(this, _YouTube2Context_i18n, fs_extra_1.default.readJsonSync(`${i18nPath}/strings_${language_code}.json`), "f");
        }
        catch (e) {
            __classPrivateFieldSet(this, _YouTube2Context_i18n, __classPrivateFieldGet(this, _YouTube2Context_i18nDefaults, "f"), "f");
        }
    }
}, _YouTube2Context_onSystemLanguageChanged = function _YouTube2Context_onSystemLanguageChanged() {
    __classPrivateFieldGet(this, _YouTube2Context_instances, "m", _YouTube2Context_loadI18n).call(this);
};
exports.default = new YouTube2Context();
//# sourceMappingURL=YouTube2Context.js.map