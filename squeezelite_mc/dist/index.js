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
var _ControllerSqueezeliteMC_instances, _ControllerSqueezeliteMC_serviceName, _ControllerSqueezeliteMC_context, _ControllerSqueezeliteMC_config, _ControllerSqueezeliteMC_commandRouter, _ControllerSqueezeliteMC_playerRunState, _ControllerSqueezeliteMC_playerStatusMonitor, _ControllerSqueezeliteMC_playbackTimer, _ControllerSqueezeliteMC_lastState, _ControllerSqueezeliteMC_volatileCallback, _ControllerSqueezeliteMC_volumioSetVolumeCallback, _ControllerSqueezeliteMC_commandDispatcher, _ControllerSqueezeliteMC_proxy, _ControllerSqueezeliteMC_playerFinder, _ControllerSqueezeliteMC_volumioVolume, _ControllerSqueezeliteMC_playerConfigChangeDelayTimer, _ControllerSqueezeliteMC_playerConfigChangeHandler, _ControllerSqueezeliteMC_playerStartupParams, _ControllerSqueezeliteMC_previousDoubleClickTimeout, _ControllerSqueezeliteMC_doGetUIConfig, _ControllerSqueezeliteMC_initAndStartPlayerFinder, _ControllerSqueezeliteMC_applyFadeOnPauseResume, _ControllerSqueezeliteMC_clearPlayerStatusMonitor, _ControllerSqueezeliteMC_clearPlayerFinder, _ControllerSqueezeliteMC_handlePlayerDisconnect, _ControllerSqueezeliteMC_handlePlayerDiscoveryError, _ControllerSqueezeliteMC_handlePlayerStatusUpdate, _ControllerSqueezeliteMC_pushState, _ControllerSqueezeliteMC_stopCurrentServiceAndSetVolatile, _ControllerSqueezeliteMC_pushEmptyState, _ControllerSqueezeliteMC_getCurrentService, _ControllerSqueezeliteMC_isCurrentService, _ControllerSqueezeliteMC_requestPlayerStatusUpdate, _ControllerSqueezeliteMC_getPlayerConfig, _ControllerSqueezeliteMC_getAlsaConfig, _ControllerSqueezeliteMC_getPlayerStartupParams, _ControllerSqueezeliteMC_getBestSupportedDSDFormat, _ControllerSqueezeliteMC_getVolumioVolume, _ControllerSqueezeliteMC_revalidatePlayerConfig, _ControllerSqueezeliteMC_handlePlayerConfigChange, _ControllerSqueezeliteMC_resolveOnStatusMode;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const kew_1 = __importDefault(require("kew"));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const v_conf_1 = __importDefault(require("v-conf"));
const os_1 = __importDefault(require("os"));
const SqueezeliteMCContext_1 = __importDefault(require("./lib/SqueezeliteMCContext"));
const Util_1 = require("./lib/Util");
const System_1 = require("./lib/System");
const PlayerStatusMonitor_1 = __importDefault(require("./lib/PlayerStatusMonitor"));
const lms_discovery_1 = __importDefault(require("lms-discovery"));
const CommandDispatcher_1 = __importDefault(require("./lib/CommandDispatcher"));
const Proxy_1 = __importStar(require("./lib/Proxy"));
const PlayerFinder_1 = __importStar(require("./lib/PlayerFinder"));
const fast_deep_equal_1 = __importDefault(require("fast-deep-equal"));
const Player_1 = require("./lib/types/Player");
const EMPTY_STATE = {
    status: 'stop',
    service: 'squeezelite_mc',
    title: undefined,
    artist: undefined,
    album: undefined,
    albumart: '/albumart',
    uri: '',
    trackType: undefined,
    seek: 0,
    duration: 0,
    samplerate: undefined,
    bitdepth: undefined,
    bitrate: undefined,
    channels: undefined
};
const LMS_TRACK_TYPE_TO_VOLUMIO = {
    'flc': 'flac',
    'alc': 'alac',
    'wvp': 'wv',
    'aif': 'aiff',
    'ops': 'opus'
};
const LMS_REPEAT_OFF = 0;
const LMS_REPEAT_CURRENT_SONG = 1;
const LMS_REPEAT_PLAYLIST = 2;
const LMS_SHUFFLE_OFF = 0;
const LMS_SHUFFLE_BY_SONG = 1;
const LMS_SHUFFLE_BY_ALBUM = 2;
const DSD_FORMATS = [
    'DSD_U8',
    'DSD_U16_LE',
    'DSD_U16_BE',
    'DSD_U32_LE',
    'DSD_U32_BE'
];
class ControllerSqueezeliteMC {
    constructor(context) {
        _ControllerSqueezeliteMC_instances.add(this);
        _ControllerSqueezeliteMC_serviceName.set(this, void 0);
        _ControllerSqueezeliteMC_context.set(this, void 0);
        _ControllerSqueezeliteMC_config.set(this, void 0);
        _ControllerSqueezeliteMC_commandRouter.set(this, void 0);
        _ControllerSqueezeliteMC_playerRunState.set(this, void 0);
        _ControllerSqueezeliteMC_playerStatusMonitor.set(this, void 0);
        _ControllerSqueezeliteMC_playbackTimer.set(this, void 0);
        _ControllerSqueezeliteMC_lastState.set(this, void 0);
        _ControllerSqueezeliteMC_volatileCallback.set(this, void 0);
        _ControllerSqueezeliteMC_volumioSetVolumeCallback.set(this, void 0);
        _ControllerSqueezeliteMC_commandDispatcher.set(this, void 0);
        _ControllerSqueezeliteMC_proxy.set(this, void 0);
        _ControllerSqueezeliteMC_playerFinder.set(this, void 0);
        _ControllerSqueezeliteMC_volumioVolume.set(this, void 0);
        _ControllerSqueezeliteMC_playerConfigChangeDelayTimer.set(this, void 0);
        _ControllerSqueezeliteMC_playerConfigChangeHandler.set(this, void 0);
        _ControllerSqueezeliteMC_playerStartupParams.set(this, void 0);
        _ControllerSqueezeliteMC_previousDoubleClickTimeout.set(this, void 0);
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_context, context, "f");
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_commandRouter, __classPrivateFieldGet(this, _ControllerSqueezeliteMC_context, "f").coreCommand, "f");
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_serviceName, 'squeezelite_mc', "f");
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerStatusMonitor, null, "f");
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playbackTimer, null, "f");
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_lastState, null, "f");
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_volatileCallback, null, "f");
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_volumioSetVolumeCallback, null, "f");
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_commandDispatcher, null, "f");
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerFinder, null, "f");
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerConfigChangeDelayTimer, null, "f");
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerConfigChangeHandler, null, "f");
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerStartupParams, null, "f");
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_previousDoubleClickTimeout, null, "f");
    }
    getUIConfig() {
        return (0, Util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_doGetUIConfig).call(this))
            .fail((error) => {
            SqueezeliteMCContext_1.default.getLogger().error(`[squeezelite_mc] getUIConfig(): Cannot populate configuration - ${error}`);
            throw error;
        });
    }
    getConfigurationFiles() {
        return ['config.json'];
    }
    /**
     * Plugin lifecycle
     */
    onVolumioStart() {
        const configFile = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").pluginManager.getConfigurationFile(__classPrivateFieldGet(this, _ControllerSqueezeliteMC_context, "f"), 'config.json');
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_config, new v_conf_1.default(), "f");
        __classPrivateFieldGet(this, _ControllerSqueezeliteMC_config, "f").loadFile(configFile);
        return kew_1.default.resolve(true);
    }
    onStart() {
        const defer = kew_1.default.defer();
        SqueezeliteMCContext_1.default.init(__classPrivateFieldGet(this, _ControllerSqueezeliteMC_context, "f"), __classPrivateFieldGet(this, _ControllerSqueezeliteMC_config, "f"));
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_lastState, null, "f");
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playbackTimer, new Util_1.PlaybackTimer(), "f");
        // Listen for volume change in Volumio
        if (!__classPrivateFieldGet(this, _ControllerSqueezeliteMC_volumioSetVolumeCallback, "f")) {
            __classPrivateFieldSet(this, _ControllerSqueezeliteMC_volumioSetVolumeCallback, (volume) => {
                __classPrivateFieldSet(this, _ControllerSqueezeliteMC_volumioVolume, volume.vol, "f");
                if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playbackTimer, "f") && __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f")) {
                    /**
                     * Volumioupdatevolume() triggers #pushState() in statemachine after calling
                     * this callback - but volatile state with old 'seek' value (from last push) will be used.
                     * this is undesirable if current status is 'play', so we update the statemachine's volatile state
                     * with seek value obtained from our internal playbackTimer.
                     */
                    SqueezeliteMCContext_1.default.getLogger().info(`[squeezelite_mc] Setting Squeezelite volume to ${volume.vol}`);
                    if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_lastState, "f") && __classPrivateFieldGet(this, _ControllerSqueezeliteMC_lastState, "f").status === 'play' && __classPrivateFieldGet(this, _ControllerSqueezeliteMC_lastState, "f").seek !== undefined) {
                        __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_pushState).call(this, { ...__classPrivateFieldGet(this, _ControllerSqueezeliteMC_lastState, "f"), seek: __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playbackTimer, "f").getSeek() });
                    }
                    __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f").sendVolume(__classPrivateFieldGet(this, _ControllerSqueezeliteMC_volumioVolume, "f"));
                }
            }, "f");
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").addCallback('volumioupdatevolume', __classPrivateFieldGet(this, _ControllerSqueezeliteMC_volumioSetVolumeCallback, "f"));
        }
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_proxy, new Proxy_1.default(SqueezeliteMCContext_1.default.getConfigValue('serverCredentials')), "f");
        __classPrivateFieldGet(this, _ControllerSqueezeliteMC_proxy, "f").start()
            .catch(() => {
            SqueezeliteMCContext_1.default.getLogger().warn('[squeezelite_mc] Unable to start proxy server - requests for artwork on password-protected servers will be denied');
        })
            .then(() => __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_getVolumioVolume).call(this))
            .then((volume) => {
            __classPrivateFieldSet(this, _ControllerSqueezeliteMC_volumioVolume, volume, "f");
            return __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_initAndStartPlayerFinder).call(this);
        })
            .then(() => {
            __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerConfigChangeHandler, __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_handlePlayerConfigChange).bind(this), "f");
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").sharedVars.registerCallback('alsa.outputdevice', __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerConfigChangeHandler, "f"));
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").sharedVars.registerCallback('alsa.outputdevicemixer', __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerConfigChangeHandler, "f"));
            SqueezeliteMCContext_1.default.getMpdPlugin().config.registerCallback('dop', __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerConfigChangeHandler, "f"));
        })
            .then(() => __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_getPlayerStartupParams).call(this))
            .then((config) => {
            __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerStartupParams, config, "f");
            SqueezeliteMCContext_1.default.getLogger().info(`[squeezelite_mc] Starting Squeezelite service with params: ${JSON.stringify(__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStartupParams, "f"))}`);
            SqueezeliteMCContext_1.default.toast('info', SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_STARTING'));
            return (0, System_1.initSqueezeliteService)(config);
        })
            .then(() => {
            SqueezeliteMCContext_1.default.toast('success', SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_STARTED'));
            __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerRunState, Player_1.PlayerRunState.Normal, "f");
            defer.resolve();
        })
            .catch((error) => {
            __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerRunState, Player_1.PlayerRunState.StartError, "f");
            if (error instanceof System_1.SystemError && error.code === System_1.SystemErrorCode.DeviceBusy) {
                SqueezeliteMCContext_1.default.toast('error', SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_ERR_START_DEV_BUSY'));
                defer.resolve();
            }
            else {
                SqueezeliteMCContext_1.default.toast('error', SqueezeliteMCContext_1.default.getErrorMessage(SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_ERR_START'), error, false));
                defer.reject(error);
            }
        });
        return defer.promise;
    }
    onStop() {
        const defer = kew_1.default.defer();
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerStartupParams, null, "f");
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_commandDispatcher, null, "f");
        if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playbackTimer, "f")) {
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playbackTimer, "f").stop();
        }
        // Hack to remove volume change listener
        const callbacks = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").callbacks['volumioupdatevolume'];
        if (callbacks && Array.isArray(callbacks)) {
            const cbIndex = callbacks.indexOf(__classPrivateFieldGet(this, _ControllerSqueezeliteMC_volumioSetVolumeCallback, "f"));
            if (cbIndex >= 0) {
                callbacks.splice(cbIndex, 1);
            }
        }
        // Hack to remove player config change handler
        if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerConfigChangeHandler, "f")) {
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").sharedVars.callbacks.delete('alsa.outputdevice', __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerConfigChangeHandler, "f"));
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").sharedVars.callbacks.delete('alsa.outputdevicemixer', __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerConfigChangeHandler, "f"));
            SqueezeliteMCContext_1.default.getMpdPlugin().config.callbacks.delete('dop', __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerConfigChangeHandler, "f"));
            __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerConfigChangeHandler, null, "f");
        }
        if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_proxy, "f") && __classPrivateFieldGet(this, _ControllerSqueezeliteMC_proxy, "f").getStatus() !== Proxy_1.ProxyStatus.Stopped) {
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_proxy, "f").stop();
        }
        const promises = [
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_clearPlayerStatusMonitor).call(this),
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_clearPlayerFinder).call(this),
            (0, System_1.stopSqueezeliteService)()
        ];
        SqueezeliteMCContext_1.default.toast('info', SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_STOPPING'));
        Promise.all(promises).then(() => {
            SqueezeliteMCContext_1.default.toast('success', SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_STOPPED'));
            SqueezeliteMCContext_1.default.reset();
            defer.resolve();
        })
            .catch((error) => {
            SqueezeliteMCContext_1.default.toast('error', SqueezeliteMCContext_1.default.getErrorMessage(SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_ERR_STOP'), error, false));
            defer.reject(error);
        });
        return defer.promise;
    }
    unsetVolatile() {
        SqueezeliteMCContext_1.default.getStateMachine().unSetVolatile();
    }
    // Callback that gets called by statemachine when unsetting volatile state
    onUnsetVolatile() {
        __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_pushEmptyState).call(this);
        SqueezeliteMCContext_1.default.getMpdPlugin().ignoreUpdate(false);
        /**
         * There is no graceful handling of switching from one music service plugin to another
         * in Volumio. Statemachine calls volatile callbacks in unsetVolatile(), but does not
         * wait for them to complete. That means there is no chance to actually clean things up before
         * moving to another music service.
         * When we call stop() here, we should ideally be able to return a promise that resolves when
         * the output device is closed by Squeezelite, with statemachine then proceeding to the next
         * music service. But since there is no such mechanism, and if Squeezelite is in the middle of playing
         * something, then you will most likely get an "Alsa device busy" error when the next music service
         * tries to access the output device.
         * No solution I can think of, or am I doing this the wrong way?
         */
        this.stop();
    }
    /**
     * Config functions
     */
    configStartSqueezelite(data) {
        __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_revalidatePlayerConfig).call(this, data);
    }
    configSaveServerCredentials(data = {}) {
        const credentials = {};
        for (const [fieldName, value] of Object.entries(data)) {
            let fieldType, serverName;
            if (fieldName.endsWith('_username')) {
                fieldType = 'username';
                serverName = fieldName.substring(0, fieldName.length - 9);
            }
            else if (fieldName.endsWith('_password')) {
                fieldType = 'password';
                serverName = fieldName.substring(0, fieldName.length - 9);
            }
            if (fieldType && serverName) {
                if (!credentials[serverName]) {
                    credentials[serverName] = {
                        username: '',
                        password: ''
                    };
                }
                if (fieldType === 'username') {
                    credentials[serverName].username = value.trim();
                }
                else if (fieldType === 'password') {
                    credentials[serverName].password = value.trim();
                }
            }
        }
        Object.keys(credentials).forEach((serverName) => {
            if (credentials[serverName].username === '') {
                delete credentials[serverName];
            }
        });
        const oldCredentials = SqueezeliteMCContext_1.default.getConfigValue('serverCredentials');
        SqueezeliteMCContext_1.default.setConfigValue('serverCredentials', credentials);
        if ((0, fast_deep_equal_1.default)(credentials, oldCredentials)) {
            SqueezeliteMCContext_1.default.toast('success', SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_SETTINGS_SAVED'));
        }
        else {
            // Restart components that rely on serverCredentials
            SqueezeliteMCContext_1.default.toast('success', SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_APPLY_CONFIG_CHANGE'));
            SqueezeliteMCContext_1.default.refreshUIConfig().then(() => {
                if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_proxy, "f")) {
                    __classPrivateFieldGet(this, _ControllerSqueezeliteMC_proxy, "f").setServerCredentials(credentials);
                }
                __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_clearPlayerStatusMonitor).call(this)
                    .then(() => __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_clearPlayerFinder).call(this))
                    .then(() => __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_initAndStartPlayerFinder).call(this));
            });
        }
    }
    configSwitchToBasicSqueezeliteSettings() {
        SqueezeliteMCContext_1.default.setConfigValue('playerConfigType', 'basic');
        __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_revalidatePlayerConfig).call(this, { force: true });
    }
    configSwitchToManualSqueezeliteSettings() {
        SqueezeliteMCContext_1.default.setConfigValue('playerConfigType', 'manual');
        __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_revalidatePlayerConfig).call(this, { force: true });
    }
    async configSaveBasicSqueezeliteSettings(data) {
        const playerNameType = data.playerNameType.value;
        const playerName = data.playerName.trim();
        const dsdPlayback = data.dsdPlayback.value;
        if (playerNameType === 'custom' && playerName === '') {
            SqueezeliteMCContext_1.default.toast('error', SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_ERR_PLAYER_NAME'));
            return;
        }
        const oldConfig = SqueezeliteMCContext_1.default.getConfigValue('basicPlayerConfig');
        const revalidate = oldConfig.playerNameType !== playerNameType ||
            oldConfig.playerName !== playerName ||
            oldConfig.dsdPlayback !== dsdPlayback;
        const newConfig = {
            type: 'basic',
            playerNameType,
            playerName,
            dsdPlayback,
            fadeOnPauseResume: data.fadeOnPauseResume
        };
        SqueezeliteMCContext_1.default.setConfigValue('basicPlayerConfig', newConfig);
        await __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_applyFadeOnPauseResume).call(this);
        if (!revalidate) {
            SqueezeliteMCContext_1.default.toast('success', SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_SETTINGS_SAVED'));
        }
        else {
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_revalidatePlayerConfig).call(this);
        }
    }
    async configSaveManualSqueezeliteSettings(data) {
        const startupOptions = data.startupOptions.trim();
        const { startupOptions: oldStartupOptions } = SqueezeliteMCContext_1.default.getConfigValue('manualPlayerConfig');
        const newConfig = {
            type: 'manual',
            fadeOnPauseResume: data.fadeOnPauseResume,
            startupOptions
        };
        SqueezeliteMCContext_1.default.setConfigValue('manualPlayerConfig', newConfig);
        await __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_applyFadeOnPauseResume).call(this);
        if (startupOptions === oldStartupOptions) {
            SqueezeliteMCContext_1.default.toast('success', SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_SETTINGS_SAVED'));
        }
        else {
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_revalidatePlayerConfig).call(this);
        }
    }
    /**
     * Volumio playback control functions
     */
    stop() {
        if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f")) {
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f").sendStop();
            return __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_resolveOnStatusMode).call(this, 'stop');
        }
        return kew_1.default.resolve(true);
    }
    play() {
        if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f")) {
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f").sendPlay();
            return __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_resolveOnStatusMode).call(this, 'play');
        }
        return kew_1.default.resolve(true);
    }
    pause() {
        if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f")) {
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f").sendPause();
            return __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_resolveOnStatusMode).call(this, 'pause');
        }
        return kew_1.default.resolve(true);
    }
    resume() {
        if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f")) {
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f").sendPlay();
            return __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_resolveOnStatusMode).call(this, 'play');
        }
        return kew_1.default.resolve(true);
    }
    seek(position) {
        if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f")) {
            return (0, Util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f").sendSeek(position));
        }
        return kew_1.default.resolve(true);
    }
    next() {
        if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f")) {
            return (0, Util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f").sendNext());
        }
        return kew_1.default.resolve(true);
    }
    previous() {
        if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f")) {
            if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_previousDoubleClickTimeout, "f")) {
                __classPrivateFieldSet(this, _ControllerSqueezeliteMC_previousDoubleClickTimeout, null, "f");
                return (0, Util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f").sendPrevious());
            }
            __classPrivateFieldSet(this, _ControllerSqueezeliteMC_previousDoubleClickTimeout, setTimeout(() => {
                __classPrivateFieldSet(this, _ControllerSqueezeliteMC_previousDoubleClickTimeout, null, "f");
            }, 3000), "f");
            return this.seek(0);
        }
        return kew_1.default.resolve(true);
    }
    repeat(value, repeatSingle) {
        if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f")) {
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f").sendRepeat(value ? (repeatSingle ? LMS_REPEAT_CURRENT_SONG : LMS_REPEAT_PLAYLIST) : LMS_REPEAT_OFF);
        }
        return kew_1.default.resolve(true);
    }
    random(value) {
        if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f")) {
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f").sendShuffle(value ? LMS_SHUFFLE_BY_SONG : LMS_SHUFFLE_OFF);
        }
        return kew_1.default.resolve(true);
    }
}
_ControllerSqueezeliteMC_serviceName = new WeakMap(), _ControllerSqueezeliteMC_context = new WeakMap(), _ControllerSqueezeliteMC_config = new WeakMap(), _ControllerSqueezeliteMC_commandRouter = new WeakMap(), _ControllerSqueezeliteMC_playerRunState = new WeakMap(), _ControllerSqueezeliteMC_playerStatusMonitor = new WeakMap(), _ControllerSqueezeliteMC_playbackTimer = new WeakMap(), _ControllerSqueezeliteMC_lastState = new WeakMap(), _ControllerSqueezeliteMC_volatileCallback = new WeakMap(), _ControllerSqueezeliteMC_volumioSetVolumeCallback = new WeakMap(), _ControllerSqueezeliteMC_commandDispatcher = new WeakMap(), _ControllerSqueezeliteMC_proxy = new WeakMap(), _ControllerSqueezeliteMC_playerFinder = new WeakMap(), _ControllerSqueezeliteMC_volumioVolume = new WeakMap(), _ControllerSqueezeliteMC_playerConfigChangeDelayTimer = new WeakMap(), _ControllerSqueezeliteMC_playerConfigChangeHandler = new WeakMap(), _ControllerSqueezeliteMC_playerStartupParams = new WeakMap(), _ControllerSqueezeliteMC_previousDoubleClickTimeout = new WeakMap(), _ControllerSqueezeliteMC_instances = new WeakSet(), _ControllerSqueezeliteMC_doGetUIConfig = async function _ControllerSqueezeliteMC_doGetUIConfig() {
    const langCode = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").sharedVars.get('language_code');
    const uiconf = await (0, Util_1.kewToJSPromise)(__classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").i18nJson(`${__dirname}/i18n/strings_${langCode}.json`, `${__dirname}/i18n/strings_en.json`, `${__dirname}/UIConfig.json`));
    const status = await (0, System_1.getSqueezeliteServiceStatus)();
    const statusUIConf = uiconf.sections[0];
    const squeezeliteBasicUIConf = uiconf.sections[1];
    const squeezeliteManualUIConf = uiconf.sections[2];
    const serverCredentialsUIConf = uiconf.sections[3];
    const playerConfig = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_getPlayerConfig).call(this);
    if (playerConfig.type === 'basic') {
        uiconf.sections.splice(2, 1);
    }
    else { // `manual` playerConfigType
        uiconf.sections.splice(1, 1);
    }
    /**
     * Status conf
     */
    let statusDesc, statusButtonType;
    if (status === 'active' && __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerRunState, "f") !== Player_1.PlayerRunState.ConfigRequireRestart) {
        const player = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStatusMonitor, "f") ? __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStatusMonitor, "f").getPlayer() : null;
        statusDesc = player ?
            SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_DESC_STATUS_CONNECTED', player.server.name, player.server.ip) :
            SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_DESC_STATUS_STARTED');
    }
    else if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerRunState, "f") === Player_1.PlayerRunState.StartError) {
        statusDesc = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_DESC_STATUS_ERR_START');
        statusButtonType = 'start';
    }
    else if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerRunState, "f") === Player_1.PlayerRunState.ConfigRequireRestart) {
        statusDesc = (status === 'active') ?
            SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_DESC_STATUS_ERR_RESTART_CONFIG') :
            SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_DESC_STATUS_ERR_START');
        statusButtonType = (status === 'active') ? 'restart' : 'start';
    }
    else if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerRunState, "f") === Player_1.PlayerRunState.ConfigRequireRevalidate) {
        statusDesc = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_DESC_STATUS_ERR_REVALIDATE');
        statusButtonType = 'revalidate';
    }
    else {
        statusDesc = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_DESC_STATUS_STOPPED');
        statusButtonType = 'start';
    }
    let statusButton = {
        'id': 'startSqueezelite',
        'element': 'button',
        'onClick': {
            'type': 'emit',
            'message': 'callMethod',
            'data': {
                'endpoint': 'music_service/squeezelite_mc',
                'method': 'configStartSqueezelite',
                'data': {
                    force: true
                }
            }
        }
    };
    switch (statusButtonType) {
        case 'start':
            statusButton.label = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_BTN_START');
            break;
        case 'restart':
            statusButton.label = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_BTN_RESTART');
            break;
        case 'revalidate':
            statusButton.label = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_BTN_REVALIDATE');
            break;
        default:
            statusButton = null;
    }
    statusUIConf.description = statusDesc;
    if (statusButton) {
        statusUIConf.content = [statusButton];
    }
    /**
     * Squeezelite conf
     */
    if (playerConfig.type === 'basic') {
        const { playerNameType, playerName, dsdPlayback, fadeOnPauseResume } = playerConfig;
        // Player name
        squeezeliteBasicUIConf.content[1].value = {
            value: playerNameType
        };
        switch (playerNameType) {
            case 'custom':
                squeezeliteBasicUIConf.content[1].value.label = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_PLAYER_NAME_CUSTOM');
                break;
            default: // 'hostname'
                squeezeliteBasicUIConf.content[1].value.label = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_PLAYER_NAME_HOSTNAME');
        }
        squeezeliteBasicUIConf.content[2].value = playerName;
        // DSD playback
        squeezeliteBasicUIConf.content[3].value = {
            value: dsdPlayback
        };
        switch (dsdPlayback) {
            case 'pcm':
                squeezeliteBasicUIConf.content[3].value.label = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_PCM');
                break;
            case 'dop':
                squeezeliteBasicUIConf.content[3].value.label = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_DOP');
                break;
            case 'DSD_U8':
                squeezeliteBasicUIConf.content[3].value.label = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_U8');
                break;
            case 'DSD_U16_LE':
                squeezeliteBasicUIConf.content[3].value.label = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_U16_LE');
                break;
            case 'DSD_U16_BE':
                squeezeliteBasicUIConf.content[3].value.label = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_U16_BE');
                break;
            case 'DSD_U32_LE':
                squeezeliteBasicUIConf.content[3].value.label = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_U32_LE');
                break;
            case 'DSD_U32_BE':
                squeezeliteBasicUIConf.content[3].value.label = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_U32_BE');
                break;
            default: // 'auto'
                squeezeliteBasicUIConf.content[3].value.label = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_AUTO');
        }
        // Fade on pause / resume
        squeezeliteBasicUIConf.content[4].value = fadeOnPauseResume;
    }
    else { // 'manual' playerConfigType
        squeezeliteManualUIConf.content[1].value = playerConfig.fadeOnPauseResume;
        squeezeliteManualUIConf.content[2].value = playerConfig.startupOptions;
        // Get suggested startup options
        let suggestedStartupOptions;
        try {
            const defaultStartupParams = await __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_getPlayerStartupParams).call(this, true);
            suggestedStartupOptions = (0, Util_1.basicPlayerStartupParamsToSqueezeliteOpts)(defaultStartupParams);
        }
        catch (error) {
            if (error instanceof System_1.SystemError && error.code === System_1.SystemErrorCode.DeviceBusy) {
                squeezeliteManualUIConf.description = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_ERR_SUGGESTED_STARTUP_OPTS_DEV_BUSY');
            }
            else {
                squeezeliteManualUIConf.description = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_ERR_SUGGESTED_STARTUP_OPTS');
            }
        }
        squeezeliteManualUIConf.content[3].value = suggestedStartupOptions;
        // Apply suggested button payload
        squeezeliteManualUIConf.content[4].onClick.data.data = {
            startupOptions: suggestedStartupOptions
        };
    }
    /**
     * Server Credentials conf
     */
    const serverCredentials = SqueezeliteMCContext_1.default.getConfigValue('serverCredentials');
    const discoveredServers = lms_discovery_1.default.getAllDiscovered();
    discoveredServers.sort((s1, s2) => s1.name.localeCompare(s2.name));
    // Server field
    const serversSelectData = discoveredServers.map((server) => {
        const label = `${server.name} (${server.ip})`;
        return {
            value: server.name,
            label: serverCredentials[server.name] ? `${label} (*)` : label
        };
    });
    // Add servers with assigned credentials but not currently discovered
    Object.keys(serverCredentials).forEach((serverName) => {
        const discovered = discoveredServers.find((server) => server.name === serverName);
        if (!discovered) {
            serversSelectData.push({
                value: serverName,
                label: `${serverName} (*)(x)`
            });
        }
    });
    serverCredentialsUIConf.content[0].options = serversSelectData;
    if (serversSelectData.length > 0) {
        serverCredentialsUIConf.content[0].value = serversSelectData[0] || null;
        // Username and password fields
        serversSelectData.map((select) => select.value).forEach((serverName) => {
            const { username = '', password = '' } = serverCredentials[serverName] || {};
            const usernameField = {
                id: `${serverName}_username`,
                type: 'text',
                element: 'input',
                label: SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_USERNAME'),
                value: username,
                visibleIf: {
                    field: 'server',
                    value: serverName
                }
            };
            const passwordField = {
                id: `${serverName}_password`,
                type: 'password',
                element: 'input',
                label: SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_PASSWORD'),
                value: password,
                visibleIf: {
                    field: 'server',
                    value: serverName
                }
            };
            serverCredentialsUIConf.content.push(usernameField, passwordField);
            serverCredentialsUIConf.saveButton.data.push(usernameField.id, passwordField.id);
        });
    }
    else {
        serverCredentialsUIConf.description = SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_NO_SERVERS');
        delete serverCredentialsUIConf.content[0];
        delete serverCredentialsUIConf.saveButton;
    }
    return uiconf;
}, _ControllerSqueezeliteMC_initAndStartPlayerFinder = 
/**
 * Workflow logic
 */
