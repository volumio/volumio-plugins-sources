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
var _YTCRContext_instances, _YTCRContext_singletons, _YTCRContext_data, _YTCRContext_pluginContext, _YTCRContext_pluginConfig, _YTCRContext_i18n, _YTCRContext_i18nDefaults, _YTCRContext_i18CallbackRegistered, _YTCRContext_getSingleton, _YTCRContext_loadI18n, _YTCRContext_onSystemLanguageChanged;
Object.defineProperty(exports, "__esModule", { value: true });
const string_format_1 = __importDefault(require("string-format"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const Utils_1 = require("./Utils");
class YTCRContext {
    constructor() {
        _YTCRContext_instances.add(this);
        _YTCRContext_singletons.set(this, void 0);
        _YTCRContext_data.set(this, void 0);
        _YTCRContext_pluginContext.set(this, void 0);
        _YTCRContext_pluginConfig.set(this, void 0);
        _YTCRContext_i18n.set(this, void 0);
        _YTCRContext_i18nDefaults.set(this, void 0);
        _YTCRContext_i18CallbackRegistered.set(this, void 0);
        __classPrivateFieldSet(this, _YTCRContext_singletons, {}, "f");
        __classPrivateFieldSet(this, _YTCRContext_data, {}, "f");
        __classPrivateFieldSet(this, _YTCRContext_i18n, {}, "f");
        __classPrivateFieldSet(this, _YTCRContext_i18nDefaults, {}, "f");
        __classPrivateFieldSet(this, _YTCRContext_i18CallbackRegistered, false, "f");
    }
    set(key, value) {
        __classPrivateFieldGet(this, _YTCRContext_data, "f")[key] = value;
    }
    get(key, defaultValue = null) {
        return (__classPrivateFieldGet(this, _YTCRContext_data, "f")[key] !== undefined) ? __classPrivateFieldGet(this, _YTCRContext_data, "f")[key] : defaultValue;
    }
    init(pluginContext, pluginConfig) {
        __classPrivateFieldSet(this, _YTCRContext_pluginContext, pluginContext, "f");
        __classPrivateFieldSet(this, _YTCRContext_pluginConfig, pluginConfig, "f");
        __classPrivateFieldGet(this, _YTCRContext_instances, "m", _YTCRContext_loadI18n).call(this);
        if (!__classPrivateFieldGet(this, _YTCRContext_i18CallbackRegistered, "f")) {
            __classPrivateFieldGet(this, _YTCRContext_pluginContext, "f").coreCommand.sharedVars.registerCallback('language_code', __classPrivateFieldGet(this, _YTCRContext_instances, "m", _YTCRContext_onSystemLanguageChanged).bind(this));
            __classPrivateFieldSet(this, _YTCRContext_i18CallbackRegistered, true, "f");
        }
    }
    toast(type, message, title = 'YouTube Cast Receiver') {
        __classPrivateFieldGet(this, _YTCRContext_pluginContext, "f").coreCommand.pushToastMessage(type, title, message);
    }
    getDeviceInfo() {
        return __classPrivateFieldGet(this, _YTCRContext_pluginContext, "f").coreCommand.getId();
    }
    getConfigValue(key, defaultValue = undefined, json = false) {
        if (__classPrivateFieldGet(this, _YTCRContext_pluginConfig, "f").has(key)) {
            const val = __classPrivateFieldGet(this, _YTCRContext_pluginConfig, "f").get(key);
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
        __classPrivateFieldGet(this, _YTCRContext_pluginConfig, "f").delete(key);
    }
    setConfigValue(key, value, json = false) {
        __classPrivateFieldGet(this, _YTCRContext_pluginConfig, "f").set(key, json ? JSON.stringify(value) : value);
    }
    getMpdPlugin() {
        return __classPrivateFieldGet(this, _YTCRContext_instances, "m", _YTCRContext_getSingleton).call(this, 'mpdPlugin', () => this.getMusicServicePlugin('mpd'));
    }
    getMusicServicePlugin(name) {
        return __classPrivateFieldGet(this, _YTCRContext_pluginContext, "f").coreCommand.pluginManager.getPlugin('music_service', name) || null;
    }
    async getPluginInfo(name, category) {
        const installed = await (0, Utils_1.kewToJSPromise)(__classPrivateFieldGet(this, _YTCRContext_pluginContext, "f").coreCommand.pluginManager.getInstalledPlugins());
        return installed.find((p) => {
            const matchName = p.name === name;
            const matchCategory = category ? category === p.category : true;
            return matchName && matchCategory;
        }) || null;
    }
    getStateMachine() {
        return __classPrivateFieldGet(this, _YTCRContext_pluginContext, "f").coreCommand.stateMachine;
    }
    reset() {
        __classPrivateFieldSet(this, _YTCRContext_pluginContext, null, "f");
        __classPrivateFieldSet(this, _YTCRContext_pluginConfig, null, "f");
        __classPrivateFieldSet(this, _YTCRContext_singletons, {}, "f");
        __classPrivateFieldSet(this, _YTCRContext_data, {}, "f");
    }
    getI18n(key, ...formatValues) {
        let str;
        if (key.indexOf('.') > 0) {
            const mainKey = key.split('.')[0];
            const secKey = key.split('.')[1];
            str = __classPrivateFieldGet(this, _YTCRContext_i18n, "f")[mainKey]?.[secKey] ||
                __classPrivateFieldGet(this, _YTCRContext_i18nDefaults, "f")[mainKey]?.[secKey] ||
                key;
        }
        else {
            str = (__classPrivateFieldGet(this, _YTCRContext_i18n, "f")[key] || __classPrivateFieldGet(this, _YTCRContext_i18nDefaults, "f")[key] || key);
        }
        if (str && formatValues.length) {
            str = (0, string_format_1.default)(str, ...formatValues);
        }
        return str;
    }
}
_YTCRContext_singletons = new WeakMap(), _YTCRContext_data = new WeakMap(), _YTCRContext_pluginContext = new WeakMap(), _YTCRContext_pluginConfig = new WeakMap(), _YTCRContext_i18n = new WeakMap(), _YTCRContext_i18nDefaults = new WeakMap(), _YTCRContext_i18CallbackRegistered = new WeakMap(), _YTCRContext_instances = new WeakSet(), _YTCRContext_getSingleton = function _YTCRContext_getSingleton(key, getValue) {
    if (__classPrivateFieldGet(this, _YTCRContext_singletons, "f")[key] == undefined) {
        __classPrivateFieldGet(this, _YTCRContext_singletons, "f")[key] = getValue();
    }
    return __classPrivateFieldGet(this, _YTCRContext_singletons, "f")[key];
}, _YTCRContext_loadI18n = function _YTCRContext_loadI18n() {
    if (__classPrivateFieldGet(this, _YTCRContext_pluginContext, "f")) {
        const i18nPath = `${__dirname}/../i18n`;
        try {
            __classPrivateFieldSet(this, _YTCRContext_i18nDefaults, fs_extra_1.default.readJsonSync(`${i18nPath}/strings_en.json`), "f");
        }
        catch (e) {
            __classPrivateFieldSet(this, _YTCRContext_i18nDefaults, {}, "f");
        }
        try {
            const language_code = __classPrivateFieldGet(this, _YTCRContext_pluginContext, "f").coreCommand.sharedVars.get('language_code');
            __classPrivateFieldSet(this, _YTCRContext_i18n, fs_extra_1.default.readJsonSync(`${i18nPath}/strings_${language_code}.json`), "f");
        }
        catch (e) {
            __classPrivateFieldSet(this, _YTCRContext_i18n, __classPrivateFieldGet(this, _YTCRContext_i18nDefaults, "f"), "f");
        }
    }
}, _YTCRContext_onSystemLanguageChanged = function _YTCRContext_onSystemLanguageChanged() {
    __classPrivateFieldGet(this, _YTCRContext_instances, "m", _YTCRContext_loadI18n).call(this);
};
exports.default = new YTCRContext();
//# sourceMappingURL=YTCRContext.js.map