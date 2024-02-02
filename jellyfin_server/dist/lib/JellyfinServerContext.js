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
var _JellyfinServerContext_instances, _JellyfinServerContext_pluginContext, _JellyfinServerContext_i18n, _JellyfinServerContext_i18nDefaults, _JellyfinServerContext_i18CallbackRegistered, _JellyfinServerContext_loadI18n, _JellyfinServerContext_onSystemLanguageChanged;
Object.defineProperty(exports, "__esModule", { value: true });
const string_format_1 = __importDefault(require("string-format"));
const fs_extra_1 = __importDefault(require("fs-extra"));
class JellyfinServerContext {
    constructor() {
        _JellyfinServerContext_instances.add(this);
        _JellyfinServerContext_pluginContext.set(this, void 0);
        _JellyfinServerContext_i18n.set(this, void 0);
        _JellyfinServerContext_i18nDefaults.set(this, void 0);
        _JellyfinServerContext_i18CallbackRegistered.set(this, void 0);
        __classPrivateFieldSet(this, _JellyfinServerContext_i18n, {}, "f");
        __classPrivateFieldSet(this, _JellyfinServerContext_i18nDefaults, {}, "f");
        __classPrivateFieldSet(this, _JellyfinServerContext_i18CallbackRegistered, false, "f");
    }
    init(pluginContext) {
        __classPrivateFieldSet(this, _JellyfinServerContext_pluginContext, pluginContext, "f");
        __classPrivateFieldGet(this, _JellyfinServerContext_instances, "m", _JellyfinServerContext_loadI18n).call(this);
        if (!__classPrivateFieldGet(this, _JellyfinServerContext_i18CallbackRegistered, "f")) {
            __classPrivateFieldGet(this, _JellyfinServerContext_pluginContext, "f").coreCommand.sharedVars.registerCallback('language_code', __classPrivateFieldGet(this, _JellyfinServerContext_instances, "m", _JellyfinServerContext_onSystemLanguageChanged).bind(this));
            __classPrivateFieldSet(this, _JellyfinServerContext_i18CallbackRegistered, true, "f");
        }
    }
    toast(type, message, title = 'Jellyfin Server') {
        __classPrivateFieldGet(this, _JellyfinServerContext_pluginContext, "f").coreCommand.pushToastMessage(type, title, message);
    }
    getLogger() {
        return __classPrivateFieldGet(this, _JellyfinServerContext_pluginContext, "f").logger;
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
    reset() {
        __classPrivateFieldSet(this, _JellyfinServerContext_pluginContext, null, "f");
    }
    getI18n(key, ...formatValues) {
        let str;
        if (key.indexOf('.') > 0) {
            const mainKey = key.split('.')[0];
            const secKey = key.split('.')[1];
            str = __classPrivateFieldGet(this, _JellyfinServerContext_i18n, "f")[mainKey]?.[secKey] ||
                __classPrivateFieldGet(this, _JellyfinServerContext_i18nDefaults, "f")[mainKey]?.[secKey] ||
                key;
        }
        else {
            str = (__classPrivateFieldGet(this, _JellyfinServerContext_i18n, "f")[key] || __classPrivateFieldGet(this, _JellyfinServerContext_i18nDefaults, "f")[key] || key);
        }
        if (str && formatValues.length) {
            str = (0, string_format_1.default)(str, ...formatValues);
        }
        return str;
    }
    getDeviceInfo() {
        return __classPrivateFieldGet(this, _JellyfinServerContext_pluginContext, "f").coreCommand.executeOnPlugin('system_controller', 'volumiodiscovery', 'getThisDevice');
    }
    get volumioCoreCommand() {
        return __classPrivateFieldGet(this, _JellyfinServerContext_pluginContext, "f")?.coreCommand || null;
    }
}
_JellyfinServerContext_pluginContext = new WeakMap(), _JellyfinServerContext_i18n = new WeakMap(), _JellyfinServerContext_i18nDefaults = new WeakMap(), _JellyfinServerContext_i18CallbackRegistered = new WeakMap(), _JellyfinServerContext_instances = new WeakSet(), _JellyfinServerContext_loadI18n = function _JellyfinServerContext_loadI18n() {
    if (__classPrivateFieldGet(this, _JellyfinServerContext_pluginContext, "f")) {
        const i18nPath = `${__dirname}/../i18n`;
        try {
            __classPrivateFieldSet(this, _JellyfinServerContext_i18nDefaults, fs_extra_1.default.readJsonSync(`${i18nPath}/strings_en.json`), "f");
        }
        catch (e) {
            __classPrivateFieldSet(this, _JellyfinServerContext_i18nDefaults, {}, "f");
        }
        try {
            const language_code = __classPrivateFieldGet(this, _JellyfinServerContext_pluginContext, "f").coreCommand.sharedVars.get('language_code');
            __classPrivateFieldSet(this, _JellyfinServerContext_i18n, fs_extra_1.default.readJsonSync(`${i18nPath}/strings_${language_code}.json`), "f");
        }
        catch (e) {
            __classPrivateFieldSet(this, _JellyfinServerContext_i18n, __classPrivateFieldGet(this, _JellyfinServerContext_i18nDefaults, "f"), "f");
        }
    }
}, _JellyfinServerContext_onSystemLanguageChanged = function _JellyfinServerContext_onSystemLanguageChanged() {
    __classPrivateFieldGet(this, _JellyfinServerContext_instances, "m", _JellyfinServerContext_loadI18n).call(this);
};
exports.default = new JellyfinServerContext();
//# sourceMappingURL=JellyfinServerContext.js.map