async function _ControllerSqueezeliteMC_initAndStartPlayerFinder() {
    if (!__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerFinder, "f")) {
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerFinder, new PlayerFinder_1.default(), "f");
        __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerFinder, "f").on('found', async (data) => {
            const serverCredentials = SqueezeliteMCContext_1.default.getConfigValue('serverCredentials');
            const player = data[0];
            SqueezeliteMCContext_1.default.getLogger().info(`[squeezelite_mc] Player found: ${JSON.stringify(player)}`);
            __classPrivateFieldSet(this, _ControllerSqueezeliteMC_commandDispatcher, new CommandDispatcher_1.default(player, serverCredentials), "f");
            // Set Squeezelite's volume to Volumio's
            if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_volumioVolume, "f") !== undefined) {
                await __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f").sendVolume(__classPrivateFieldGet(this, _ControllerSqueezeliteMC_volumioVolume, "f"));
            }
            await __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_applyFadeOnPauseResume).call(this);
            await __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_clearPlayerStatusMonitor).call(this); // Ensure there is only one monitor instance
            const playerStatusMonitor = new PlayerStatusMonitor_1.default(player, serverCredentials);
            __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerStatusMonitor, playerStatusMonitor, "f");
            playerStatusMonitor.on('update', __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_handlePlayerStatusUpdate).bind(this));
            playerStatusMonitor.on('disconnect', __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_handlePlayerDisconnect).bind(this));
            await playerStatusMonitor.start();
            SqueezeliteMCContext_1.default.toast('info', SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_CONNECTED', player.server.name, player.server.ip));
        });
        __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerFinder, "f").on('lost', __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_handlePlayerDisconnect).bind(this));
        __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerFinder, "f").on('error', __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_handlePlayerDiscoveryError).bind(this));
    }
    if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerFinder, "f").getStatus() === PlayerFinder_1.PlayerFinderStatus.Stopped) {
        const networkAddresses = Object.values((0, Util_1.getNetworkInterfaces)());
        const ipAddresses = [];
        const macAddresses = [];
        for (const addresses of networkAddresses) {
            for (const data of addresses) {
                if (data.address && !ipAddresses.includes(data.address)) {
                    ipAddresses.push(data.address);
                }
                if (data.mac && !macAddresses.includes(data.mac)) {
                    macAddresses.push(data.mac);
                }
            }
        }
        return __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerFinder, "f").start({
            serverCredentials: SqueezeliteMCContext_1.default.getConfigValue('serverCredentials'),
            eventFilter: {
                playerIP: ipAddresses,
                playerId: macAddresses
            }
        });
    }
}, _ControllerSqueezeliteMC_applyFadeOnPauseResume = function _ControllerSqueezeliteMC_applyFadeOnPauseResume() {
    const { fadeOnPauseResume } = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_getPlayerConfig).call(this);
    if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f") && fadeOnPauseResume) {
        /**
         * Set LMS Player Settings -> Audio -> Volume Control to 'Output level is fixed at 100%'.
         * This is to avoid Squeezelite from zero-ing out the volume on pause, which obviously
         * causes problems with native DSD playback. Also, after Squeezelite mutes the volume on pause,
         * playing from another Volumio source will not restore the volume to its previous level (i.e.
         * it stays muted).
         */
        return __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandDispatcher, "f").sendPref('digitalVolumeControl', 0);
    }
}, _ControllerSqueezeliteMC_clearPlayerStatusMonitor = async function _ControllerSqueezeliteMC_clearPlayerStatusMonitor() {
    if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStatusMonitor, "f")) {
        await __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStatusMonitor, "f").stop();
        __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStatusMonitor, "f").removeAllListeners();
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerStatusMonitor, null, "f");
    }
}, _ControllerSqueezeliteMC_clearPlayerFinder = async function _ControllerSqueezeliteMC_clearPlayerFinder() {
    if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerFinder, "f")) {
        await __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerFinder, "f").stop();
        __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerFinder, "f").removeAllListeners();
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerFinder, null, "f");
    }
}, _ControllerSqueezeliteMC_handlePlayerDisconnect = async function _ControllerSqueezeliteMC_handlePlayerDisconnect() {
    if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStatusMonitor, "f")) {
        const player = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStatusMonitor, "f").getPlayer();
        SqueezeliteMCContext_1.default.toast('info', SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_DISCONNECTED', player.server.name, player.server.ip));
    }
    await __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_clearPlayerStatusMonitor).call(this);
    __classPrivateFieldSet(this, _ControllerSqueezeliteMC_commandDispatcher, null, "f");
    __classPrivateFieldSet(this, _ControllerSqueezeliteMC_lastState, null, "f");
    if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playbackTimer, "f")) {
        __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playbackTimer, "f").stop();
    }
    if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_isCurrentService).call(this)) {
        this.unsetVolatile();
    }
}, _ControllerSqueezeliteMC_handlePlayerDiscoveryError = function _ControllerSqueezeliteMC_handlePlayerDiscoveryError(message) {
    SqueezeliteMCContext_1.default.toast('error', SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_ERR_PLAYER_DISCOVER', message));
}, _ControllerSqueezeliteMC_handlePlayerStatusUpdate = async function _ControllerSqueezeliteMC_handlePlayerStatusUpdate(data) {
    const { player, status } = data;
    const isCurrentService = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_isCurrentService).call(this);
    if (!status.currentTrack) {
        if (isCurrentService) {
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_pushEmptyState).call(this);
        }
        return;
    }
    const track = status.currentTrack;
    const albumartUrl = (() => {
        let url = null;
        let useProxy = false;
        if (track.artworkUrl) {
            if (track.artworkUrl.startsWith('/imageproxy')) {
                url = `http://${player.server.ip}:${player.server.jsonPort}${track.artworkUrl}`;
                useProxy = true;
            }
            else {
                url = track.artworkUrl;
            }
        }
        else if (track.coverArt) {
            url = `http://${player.server.ip}:${player.server.jsonPort}/music/current/cover.jpg?player=${encodeURIComponent(player.id)}&ms=${Date.now()}`;
            useProxy = true;
        }
        if (!url) {
            return '/albumart';
        }
        let proxyIP = null;
        if (useProxy && __classPrivateFieldGet(this, _ControllerSqueezeliteMC_proxy, "f")?.getStatus() === Proxy_1.ProxyStatus.Started) {
            const volumioIPs = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").getCachedPAddresses ? __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").getCachedPAddresses() : __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").getCachedIPAddresses();
            if (volumioIPs) {
                if (volumioIPs.eth0) {
                    proxyIP = volumioIPs.eth0;
                }
                else if (volumioIPs.wlan0 && volumioIPs.wlan0 !== '192.168.211.1') {
                    proxyIP = volumioIPs.wlan0;
                }
            }
        }
        if (!proxyIP) {
            return url;
        }
        const proxyPort = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_proxy, "f")?.getAddress()?.port;
        const proxyAddr = proxyPort ? `${proxyIP}:${proxyPort}` : proxyIP;
        const qs = new URLSearchParams({
            server_name: player.server.name,
            url,
            fallback: `http://${proxyIP}/albumart`
        });
        return `http://${proxyAddr}/?${qs.toString()}`;
    })();
    const isStreaming = track.duration === 0 || !status.canSeek;
    const volumioState = {
        status: status.mode,
        service: 'squeezelite_mc',
        title: track.title,
        artist: track.artist || track.trackArtist || track.albumArtist,
        album: track.album || track.remoteTitle,
        albumart: albumartUrl,
        uri: '',
        trackType: track.type ? LMS_TRACK_TYPE_TO_VOLUMIO[track.type] || track.type : undefined,
        seek: !isStreaming && status.time !== undefined ? Math.ceil(status.time * 1000) : undefined,
        duration: track.duration ? Math.ceil(track.duration) : undefined,
        samplerate: track.sampleRate ? `${track.sampleRate / 1000} kHz` : undefined,
        bitdepth: track.sampleSize ? `${track.sampleSize} bit` : undefined,
        channels: undefined,
        isStreaming,
        volume: status.volume
    };
    // Volatile state does not support the 'bitrate' field!
    // If samplerate or bitdepth is not available, set bitrate as samplerate.
    if ((!volumioState.samplerate || !volumioState.bitdepth) && track.bitrate) {
        volumioState.samplerate = track.bitrate;
        volumioState.bitdepth = undefined;
    }
    switch (status.repeatMode) {
        case LMS_REPEAT_PLAYLIST:
            volumioState.repeat = true;
            volumioState.repeatSingle = false;
            break;
        case LMS_REPEAT_CURRENT_SONG:
            volumioState.repeat = true;
            volumioState.repeatSingle = true;
            break;
        default: // LMS_REPEAT_OFF
            volumioState.repeat = false;
            volumioState.repeatSingle = false;
    }
    switch (status.shuffleMode) {
        case LMS_SHUFFLE_BY_SONG:
        case LMS_SHUFFLE_BY_ALBUM:
            volumioState.random = true;
            break;
        default: // LMS_SHUFFLE_OFF
            volumioState.random = false;
    }
    // Sometimes, the artwork_url stays unchanged on new song (perhaps not yet loaded?),
    // So we request another status update after a short timeout period.
    if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_lastState, "f")) {
        const isNewSong = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_lastState, "f").title !== volumioState.title;
        if (isNewSong && track.artworkUrl) {
            setTimeout(() => {
                __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_requestPlayerStatusUpdate).call(this);
            }, 3000);
        }
    }
    __classPrivateFieldSet(this, _ControllerSqueezeliteMC_lastState, volumioState, "f");
    if (!isCurrentService && volumioState.status === 'play') {
        SqueezeliteMCContext_1.default.getLogger().info('[squeezelite_mc] \'play\' status received while not being the current service.');
        await __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_stopCurrentServiceAndSetVolatile).call(this);
        __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_pushState).call(this, volumioState);
        // Squeezelite might not be able to start playing immediately, such as when
        // The previous service has not yet released the audio output device. So we request another
        // Status update after a short while - hopefully Squeezelite will be playing by then.
        setTimeout(() => {
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_requestPlayerStatusUpdate).call(this);
        }, 3000);
    }
    else if (isCurrentService) {
        if (volumioState.status === 'stop') {
            /**
             * Statemachine does weird things when the volatile status is 'stop'. The result is that
             * the state appears as if the track is still playing.
             * We just push empty state here and hope for the best. At least with what we do
             * in #pushEmptyState(), playback will appear to have stopped.
             */
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_pushEmptyState).call(this);
        }
        else {
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_pushState).call(this, volumioState);
            if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playbackTimer, "f")) {
                // Start or stop internal playbackTimer
                if (!volumioState.isStreaming && volumioState.status === 'play') {
                    __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playbackTimer, "f").start(volumioState.seek);
                }
                else {
                    __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playbackTimer, "f").stop();
                }
            }
        }
    }
    // Set Volumio's volume to Squeezelite's
    if (isCurrentService && __classPrivateFieldGet(this, _ControllerSqueezeliteMC_volumioVolume, "f") !== volumioState.volume) {
        __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").volumiosetvolume(volumioState.volume);
    }
}, _ControllerSqueezeliteMC_pushState = function _ControllerSqueezeliteMC_pushState(state) {
    SqueezeliteMCContext_1.default.getLogger().info(`[squeezelite_mc] #pushState(): ${JSON.stringify(state)}`);
    __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").servicePushState(state, __classPrivateFieldGet(this, _ControllerSqueezeliteMC_serviceName, "f"));
}, _ControllerSqueezeliteMC_stopCurrentServiceAndSetVolatile = async function _ControllerSqueezeliteMC_stopCurrentServiceAndSetVolatile() {
    if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_isCurrentService).call(this)) {
        return;
    }
    const stopCurrentServicePlayback = async () => {
        try {
            const currentService = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_getCurrentService).call(this);
            const statemachine = SqueezeliteMCContext_1.default.getStateMachine();
            const isPlaybackByMpd = currentService === 'mpd' || (statemachine.isConsume && statemachine.consumeUpdateService === 'mpd');
            if (isPlaybackByMpd) {
                /**
                 * MpdPlugin pushes 'stop' states which do not get ignored by the statemachine even after we have called setVolatile().
                 * The statemachine just combines the volatile state with the mpdplugin's 'stop' states and completely messes itself up.
                 * We need to tell mpdPlugin to ignore updates after stopping. Note, however, if the current service / state consumption
                 * is not handled by mpdPlugin, but similarly pushes states after stopping, then this will also screw up the statemachine...
                 */
                SqueezeliteMCContext_1.default.getMpdPlugin().ignoreUpdate(true);
            }
            return (0, Util_1.kewToJSPromise)(__classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").volumioStop());
        }
        catch (error) {
            SqueezeliteMCContext_1.default.getLogger().error(SqueezeliteMCContext_1.default.getErrorMessage('[squeezelite_mc] An error occurred while stopping playback by current service:', error));
            SqueezeliteMCContext_1.default.getLogger().error('[squeezelite_mc] Continuing anyway...');
        }
    };
    // Stop any playback by the currently active service
    SqueezeliteMCContext_1.default.getLogger().info('[squeezelite_mc] Stopping playback by current service...');
    SqueezeliteMCContext_1.default.getStateMachine().setConsumeUpdateService(undefined);
    await stopCurrentServicePlayback();
    // Unset any volatile state of currently active service
    const statemachine = SqueezeliteMCContext_1.default.getStateMachine();
    if (statemachine.isVolatile) {
        statemachine.unSetVolatile();
    }
    // Set volatile
    SqueezeliteMCContext_1.default.getLogger().info('[squeezelite_mc] Setting ourselves as the current service...');
    if (!__classPrivateFieldGet(this, _ControllerSqueezeliteMC_volatileCallback, "f")) {
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_volatileCallback, this.onUnsetVolatile.bind(this), "f");
    }
    SqueezeliteMCContext_1.default.getStateMachine().setVolatile({
        service: __classPrivateFieldGet(this, _ControllerSqueezeliteMC_serviceName, "f"),
        callback: __classPrivateFieldGet(this, _ControllerSqueezeliteMC_volatileCallback, "f")
    });
    SqueezeliteMCContext_1.default.getStateMachine().setConsumeUpdateService(undefined);
}, _ControllerSqueezeliteMC_pushEmptyState = function _ControllerSqueezeliteMC_pushEmptyState() {
    if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playbackTimer, "f")) {
        __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playbackTimer, "f").stop();
    }
    SqueezeliteMCContext_1.default.getLogger().info('[squeezelite_mc] Pushing empty state...');
    // Need to first push empty state with pause status first so the empty volatileState gets registered
    // By statemachine.
    __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").servicePushState(Object.assign(EMPTY_STATE, { status: 'pause' }), __classPrivateFieldGet(this, _ControllerSqueezeliteMC_serviceName, "f"));
    // Then push empty state with stop status. Note that the actual state will remain as 'pause', but trying to
    // Work with the logic of the state machine, or lack thereof, is just too much to bear...
    __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").servicePushState(EMPTY_STATE, __classPrivateFieldGet(this, _ControllerSqueezeliteMC_serviceName, "f"));
}, _ControllerSqueezeliteMC_getCurrentService = function _ControllerSqueezeliteMC_getCurrentService() {
    const currentstate = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").volumioGetState();
    return (currentstate !== undefined && currentstate.service !== undefined) ? currentstate.service : null;
}, _ControllerSqueezeliteMC_isCurrentService = function _ControllerSqueezeliteMC_isCurrentService() {
    return __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_getCurrentService).call(this) === __classPrivateFieldGet(this, _ControllerSqueezeliteMC_serviceName, "f");
}, _ControllerSqueezeliteMC_requestPlayerStatusUpdate = function _ControllerSqueezeliteMC_requestPlayerStatusUpdate() {
    if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_isCurrentService).call(this) && __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStatusMonitor, "f")) {
        __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStatusMonitor, "f").requestUpdate();
    }
}, _ControllerSqueezeliteMC_getPlayerConfig = function _ControllerSqueezeliteMC_getPlayerConfig() {
    const playerConfigType = SqueezeliteMCContext_1.default.getConfigValue('playerConfigType');
    const playerConfig = playerConfigType === 'basic' ?
        SqueezeliteMCContext_1.default.getConfigValue('basicPlayerConfig') : SqueezeliteMCContext_1.default.getConfigValue('manualPlayerConfig');
    const defaultPlayerConfig = playerConfigType === 'basic' ?
        SqueezeliteMCContext_1.default.getConfigValue('basicPlayerConfig', true) : SqueezeliteMCContext_1.default.getConfigValue('manualPlayerConfig', true);
    return {
        ...defaultPlayerConfig,
        ...playerConfig
    };
}, _ControllerSqueezeliteMC_getAlsaConfig = function _ControllerSqueezeliteMC_getAlsaConfig() {
    const device = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', 'outputdevice');
    const card = device.indexOf(',') >= 0 ? device.charAt(0) : device;
    const mixerType = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', 'mixer_type'); // Software / Hardware
    // `mixer` is for squeezelite -V option:
    // - null for 'None' mixer type (use Squeezelite software volume control)
    // - Otherwise, set to same as Volumio (e.g. 'SoftMaster' for 'Software' mixer type)
    const mixer = mixerType !== 'None' ? (() => {
        const mixerDev = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', 'mixer');
        if (mixerDev.indexOf(',') >= 0) {
            const mixerArr = mixerDev.split(',');
            return `${mixerArr[0]},${mixerArr[1]}`;
        }
        return mixerDev;
    })() : null;
    return {
        card,
        mixerType,
        mixer
    };
}, _ControllerSqueezeliteMC_getPlayerStartupParams = async function _ControllerSqueezeliteMC_getPlayerStartupParams(getDefault = false) {
    const alsaConfig = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_getAlsaConfig).call(this);
    const playerConfigType = SqueezeliteMCContext_1.default.getConfigValue('playerConfigType');
    if (playerConfigType === 'basic' || getDefault) {
        const config = SqueezeliteMCContext_1.default.getConfigValue('basicPlayerConfig', getDefault);
        // Player name
        let playerName;
        if (config.playerNameType === 'custom' && config.playerName) {
            playerName = config.playerName;
        }
        else {
            // Default - use device hostname. Don't rely on Squeezelite to set this, since it sometimes sets its
            // Name to "SqueezeLite", which is not what we want).
            playerName = os_1.default.hostname();
        }
        // Alsa
        const { mixerType, card } = alsaConfig;
        // DSD format
        const dsdPlayback = config.dsdPlayback;
        let dsdFormatPromise, getBestSupportedDSDFormatCalled = false;
        if (mixerType === 'Software' || dsdPlayback === 'pcm') {
            dsdFormatPromise = Promise.resolve(null);
        }
        else if (dsdPlayback === 'dop') {
            dsdFormatPromise = Promise.resolve('dop');
        }
        else if (DSD_FORMATS.includes(dsdPlayback)) {
            dsdFormatPromise = Promise.resolve(dsdPlayback);
        }
        else { // Auto based on Volumio's "DSD Playback Mode" setting
            const dop = !!__classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").executeOnPlugin('music_service', 'mpd', 'getConfigParam', 'dop');
            if (dop) {
                dsdFormatPromise = Promise.resolve('dop');
            }
            else {
                dsdFormatPromise = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_getBestSupportedDSDFormat).call(this, card);
                getBestSupportedDSDFormatCalled = true;
            }
        }
        const dsdFormat = await dsdFormatPromise;
        if (!getBestSupportedDSDFormatCalled) {
            /**
             * #getBestSupportedDSDFormat() might not always be able to obtain ALSA formats (such as when device is busy).
             * We call it whenever we have the chance so that, if the call is successful, the ALSA formats can be kept
             * in cache until we actually need them.
             */
            await __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_getBestSupportedDSDFormat).call(this, card, true);
        }
        return {
            type: 'basic',
            playerName,
            dsdFormat,
            ...alsaConfig
        };
    }
    // Manual playerConfigType
    const config = SqueezeliteMCContext_1.default.getConfigValue('manualPlayerConfig');
    return {
        type: 'manual',
        startupOptions: config.startupOptions,
        ...alsaConfig
    };
}, _ControllerSqueezeliteMC_getBestSupportedDSDFormat = async function _ControllerSqueezeliteMC_getBestSupportedDSDFormat(card, noErr = false) {
    const cachedAlsaFormats = SqueezeliteMCContext_1.default.get('alsaFormats', {});
    const alsaFormatsPromise = cachedAlsaFormats[card] ? Promise.resolve(cachedAlsaFormats[card]) : (0, System_1.getAlsaFormats)(card);
    try {
        const alsaFormats = await alsaFormatsPromise;
        if (alsaFormats.length === 0) {
            SqueezeliteMCContext_1.default.getLogger().warn(`[squeezelite_mc] No ALSA formats returned for card ${card}`);
            return null;
        }
        cachedAlsaFormats[card] = alsaFormats;
        SqueezeliteMCContext_1.default.set('alsaFormats', cachedAlsaFormats);
        for (let i = DSD_FORMATS.length - 1; i >= 0; i--) {
            const dsdFormat = DSD_FORMATS[i];
            if (alsaFormats.includes(dsdFormat)) {
                return dsdFormat;
            }
        }
        return null;
    }
    catch (error) {
        if (noErr) {
            return null;
        }
        throw error;
    }
}, _ControllerSqueezeliteMC_getVolumioVolume = async function _ControllerSqueezeliteMC_getVolumioVolume() {
    try {
        const volumeData = await (0, Util_1.kewToJSPromise)(__classPrivateFieldGet(this, _ControllerSqueezeliteMC_commandRouter, "f").volumioretrievevolume());
        return volumeData.vol;
    }
    catch (error) {
        return 0;
    }
}, _ControllerSqueezeliteMC_revalidatePlayerConfig = async function _ControllerSqueezeliteMC_revalidatePlayerConfig(options) {
    let startupParams;
    let startupParamsChanged;
    try {
        SqueezeliteMCContext_1.default.toast('info', SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_REVALIDATING'));
        startupParams = await __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_getPlayerStartupParams).call(this);
    }
    catch (error) {
        if (error instanceof System_1.SystemError && error.code === System_1.SystemErrorCode.DeviceBusy) {
            SqueezeliteMCContext_1.default.toast('error', SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_ERR_REVALIDATE_DEV_BUSY'));
        }
        else {
            SqueezeliteMCContext_1.default.toast('error', SqueezeliteMCContext_1.default.getErrorMessage(SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_ERR_REVALIDATE'), error, false));
        }
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerStartupParams, null, "f");
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerRunState, Player_1.PlayerRunState.ConfigRequireRevalidate, "f");
        SqueezeliteMCContext_1.default.refreshUIConfig();
        return;
    }
    if (startupParams.type === 'basic') {
        startupParamsChanged = options?.force ||
            !__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStartupParams, "f") ||
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStartupParams, "f").type !== 'basic' ||
            (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStartupParams, "f").playerName !== startupParams.playerName ||
                __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStartupParams, "f").card !== startupParams.card ||
                __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStartupParams, "f").mixerType !== startupParams.mixerType ||
                __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStartupParams, "f").mixer !== startupParams.mixer ||
                __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStartupParams, "f").dsdFormat !== startupParams.dsdFormat);
    }
    else { // `manual` startupParams type
        startupParamsChanged = options?.force ||
            !__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStartupParams, "f") ||
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStartupParams, "f").type !== 'manual' ||
            __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStartupParams, "f").startupOptions !== startupParams.startupOptions;
    }
    if (startupParamsChanged) {
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerStartupParams, startupParams, "f");
        SqueezeliteMCContext_1.default.getLogger().info(`[squeezelite_mc] Restarting Squeezelite service with params: ${JSON.stringify(startupParams)}`);
        try {
            await (0, System_1.initSqueezeliteService)(startupParams);
            SqueezeliteMCContext_1.default.toast('success', SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_RESTARTED_CONFIG'));
            __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerRunState, Player_1.PlayerRunState.Normal, "f");
            SqueezeliteMCContext_1.default.refreshUIConfig();
        }
        catch (error) {
            if (error instanceof System_1.SystemError && error.code === System_1.SystemErrorCode.DeviceBusy) {
                SqueezeliteMCContext_1.default.toast('error', SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_ERR_RESTART_DEV_BUSY'));
            }
            else {
                SqueezeliteMCContext_1.default.toast('error', SqueezeliteMCContext_1.default.getErrorMessage(SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_ERR_RESTART'), error, false));
            }
            __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerStartupParams, null, "f");
            __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerRunState, Player_1.PlayerRunState.ConfigRequireRestart, "f");
            SqueezeliteMCContext_1.default.refreshUIConfig();
        }
    }
}, _ControllerSqueezeliteMC_handlePlayerConfigChange = async function _ControllerSqueezeliteMC_handlePlayerConfigChange() {
    // Volumio can emit multiple change notifications within a short interval.
    // We set a delay timer to avoid calling initSqueezeliteService() multiple times.
    if (__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerConfigChangeDelayTimer, "f")) {
        clearTimeout(__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerConfigChangeDelayTimer, "f"));
        __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerConfigChangeDelayTimer, null, "f");
    }
    __classPrivateFieldSet(this, _ControllerSqueezeliteMC_playerConfigChangeDelayTimer, setTimeout(async () => {
        __classPrivateFieldGet(this, _ControllerSqueezeliteMC_instances, "m", _ControllerSqueezeliteMC_revalidatePlayerConfig).call(this);
    }, 1500), "f");
}, _ControllerSqueezeliteMC_resolveOnStatusMode = function _ControllerSqueezeliteMC_resolveOnStatusMode(mode, timeout = 2000) {
    if (!__classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStatusMonitor, "f")) {
        return kew_1.default.resolve(true);
    }
    const monitor = __classPrivateFieldGet(this, _ControllerSqueezeliteMC_playerStatusMonitor, "f");
    const defer = kew_1.default.defer();
    const updateHandler = (data) => {
        if (data.status.mode === mode) {
            monitor.off('update', updateHandler);
            clearTimeout(updateTimeout);
            defer.resolve();
        }
    };
    const updateTimeout = setTimeout(() => {
        monitor.off('update', updateHandler);
        defer.resolve();
    }, timeout);
    monitor.on('update', updateHandler);
    return defer.promise;
};
module.exports = ControllerSqueezeliteMC;
//# sourceMappingURL=index.js.map