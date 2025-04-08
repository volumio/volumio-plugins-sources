"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var _ControllerJellyfinServer_instances, _ControllerJellyfinServer_context, _ControllerJellyfinServer_commandRouter, _ControllerJellyfinServer_serverStatus, _ControllerJellyfinServer_doGetUIConfig;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const kew_1 = __importDefault(require("kew"));
const JellyfinServerContext_1 = __importDefault(require("./lib/JellyfinServerContext"));
const Util_1 = require("./lib/Util");
const System = __importStar(require("./lib/System"));
class ControllerJellyfinServer {
    constructor(context) {
        _ControllerJellyfinServer_instances.add(this);
        _ControllerJellyfinServer_context.set(this, void 0);
        _ControllerJellyfinServer_commandRouter.set(this, void 0);
        _ControllerJellyfinServer_serverStatus.set(this, void 0);
        __classPrivateFieldSet(this, _ControllerJellyfinServer_context, context, "f");
        __classPrivateFieldSet(this, _ControllerJellyfinServer_commandRouter, __classPrivateFieldGet(this, _ControllerJellyfinServer_context, "f").coreCommand, "f");
        __classPrivateFieldSet(this, _ControllerJellyfinServer_serverStatus, 'stopped', "f");
    }
    getUIConfig() {
        return (0, Util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerJellyfinServer_instances, "m", _ControllerJellyfinServer_doGetUIConfig).call(this))
            .fail((error) => {
            JellyfinServerContext_1.default.getLogger().error(`[jellyfin_server] getUIConfig(): Cannot populate configuration - ${error}`);
            throw error;
        });
    }
    onVolumioStart() {
        return kew_1.default.resolve(true);
    }
    onStart() {
        const defer = kew_1.default.defer();
        JellyfinServerContext_1.default.init(__classPrivateFieldGet(this, _ControllerJellyfinServer_context, "f"));
        JellyfinServerContext_1.default.toast('info', JellyfinServerContext_1.default.getI18n('JELLYFIN_SERVER_STARTING'));
        System.startService()
            .then(() => {
            JellyfinServerContext_1.default.toast('success', JellyfinServerContext_1.default.getI18n('JELLYFIN_SERVER_STARTED'));
            __classPrivateFieldSet(this, _ControllerJellyfinServer_serverStatus, 'started', "f");
            defer.resolve();
        })
            .catch((e) => {
            JellyfinServerContext_1.default.toast('error', JellyfinServerContext_1.default.getI18n('JELLYFIN_SERVER_ERR_START', JellyfinServerContext_1.default.getErrorMessage('', e, false)));
            defer.reject(e);
        });
        return defer.promise;
    }
    onStop() {
        if (__classPrivateFieldGet(this, _ControllerJellyfinServer_serverStatus, "f") === 'stopped') {
            return kew_1.default.resolve(true);
        }
        const defer = kew_1.default.defer();
        JellyfinServerContext_1.default.toast('info', JellyfinServerContext_1.default.getI18n('JELLYFIN_SERVER_STOPPING'));
        System.stopService()
            .then(() => {
            JellyfinServerContext_1.default.toast('success', JellyfinServerContext_1.default.getI18n('JELLYFIN_SERVER_STOPPED'));
            __classPrivateFieldSet(this, _ControllerJellyfinServer_serverStatus, 'stopped', "f");
            defer.resolve();
        })
            .catch((e) => {
            JellyfinServerContext_1.default.toast('error', JellyfinServerContext_1.default.getI18n('JELLYFIN_SERVER_ERR_STOP', JellyfinServerContext_1.default.getErrorMessage('', e, false)));
            // Do not reject, in case user is uninstalling a possibly broken installation - rejecting will abort the process.
            defer.resolve();
        });
        return defer.promise;
    }
}
_ControllerJellyfinServer_context = new WeakMap(), _ControllerJellyfinServer_commandRouter = new WeakMap(), _ControllerJellyfinServer_serverStatus = new WeakMap(), _ControllerJellyfinServer_instances = new WeakSet(), _ControllerJellyfinServer_doGetUIConfig = async function _ControllerJellyfinServer_doGetUIConfig() {
    const langCode = __classPrivateFieldGet(this, _ControllerJellyfinServer_commandRouter, "f").sharedVars.get('language_code');
    const uiconf = await (0, Util_1.kewToJSPromise)(__classPrivateFieldGet(this, _ControllerJellyfinServer_commandRouter, "f").i18nJson(`${__dirname}/i18n/strings_${langCode}.json`, `${__dirname}/i18n/strings_en.json`, `${__dirname}/UIConfig.json`));
    const status = await System.getServiceStatus();
    const config = await System.getConfig();
    const infoSectionConf = uiconf.sections[0];
    // Info section
    switch (status) {
        case 'active':
            infoSectionConf.description = JellyfinServerContext_1.default.getI18n('JELLYFIN_SERVER_INFO_DESC_ACTIVE');
            break;
        case 'activating':
            infoSectionConf.description = JellyfinServerContext_1.default.getI18n('JELLYFIN_SERVER_INFO_DESC_ACTIVATING');
            break;
        default:
            infoSectionConf.description = JellyfinServerContext_1.default.getI18n('JELLYFIN_SERVER_INFO_DESC_INACTIVE');
    }
    if (status !== 'active') {
        const viewReadme = infoSectionConf.content[2];
        infoSectionConf.content = [viewReadme];
    }
    else {
        const thisDevice = JellyfinServerContext_1.default.getDeviceInfo();
        const networkConfig = config?.NetworkConfiguration || {};
        const requireHttps = networkConfig.RequireHttps || false;
        const host = requireHttps ?
            `https://${thisDevice.host.substring(7)}` : thisDevice.host;
        const port = requireHttps ?
            (networkConfig.PublicHttpsPort || '8920')
            :
                (networkConfig.PublicPort || '8096');
        const url = `${host}:${port}`;
        infoSectionConf.content[0].value = url;
        infoSectionConf.content[1].onClick.url = url;
    }
    return uiconf;
};
module.exports = ControllerJellyfinServer;
//# sourceMappingURL=index.js.map