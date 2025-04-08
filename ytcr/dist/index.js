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
var _ControllerYTCR_instances, _ControllerYTCR_serviceName, _ControllerYTCR_context, _ControllerYTCR_config, _ControllerYTCR_commandRouter, _ControllerYTCR_volatileCallback, _ControllerYTCR_previousTrackTimer, _ControllerYTCR_logger, _ControllerYTCR_player, _ControllerYTCR_volumeControl, _ControllerYTCR_receiver, _ControllerYTCR_dataStore, _ControllerYTCR_nowPlayingMetadataProvider, _ControllerYTCR_getMpdConfig, _ControllerYTCR_hasConnectedSenders, _ControllerYTCR_checkSendersAndPromptBeforeRestart;
const yt_cast_receiver_1 = __importStar(require("yt-cast-receiver"));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const kew_1 = __importDefault(require("kew"));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const v_conf_1 = __importDefault(require("v-conf"));
const i18n_json_1 = __importDefault(require("./config/i18n.json"));
const YTCRContext_js_1 = __importDefault(require("./lib/YTCRContext.js"));
const Logger_js_1 = __importDefault(require("./lib/Logger.js"));
const MPDPlayer_js_1 = __importDefault(require("./lib/MPDPlayer.js"));
const VolumeControl_js_1 = __importDefault(require("./lib/VolumeControl.js"));
const utils = __importStar(require("./lib/Utils.js"));
const VideoLoader_js_1 = __importDefault(require("./lib/VideoLoader.js"));
const PairingHelper_js_1 = __importDefault(require("./lib/PairingHelper.js"));
const ReceiverDataStore_js_1 = __importDefault(require("./lib/ReceiverDataStore.js"));
const YTCRNowPlayingMetadataProvider_1 = __importDefault(require("./lib/YTCRNowPlayingMetadataProvider"));
const IDLE_STATE = {
    status: 'stop',
    service: 'ytcr',
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
class ControllerYTCR {
    constructor(context) {
        _ControllerYTCR_instances.add(this);
        _ControllerYTCR_serviceName.set(this, 'ytcr');
        _ControllerYTCR_context.set(this, void 0);
        _ControllerYTCR_config.set(this, void 0);
        _ControllerYTCR_commandRouter.set(this, void 0);
        _ControllerYTCR_volatileCallback.set(this, void 0);
        _ControllerYTCR_previousTrackTimer.set(this, void 0);
        _ControllerYTCR_logger.set(this, void 0);
        _ControllerYTCR_player.set(this, void 0);
        _ControllerYTCR_volumeControl.set(this, void 0);
        _ControllerYTCR_receiver.set(this, void 0);
        _ControllerYTCR_dataStore.set(this, void 0);
        _ControllerYTCR_nowPlayingMetadataProvider.set(this, void 0);
        __classPrivateFieldSet(this, _ControllerYTCR_context, context, "f");
        __classPrivateFieldSet(this, _ControllerYTCR_commandRouter, context.coreCommand, "f");
        __classPrivateFieldSet(this, _ControllerYTCR_dataStore, new ReceiverDataStore_js_1.default(), "f");
        __classPrivateFieldSet(this, _ControllerYTCR_logger, new Logger_js_1.default(context.logger), "f");
        __classPrivateFieldSet(this, _ControllerYTCR_previousTrackTimer, null, "f");
        __classPrivateFieldSet(this, _ControllerYTCR_serviceName, 'ytcr', "f");
    }
    getUIConfig() {
        const defer = kew_1.default.defer();
        const lang_code = __classPrivateFieldGet(this, _ControllerYTCR_commandRouter, "f").sharedVars.get('language_code');
        const configPrepTasks = [
            __classPrivateFieldGet(this, _ControllerYTCR_commandRouter, "f").i18nJson(`${__dirname}/i18n/strings_${lang_code}.json`, `${__dirname}/i18n/strings_en.json`, `${__dirname}/UIConfig.json`),
            utils.jsPromiseToKew(PairingHelper_js_1.default.getManualPairingCode(__classPrivateFieldGet(this, _ControllerYTCR_receiver, "f"), __classPrivateFieldGet(this, _ControllerYTCR_logger, "f")))
        ];
        kew_1.default.all(configPrepTasks)
            .then((configParams) => {
            const [uiconf, pairingCode] = configParams;
            const [connectionUIConf, manualPairingUIConf, i18nUIConf, otherUIConf] = uiconf.sections;
            const receiverRunning = __classPrivateFieldGet(this, _ControllerYTCR_receiver, "f").status === yt_cast_receiver_1.Constants.STATUSES.RUNNING;
            const port = YTCRContext_js_1.default.getConfigValue('port', 8098);
            const enableAutoplayOnConnect = YTCRContext_js_1.default.getConfigValue('enableAutoplayOnConnect', true);
            const resetPlayerOnDisconnect = YTCRContext_js_1.default.getConfigValue('resetPlayerOnDisconnect', yt_cast_receiver_1.Constants.RESET_PLAYER_ON_DISCONNECT_POLICIES.ALL_DISCONNECTED);
            const debug = YTCRContext_js_1.default.getConfigValue('debug', false);
            const bindToIf = YTCRContext_js_1.default.getConfigValue('bindToIf', '');
            const i18n = {
                region: YTCRContext_js_1.default.getConfigValue('region', 'US'),
                language: YTCRContext_js_1.default.getConfigValue('language', 'en')
            };
            const prefetch = YTCRContext_js_1.default.getConfigValue('prefetch', true);
            const preferOpus = YTCRContext_js_1.default.getConfigValue('preferOpus', false);
            const liveStreamQuality = YTCRContext_js_1.default.getConfigValue('liveStreamQuality', 'auto');
            const liveStreamQualityOptions = otherUIConf.content[2].options;
            const availableIf = utils.getNetworkInterfaces();
            const ifOpts = [{
                    value: '',
                    label: YTCRContext_js_1.default.getI18n('YTCR_BIND_TO_ALL_IF')
                }];
            connectionUIConf.content[1].value = ifOpts[0];
            availableIf.forEach((info) => {
                const opt = {
                    value: info.name,
                    label: `${info.name} (${info.ip})`
                };
                ifOpts.push(opt);
                if (bindToIf === info.name) {
                    connectionUIConf.content[1].value = opt;
                }
            });
            connectionUIConf.content[0].value = port;
            connectionUIConf.content[1].options = ifOpts;
            if (!receiverRunning) {
                manualPairingUIConf.content[0].value = YTCRContext_js_1.default.getI18n('YTCR_NO_CODE_NOT_RUNNING');
            }
            else {
                manualPairingUIConf.content[0].value = pairingCode || YTCRContext_js_1.default.getI18n('YTCR_NO_CODE_ERR');
            }
            i18nUIConf.content[0].options = i18n_json_1.default.region;
            i18nUIConf.content[0].value = i18n_json_1.default.region.find((r) => i18n.region === r.value);
            i18nUIConf.content[1].options = i18n_json_1.default.language;
            i18nUIConf.content[1].value = i18n_json_1.default.language.find((r) => i18n.language === r.value);
            otherUIConf.content[0].value = prefetch;
            otherUIConf.content[1].value = preferOpus;
            otherUIConf.content[2].value = liveStreamQualityOptions.find((o) => o.value === liveStreamQuality);
            otherUIConf.content[3].value = enableAutoplayOnConnect;
            otherUIConf.content[4].options = [
                {
                    value: yt_cast_receiver_1.Constants.RESET_PLAYER_ON_DISCONNECT_POLICIES.ALL_DISCONNECTED,
                    label: YTCRContext_js_1.default.getI18n('YTCR_RESET_PLAYER_ON_DISCONNECT_ALWAYS')
                },
                {
                    value: yt_cast_receiver_1.Constants.RESET_PLAYER_ON_DISCONNECT_POLICIES.ALL_EXPLICITLY_DISCONNECTED,
                    label: YTCRContext_js_1.default.getI18n('YTCR_RESET_PLAYER_ON_DISCONNECT_EXPLICIT')
                }
            ];
            otherUIConf.content[4].value = otherUIConf.content[4].options.find((o) => o.value === resetPlayerOnDisconnect);
            otherUIConf.content[5].value = debug;
            let connectionStatus;
            if (!receiverRunning) {
                connectionStatus = YTCRContext_js_1.default.getI18n('YTCR_IDLE_NOT_RUNNING');
            }
            else if (__classPrivateFieldGet(this, _ControllerYTCR_instances, "m", _ControllerYTCR_hasConnectedSenders).call(this)) {
                const senders = __classPrivateFieldGet(this, _ControllerYTCR_receiver, "f").getConnectedSenders();
                if (senders.length > 1) {
                    connectionStatus = YTCRContext_js_1.default.getI18n('YTCR_CONNECTED_MULTIPLE', senders[0].name, senders.length - 1);
                }
                else {
                    connectionStatus = YTCRContext_js_1.default.getI18n('YTCR_CONNECTED', senders[0].name);
                }
            }
            else {
                connectionStatus = YTCRContext_js_1.default.getI18n('YTCR_IDLE');
            }
            connectionUIConf.label = YTCRContext_js_1.default.getI18n('YTCR_CONNECTION', connectionStatus);
            defer.resolve(uiconf);
        })
            .fail((error) => {
            __classPrivateFieldGet(this, _ControllerYTCR_logger, "f").error('[ytcr] Failed to retrieve YouTube Cast Receiver plugin configuration: ', error);
            defer.reject(error);
        });
        return defer.promise;
    }
    onVolumioStart() {
        const configFile = __classPrivateFieldGet(this, _ControllerYTCR_commandRouter, "f").pluginManager.getConfigurationFile(__classPrivateFieldGet(this, _ControllerYTCR_context, "f"), 'config.json');
        __classPrivateFieldSet(this, _ControllerYTCR_config, new v_conf_1.default(), "f");
        __classPrivateFieldGet(this, _ControllerYTCR_config, "f").loadFile(configFile);
        return kew_1.default.resolve();
    }
    onStart() {
        const defer = kew_1.default.defer();
        YTCRContext_js_1.default.init(__classPrivateFieldGet(this, _ControllerYTCR_context, "f"), __classPrivateFieldGet(this, _ControllerYTCR_config, "f"));
        __classPrivateFieldSet(this, _ControllerYTCR_volumeControl, new VolumeControl_js_1.default(__classPrivateFieldGet(this, _ControllerYTCR_commandRouter, "f"), __classPrivateFieldGet(this, _ControllerYTCR_logger, "f")), "f");
        const playerConfig = {
            mpd: __classPrivateFieldGet(this, _ControllerYTCR_instances, "m", _ControllerYTCR_getMpdConfig).call(this),
            volumeControl: __classPrivateFieldGet(this, _ControllerYTCR_volumeControl, "f"),
            videoLoader: new VideoLoader_js_1.default(__classPrivateFieldGet(this, _ControllerYTCR_logger, "f")),
            prefetch: YTCRContext_js_1.default.getConfigValue('prefetch', true)
        };
        __classPrivateFieldSet(this, _ControllerYTCR_player, new MPDPlayer_js_1.default(playerConfig), "f");
        const bindToIf = YTCRContext_js_1.default.getConfigValue('bindToIf', '');
        const receiverOptions = {
            dial: {
                port: YTCRContext_js_1.default.getConfigValue('port', 8098),
                bindToInterfaces: utils.hasNetworkInterface(bindToIf) ? [bindToIf] : undefined
            },
            app: {
                enableAutoplayOnConnect: YTCRContext_js_1.default.getConfigValue('enableAutoplayOnConnect', true),
                resetPlayerOnDisconnectPolicy: YTCRContext_js_1.default.getConfigValue('resetPlayerOnDisconnect', yt_cast_receiver_1.Constants.RESET_PLAYER_ON_DISCONNECT_POLICIES.ALL_DISCONNECTED)
            },
            dataStore: __classPrivateFieldGet(this, _ControllerYTCR_dataStore, "f"),
            logger: __classPrivateFieldGet(this, _ControllerYTCR_logger, "f"),
            logLevel: YTCRContext_js_1.default.getConfigValue('debug', false) ? yt_cast_receiver_1.Constants.LOG_LEVELS.DEBUG : yt_cast_receiver_1.Constants.LOG_LEVELS.INFO
        };
        const deviceInfo = YTCRContext_js_1.default.getDeviceInfo();
        if (deviceInfo.name) {
            receiverOptions.device = {
                name: deviceInfo.name
            };
        }
        const receiver = __classPrivateFieldSet(this, _ControllerYTCR_receiver, new yt_cast_receiver_1.default(__classPrivateFieldGet(this, _ControllerYTCR_player, "f"), receiverOptions), "f");
        receiver.on('senderConnect', (sender) => {
            __classPrivateFieldGet(this, _ControllerYTCR_logger, "f").info('[ytcr] ***** Sender connected *****');
            YTCRContext_js_1.default.toast('success', YTCRContext_js_1.default.getI18n('YTCR_CONNECTED', sender.name));
            this.refreshUIConfig();
        });
        receiver.on('senderDisconnect', (sender) => {
            __classPrivateFieldGet(this, _ControllerYTCR_logger, "f").info('[ytcr] ***** Sender disconnected *****');
            YTCRContext_js_1.default.toast('warning', YTCRContext_js_1.default.getI18n('YTCR_DISCONNECTED', sender.name));
            this.refreshUIConfig();
        });
        __classPrivateFieldGet(this, _ControllerYTCR_player, "f").on('action', async (action) => {
            if (action.name === 'play' && !this.isCurrentService()) {
                __classPrivateFieldGet(this, _ControllerYTCR_logger, "f").debug('[ytcr] \'play\' command received while not being the current service.');
                // Stop any playback by the currently active service
                __classPrivateFieldGet(this, _ControllerYTCR_logger, "f").debug('[ytcr] Stopping playback by current service...');
                try {
                    await utils.kewToJSPromise(__classPrivateFieldGet(this, _ControllerYTCR_commandRouter, "f").volumioStop());
                }
                catch (error) {
                    __classPrivateFieldGet(this, _ControllerYTCR_logger, "f").debug('[ytcr] An error occurred while stopping playback by current service: ', error);
                    __classPrivateFieldGet(this, _ControllerYTCR_logger, "f").debug('[ytcr] Continuing anyway...');
                }
                // Unset any volatile state of currently active service
                const sm = YTCRContext_js_1.default.getStateMachine();
                if (sm.isVolatile) {
                    sm.unSetVolatile(); // Why isn't this async?!
                }
                __classPrivateFieldGet(this, _ControllerYTCR_logger, "f").debug('[ytcr] Setting ourselves as the current service...');
                this.setVolatile();
                this.pushIdleState();
                // Update volume on sender apps
                await __classPrivateFieldGet(this, _ControllerYTCR_player, "f").notifyExternalStateChange();
            }
            else if (action.name === 'setVolume' && !this.isCurrentService()) {
                __classPrivateFieldGet(this, _ControllerYTCR_logger, "f").debug('[ytcr] setVolume command received, but we are not the current service. Putting player to sleep...');
                __classPrivateFieldGet(this, _ControllerYTCR_player, "f").sleep();
            }
        });
        // Listen for changes in volume on Volumio's end
        __classPrivateFieldGet(this, _ControllerYTCR_volumeControl, "f").registerVolumioVolumeChangeListener(async (volumioVol) => {
            const volume = {
                level: volumioVol.vol,
                muted: volumioVol.mute
            };
            if (this.isCurrentService() && __classPrivateFieldGet(this, _ControllerYTCR_instances, "m", _ControllerYTCR_hasConnectedSenders).call(this)) {
                // SetVolume() will trigger volumioupdatevolume() which will trigger the statemachine's
                // PushState() - but old volatile state with outdated info will be used.
                // So we push the latest state here to refresh the old volatile state.
                __classPrivateFieldGet(this, _ControllerYTCR_logger, "f").debug('[ytcr] Captured change in Volumio\'s volume:', volumioVol);
                await this.pushState();
                await __classPrivateFieldGet(this, _ControllerYTCR_volumeControl, "f").setVolume(volume, true);
                await this.pushState(); // Do it once more
                await __classPrivateFieldGet(this, _ControllerYTCR_player, "f").notifyExternalStateChange();
            }
            else {
                // Even if not current service, we keep track of the updated volume
                await __classPrivateFieldGet(this, _ControllerYTCR_volumeControl, "f").setVolume(volume, true);
            }
        });
        __classPrivateFieldGet(this, _ControllerYTCR_player, "f").on('state', async (states) => {
            if (this.isCurrentService()) {
                const state = states.current;
                __classPrivateFieldGet(this, _ControllerYTCR_logger, "f").debug('[ytcr] Received state change event from MPDPlayer:', state);
                if (state.status === yt_cast_receiver_1.Constants.PLAYER_STATUSES.STOPPED || state.status === yt_cast_receiver_1.Constants.PLAYER_STATUSES.IDLE) {
                    __classPrivateFieldGet(this, _ControllerYTCR_player, "f").sleep();
                    if (state.status === yt_cast_receiver_1.Constants.PLAYER_STATUSES.STOPPED && __classPrivateFieldGet(this, _ControllerYTCR_player, "f").queue.videoIds.length > 0) {
                        // If queue is not empty, it is possible that we are just moving to another song. In this case, we don't push
                        // Idle state to avoid ugly flickering of the screen caused by the temporary Idle state.
                        const currentVolumioState = YTCRContext_js_1.default.getStateMachine().getState();
                        currentVolumioState.status = 'pause'; // Don't use 'stop' - will display Volumio logo leading to flicker!
                        await this.pushState(currentVolumioState);
                    }
                    else {
                        this.pushIdleState();
                    }
                }
                else {
                    await this.pushState();
                }
            }
        });
        __classPrivateFieldGet(this, _ControllerYTCR_player, "f").on('error', (error) => {
            YTCRContext_js_1.default.toast('error', error.message);
        });
        receiver.start().then(async () => {
            await __classPrivateFieldGet(this, _ControllerYTCR_volumeControl, "f").init();
            await __classPrivateFieldGet(this, _ControllerYTCR_player, "f").init();
            __classPrivateFieldGet(this, _ControllerYTCR_logger, "f").debug('[ytcr] Receiver started with options:', receiverOptions);
            __classPrivateFieldSet(this, _ControllerYTCR_nowPlayingMetadataProvider, new YTCRNowPlayingMetadataProvider_1.default(__classPrivateFieldGet(this, _ControllerYTCR_player, "f"), __classPrivateFieldGet(this, _ControllerYTCR_logger, "f")), "f");
            defer.resolve();
        })
            .catch((error) => {
            __classPrivateFieldGet(this, _ControllerYTCR_logger, "f").error('[ytcr] Failed to start plugin:', error);
            if (receiver.status === yt_cast_receiver_1.Constants.STATUSES.RUNNING) {
                receiver.stop();
            }
            else {
                YTCRContext_js_1.default.toast('error', YTCRContext_js_1.default.getI18n('YTCR_RECEIVER_START_ERR', error.message || error));
            }
            // Still resolve, in case error is caused by wrong setting (e.g. conflicting port).
            defer.resolve();
        });
        return defer.promise;
    }
    configSaveConnection(data) {
        const oldPort = YTCRContext_js_1.default.getConfigValue('port', 8098);
        const port = parseInt(data['port'], 10);
        if (port < 1024 || port > 65353) {
            YTCRContext_js_1.default.toast('error', YTCRContext_js_1.default.getI18n('YTCR_INVALID_PORT'));
            return;
        }
        const oldBindToIf = YTCRContext_js_1.default.getConfigValue('bindToIf', '');
        const bindToIf = data['bindToIf'].value;
        if (oldPort !== port || oldBindToIf !== bindToIf) {
            __classPrivateFieldGet(this, _ControllerYTCR_instances, "m", _ControllerYTCR_checkSendersAndPromptBeforeRestart).call(this, this.configConfirmSaveConnection.bind(this, { port, bindToIf }), {
                'endpoint': 'music_service/ytcr',
                'method': 'configConfirmSaveConnection',
                'data': { port, bindToIf }
            });
        }
        else {
            YTCRContext_js_1.default.toast('success', YTCRContext_js_1.default.getI18n('YTCR_SETTINGS_SAVED'));
        }
    }
    configConfirmSaveConnection(data) {
        __classPrivateFieldGet(this, _ControllerYTCR_config, "f").set('port', data['port']);
        __classPrivateFieldGet(this, _ControllerYTCR_config, "f").set('bindToIf', data['bindToIf']);
        this.restart().then(() => {
            this.refreshUIConfig();
            YTCRContext_js_1.default.toast('success', YTCRContext_js_1.default.getI18n('YTCR_RESTARTED'));
        });
    }
    configSaveI18n(data) {
        const oldRegion = YTCRContext_js_1.default.getConfigValue('region');
        const oldLanguage = YTCRContext_js_1.default.getConfigValue('language');
        const region = data.region.value;
        const language = data.language.value;
        if (oldRegion !== region || oldLanguage !== language) {
            YTCRContext_js_1.default.setConfigValue('region', region);
            YTCRContext_js_1.default.setConfigValue('language', language);
            if (__classPrivateFieldGet(this, _ControllerYTCR_player, "f")) {
                __classPrivateFieldGet(this, _ControllerYTCR_player, "f").videoLoader.refreshI18nConfig();
            }
        }
        YTCRContext_js_1.default.toast('success', YTCRContext_js_1.default.getI18n('YTCR_SETTINGS_SAVED'));
    }
    async configSaveOther(data) {
        __classPrivateFieldGet(this, _ControllerYTCR_config, "f").set('prefetch', data['prefetch']);
        __classPrivateFieldGet(this, _ControllerYTCR_config, "f").set('preferOpus', data['preferOpus']);
        __classPrivateFieldGet(this, _ControllerYTCR_config, "f").set('liveStreamQuality', data['liveStreamQuality'].value);
        __classPrivateFieldGet(this, _ControllerYTCR_config, "f").set('enableAutoplayOnConnect', data['enableAutoplayOnConnect']);
        __classPrivateFieldGet(this, _ControllerYTCR_config, "f").set('resetPlayerOnDisconnect', data['resetPlayerOnDisconnect'].value);
        __classPrivateFieldGet(this, _ControllerYTCR_config, "f").set('debug', data['debug']);
        if (__classPrivateFieldGet(this, _ControllerYTCR_receiver, "f")) {
            __classPrivateFieldGet(this, _ControllerYTCR_receiver, "f").setLogLevel(data['debug'] ? yt_cast_receiver_1.Constants.LOG_LEVELS.DEBUG : yt_cast_receiver_1.Constants.LOG_LEVELS.INFO);
            __classPrivateFieldGet(this, _ControllerYTCR_receiver, "f").enableAutoplayOnConnect(data['enableAutoplayOnConnect']);
            __classPrivateFieldGet(this, _ControllerYTCR_receiver, "f").setResetPlayerOnDisconnectPolicy(data['resetPlayerOnDisconnect'].value);
        }
        if (__classPrivateFieldGet(this, _ControllerYTCR_player, "f")) {
            await __classPrivateFieldGet(this, _ControllerYTCR_player, "f").enablePrefetch(data['prefetch']);
        }
        YTCRContext_js_1.default.toast('success', YTCRContext_js_1.default.getI18n('YTCR_SETTINGS_SAVED'));
    }
    configClearDataStore() {
        __classPrivateFieldGet(this, _ControllerYTCR_instances, "m", _ControllerYTCR_checkSendersAndPromptBeforeRestart).call(this, this.configConfirmClearDataStore.bind(this), {
            'endpoint': 'music_service/ytcr',
            'method': 'configConfirmClearDataStore'
        });
    }
    configConfirmClearDataStore() {
        __classPrivateFieldGet(this, _ControllerYTCR_dataStore, "f").clear();
        this.restart().then(() => {
            this.refreshUIConfig();
            YTCRContext_js_1.default.toast('success', YTCRContext_js_1.default.getI18n('YTCR_RESTARTED'));
        });
    }
    refreshUIConfig() {
        __classPrivateFieldGet(this, _ControllerYTCR_commandRouter, "f").getUIConfigOnPlugin('music_service', 'ytcr', {}).then((config) => {
            __classPrivateFieldGet(this, _ControllerYTCR_commandRouter, "f").broadcastMessage('pushUiConfig', config);
        });
    }
    onStop() {
        const defer = kew_1.default.defer();
        __classPrivateFieldGet(this, _ControllerYTCR_receiver, "f").removeAllListeners();
        __classPrivateFieldGet(this, _ControllerYTCR_receiver, "f").stop().then(async () => {
            __classPrivateFieldGet(this, _ControllerYTCR_logger, "f").debug('[ytcr] Receiver stopped');
            this.unsetVolatile();
            __classPrivateFieldGet(this, _ControllerYTCR_volumeControl, "f").unregisterVolumioVolumeChangeListener();
            await __classPrivateFieldGet(this, _ControllerYTCR_player, "f").destroy();
            YTCRContext_js_1.default.reset();
            __classPrivateFieldSet(this, _ControllerYTCR_nowPlayingMetadataProvider, null, "f");
            defer.resolve();
        })
            .catch((error) => {
            __classPrivateFieldGet(this, _ControllerYTCR_logger, "f").error('[ytcr] Failed to stop receiver:', error);
            defer.reject(error);
        });
        return defer.promise;
    }
    restart() {
        return this.onStop().then(() => {
            return this.onStart();
        });
    }
    getConfigurationFiles() {
        return ['config.json'];
    }
    setVolatile() {
        if (!__classPrivateFieldGet(this, _ControllerYTCR_volatileCallback, "f")) {
            __classPrivateFieldSet(this, _ControllerYTCR_volatileCallback, this.onUnsetVolatile.bind(this), "f");
        }
        if (!this.isCurrentService()) {
            YTCRContext_js_1.default.getStateMachine().setVolatile({
                service: __classPrivateFieldGet(this, _ControllerYTCR_serviceName, "f"),
                callback: __classPrivateFieldGet(this, _ControllerYTCR_volatileCallback, "f")
            });
            YTCRContext_js_1.default.getMpdPlugin().ignoreUpdate(true);
            YTCRContext_js_1.default.getStateMachine().setConsumeUpdateService(undefined);
        }
    }
    unsetVolatile() {
        YTCRContext_js_1.default.getStateMachine().unSetVolatile();
    }
    async onUnsetVolatile() {
        this.pushIdleState();
        YTCRContext_js_1.default.getMpdPlugin().ignoreUpdate(false);
        return __classPrivateFieldGet(this, _ControllerYTCR_player, "f").stop();
    }
    pushIdleState() {
        __classPrivateFieldGet(this, _ControllerYTCR_logger, "f").debug('[ytcr] Pushing idle state...');
        // Need to first push empty state with pause status first so the empty volatileState gets registered
        // By statemachine.
        __classPrivateFieldGet(this, _ControllerYTCR_commandRouter, "f").servicePushState(Object.assign(IDLE_STATE, { status: 'pause' }), __classPrivateFieldGet(this, _ControllerYTCR_serviceName, "f"));
        // Then push empty state with stop status
        __classPrivateFieldGet(this, _ControllerYTCR_commandRouter, "f").servicePushState(IDLE_STATE, __classPrivateFieldGet(this, _ControllerYTCR_serviceName, "f"));
    }
    async pushState(state) {
        const volumioState = state || await __classPrivateFieldGet(this, _ControllerYTCR_player, "f").getVolumioState();
        if (volumioState) {
            __classPrivateFieldGet(this, _ControllerYTCR_logger, "f").debug('[ytcr] pushState(): ', volumioState);
            __classPrivateFieldGet(this, _ControllerYTCR_commandRouter, "f").servicePushState(volumioState, __classPrivateFieldGet(this, _ControllerYTCR_serviceName, "f"));
        }
    }
    isCurrentService() {
        // Check what is the current Volumio service
        const currentstate = __classPrivateFieldGet(this, _ControllerYTCR_commandRouter, "f").volumioGetState();
        if (currentstate !== undefined && currentstate.service !== undefined && currentstate.service !== __classPrivateFieldGet(this, _ControllerYTCR_serviceName, "f")) {
            return false;
        }
        return true;
    }
    stop() {
        return utils.jsPromiseToKew(__classPrivateFieldGet(this, _ControllerYTCR_player, "f").stop());
    }
    play() {
        return utils.jsPromiseToKew(__classPrivateFieldGet(this, _ControllerYTCR_player, "f").resume());
    }
    pause() {
        return utils.jsPromiseToKew(__classPrivateFieldGet(this, _ControllerYTCR_player, "f").pause());
    }
    resume() {
        return utils.jsPromiseToKew(__classPrivateFieldGet(this, _ControllerYTCR_player, "f").resume());
    }
    seek(position) {
        return utils.jsPromiseToKew(__classPrivateFieldGet(this, _ControllerYTCR_player, "f").seek(Math.round(position / 1000)));
    }
    next() {
        return utils.jsPromiseToKew(__classPrivateFieldGet(this, _ControllerYTCR_player, "f").next());
    }
    previous() {
        if (__classPrivateFieldGet(this, _ControllerYTCR_previousTrackTimer, "f")) {
            clearTimeout(__classPrivateFieldGet(this, _ControllerYTCR_previousTrackTimer, "f"));
            __classPrivateFieldSet(this, _ControllerYTCR_previousTrackTimer, null, "f");
            return utils.jsPromiseToKew(__classPrivateFieldGet(this, _ControllerYTCR_player, "f").previous());
        }
        if (__classPrivateFieldGet(this, _ControllerYTCR_player, "f").status === yt_cast_receiver_1.Constants.PLAYER_STATUSES.PLAYING ||
            __classPrivateFieldGet(this, _ControllerYTCR_player, "f").status === yt_cast_receiver_1.Constants.PLAYER_STATUSES.PAUSED) {
            __classPrivateFieldSet(this, _ControllerYTCR_previousTrackTimer, setTimeout(() => {
                __classPrivateFieldSet(this, _ControllerYTCR_previousTrackTimer, null, "f");
            }, 3000), "f");
            return __classPrivateFieldGet(this, _ControllerYTCR_player, "f").seek(0);
        }
        return utils.jsPromiseToKew(__classPrivateFieldGet(this, _ControllerYTCR_player, "f").previous());
    }
    getNowPlayingMetadataProvider() {
        return __classPrivateFieldGet(this, _ControllerYTCR_nowPlayingMetadataProvider, "f");
    }
}
_ControllerYTCR_serviceName = new WeakMap(), _ControllerYTCR_context = new WeakMap(), _ControllerYTCR_config = new WeakMap(), _ControllerYTCR_commandRouter = new WeakMap(), _ControllerYTCR_volatileCallback = new WeakMap(), _ControllerYTCR_previousTrackTimer = new WeakMap(), _ControllerYTCR_logger = new WeakMap(), _ControllerYTCR_player = new WeakMap(), _ControllerYTCR_volumeControl = new WeakMap(), _ControllerYTCR_receiver = new WeakMap(), _ControllerYTCR_dataStore = new WeakMap(), _ControllerYTCR_nowPlayingMetadataProvider = new WeakMap(), _ControllerYTCR_instances = new WeakSet(), _ControllerYTCR_getMpdConfig = function _ControllerYTCR_getMpdConfig() {
    return {
        path: '/run/mpd/socket'
    };
}, _ControllerYTCR_hasConnectedSenders = function _ControllerYTCR_hasConnectedSenders() {
    return __classPrivateFieldGet(this, _ControllerYTCR_receiver, "f")?.getConnectedSenders().length > 0 || false;
}, _ControllerYTCR_checkSendersAndPromptBeforeRestart = function _ControllerYTCR_checkSendersAndPromptBeforeRestart(onCheckPass, modalOnConfirmPayload) {
    if (__classPrivateFieldGet(this, _ControllerYTCR_instances, "m", _ControllerYTCR_hasConnectedSenders).call(this)) {
        const modalData = {
            title: YTCRContext_js_1.default.getI18n('YTCR_CONFIGURATION'),
            size: 'lg',
            buttons: [
                {
                    name: YTCRContext_js_1.default.getI18n('YTCR_NO'),
                    class: 'btn btn-warning'
                },
                {
                    name: YTCRContext_js_1.default.getI18n('YTCR_YES'),
                    class: 'btn btn-info',
                    emit: 'callMethod',
                    payload: modalOnConfirmPayload
                }
            ]
        };
        const senders = __classPrivateFieldGet(this, _ControllerYTCR_receiver, "f").getConnectedSenders();
        if (senders.length > 1) {
            modalData.message = YTCRContext_js_1.default.getI18n('YTCR_CONF_RESTART_CONFIRM_M', senders[0].name, senders.length - 1);
        }
        else {
            modalData.message = YTCRContext_js_1.default.getI18n('YTCR_CONF_RESTART_CONFIRM', senders[0].name);
        }
        __classPrivateFieldGet(this, _ControllerYTCR_commandRouter, "f").broadcastMessage('openModal', modalData);
    }
    else {
        onCheckPass();
    }
};
module.exports = ControllerYTCR;
//# sourceMappingURL=index.js.map