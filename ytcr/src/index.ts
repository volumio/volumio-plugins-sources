import YouTubeCastReceiver, { Constants, PlayerState, Sender, YouTubeCastReceiverOptions } from 'yt-cast-receiver';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import vconf from 'v-conf';
import i18nConfOptions from './config/i18n.json';
import ytcr from './lib/YTCRContext.js';
import Logger from './lib/Logger.js';
import MPDPlayer, { ActionEvent, MPDPlayerError, VolumioState } from './lib/MPDPlayer.js';
import VolumeControl, { VolumioVolume } from './lib/VolumeControl.js';
import * as utils from './lib/Utils.js';
import VideoLoader from './lib/VideoLoader.js';
import PairingHelper from './lib/PairingHelper.js';
import ReceiverDataStore from './lib/ReceiverDataStore.js';
import { NowPlayingPluginSupport } from 'now-playing-common';
import YTCRNowPlayingMetadataProvider from './lib/YTCRNowPlayingMetadataProvider';

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

class ControllerYTCR implements NowPlayingPluginSupport {

  #serviceName = 'ytcr';
  #context: any;
  #config: any;
  #commandRouter: any;
  #volatileCallback: any;
  #previousTrackTimer: NodeJS.Timeout | null;

  #logger: Logger;
  #player: MPDPlayer;
  #volumeControl: VolumeControl;
  #receiver: YouTubeCastReceiver;
  #dataStore: ReceiverDataStore;

  #nowPlayingMetadataProvider: YTCRNowPlayingMetadataProvider | null;

  constructor(context: any) {
    this.#context = context;
    this.#commandRouter = context.coreCommand;
    this.#dataStore = new ReceiverDataStore();
    this.#logger = new Logger(context.logger);
    this.#previousTrackTimer = null;
    this.#serviceName = 'ytcr';
  }

  getUIConfig() {
    const defer = libQ.defer();

    const lang_code = this.#commandRouter.sharedVars.get('language_code');

    const configPrepTasks = [
      this.#commandRouter.i18nJson(`${__dirname}/i18n/strings_${lang_code}.json`,
        `${__dirname}/i18n/strings_en.json`,
        `${__dirname}/UIConfig.json`),

      utils.jsPromiseToKew(PairingHelper.getManualPairingCode(this.#receiver, this.#logger))
    ];

    libQ.all(configPrepTasks)
      .then((configParams: [any, string]) => {
        const [ uiconf, pairingCode ] = configParams;
        const [ connectionUIConf,
          manualPairingUIConf,
          i18nUIConf,
          otherUIConf ] = uiconf.sections;
        const receiverRunning = this.#receiver.status === Constants.STATUSES.RUNNING;

        const port = ytcr.getConfigValue('port', 8098);
        const enableAutoplayOnConnect = ytcr.getConfigValue('enableAutoplayOnConnect', true);
        const resetPlayerOnDisconnect = ytcr.getConfigValue('resetPlayerOnDisconnect', Constants.RESET_PLAYER_ON_DISCONNECT_POLICIES.ALL_DISCONNECTED);
        const debug = ytcr.getConfigValue('debug', false);
        const bindToIf = ytcr.getConfigValue('bindToIf', '');
        const i18n = {
          region: ytcr.getConfigValue('region', 'US'),
          language: ytcr.getConfigValue('language', 'en')
        };
        const prefetch = ytcr.getConfigValue('prefetch', true);
        const preferOpus = ytcr.getConfigValue('preferOpus', false);
        const liveStreamQuality = ytcr.getConfigValue('liveStreamQuality', 'auto');
        const liveStreamQualityOptions = otherUIConf.content[2].options;

        const availableIf = utils.getNetworkInterfaces();
        const ifOpts = [ {
          value: '',
          label: ytcr.getI18n('YTCR_BIND_TO_ALL_IF')
        } ];
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
          manualPairingUIConf.content[0].value = ytcr.getI18n('YTCR_NO_CODE_NOT_RUNNING');
        }
        else {
          manualPairingUIConf.content[0].value = pairingCode || ytcr.getI18n('YTCR_NO_CODE_ERR');
        }

        i18nUIConf.content[0].options = i18nConfOptions.region;
        i18nUIConf.content[0].value = i18nConfOptions.region.find((r) => i18n.region === r.value);
        i18nUIConf.content[1].options = i18nConfOptions.language;
        i18nUIConf.content[1].value = i18nConfOptions.language.find((r) => i18n.language === r.value);

        otherUIConf.content[0].value = prefetch;
        otherUIConf.content[1].value = preferOpus;
        otherUIConf.content[2].value = liveStreamQualityOptions.find((o: any) => o.value === liveStreamQuality);
        otherUIConf.content[3].value = enableAutoplayOnConnect;
        otherUIConf.content[4].options = [
          {
            value: Constants.RESET_PLAYER_ON_DISCONNECT_POLICIES.ALL_DISCONNECTED,
            label: ytcr.getI18n('YTCR_RESET_PLAYER_ON_DISCONNECT_ALWAYS')
          },
          {
            value: Constants.RESET_PLAYER_ON_DISCONNECT_POLICIES.ALL_EXPLICITLY_DISCONNECTED,
            label: ytcr.getI18n('YTCR_RESET_PLAYER_ON_DISCONNECT_EXPLICIT')
          }
        ];
        otherUIConf.content[4].value = otherUIConf.content[4].options.find((o: any) => o.value === resetPlayerOnDisconnect);
        otherUIConf.content[5].value = debug;

        let connectionStatus;
        if (!receiverRunning) {
          connectionStatus = ytcr.getI18n('YTCR_IDLE_NOT_RUNNING');
        }
        else if (this.#hasConnectedSenders()) {
          const senders = this.#receiver.getConnectedSenders();
          if (senders.length > 1) {
            connectionStatus = ytcr.getI18n('YTCR_CONNECTED_MULTIPLE', senders[0].name, senders.length - 1);
          }
          else {
            connectionStatus = ytcr.getI18n('YTCR_CONNECTED', senders[0].name);
          }
        }
        else {
          connectionStatus = ytcr.getI18n('YTCR_IDLE');
        }
        connectionUIConf.label = ytcr.getI18n('YTCR_CONNECTION', connectionStatus);

        defer.resolve(uiconf);
      })
      .fail((error: any) => {
        this.#logger.error('[ytcr] Failed to retrieve YouTube Cast Receiver plugin configuration: ', error);
        defer.reject(error);
      });

    return defer.promise;
  }

  onVolumioStart() {
    const configFile = this.#commandRouter.pluginManager.getConfigurationFile(this.#context, 'config.json');
    this.#config = new vconf();
    this.#config.loadFile(configFile);
    return libQ.resolve();
  }

  onStart() {
    const defer = libQ.defer();

    ytcr.init(this.#context, this.#config);

    this.#volumeControl = new VolumeControl(this.#commandRouter, this.#logger);

    const playerConfig = {
      mpd: this.#getMpdConfig(),
      volumeControl: this.#volumeControl,
      videoLoader: new VideoLoader(this.#logger),
      prefetch: ytcr.getConfigValue('prefetch', true)
    };
    this.#player = new MPDPlayer(playerConfig);

    const bindToIf = ytcr.getConfigValue('bindToIf', '');
    const receiverOptions: YouTubeCastReceiverOptions = {
      dial: {
        port: ytcr.getConfigValue('port', 8098),
        bindToInterfaces: utils.hasNetworkInterface(bindToIf) ? [ bindToIf ] : undefined
      },
      app: {
        enableAutoplayOnConnect: ytcr.getConfigValue('enableAutoplayOnConnect', true),
        resetPlayerOnDisconnectPolicy: ytcr.getConfigValue('resetPlayerOnDisconnect', Constants.RESET_PLAYER_ON_DISCONNECT_POLICIES.ALL_DISCONNECTED)
      },
      dataStore: this.#dataStore,
      logger: this.#logger,
      logLevel: ytcr.getConfigValue('debug', false) ? Constants.LOG_LEVELS.DEBUG : Constants.LOG_LEVELS.INFO
    };
    const deviceInfo = ytcr.getDeviceInfo();
    if (deviceInfo.name) {
      receiverOptions.device = {
        name: deviceInfo.name
      };
    }
    const receiver = this.#receiver = new YouTubeCastReceiver(this.#player, receiverOptions);

    receiver.on('senderConnect', (sender: Sender) => {
      this.#logger.info('[ytcr] ***** Sender connected *****');
      ytcr.toast('success', ytcr.getI18n('YTCR_CONNECTED', sender.name));
      this.refreshUIConfig();
    });

    receiver.on('senderDisconnect', (sender: Sender) => {
      this.#logger.info('[ytcr] ***** Sender disconnected *****');
      ytcr.toast('warning', ytcr.getI18n('YTCR_DISCONNECTED', sender.name));
      this.refreshUIConfig();
    });

    this.#player.on('action', async (action: ActionEvent) => {
      if (action.name === 'play' && !this.isCurrentService()) {
        this.#logger.debug('[ytcr] \'play\' command received while not being the current service.');
        // Stop any playback by the currently active service
        this.#logger.debug('[ytcr] Stopping playback by current service...');
        try {
          await utils.kewToJSPromise(this.#commandRouter.volumioStop());
        }
        catch (error) {
          this.#logger.debug('[ytcr] An error occurred while stopping playback by current service: ', error);
          this.#logger.debug('[ytcr] Continuing anyway...');
        }
        // Unset any volatile state of currently active service
        const sm = ytcr.getStateMachine();
        if (sm.isVolatile) {
          sm.unSetVolatile(); // Why isn't this async?!
        }
        this.#logger.debug('[ytcr] Setting ourselves as the current service...');
        this.setVolatile();
        this.pushIdleState();
        // Update volume on sender apps
        await this.#player.notifyExternalStateChange();
      }
      else if (action.name === 'setVolume' && !this.isCurrentService()) {
        this.#logger.debug('[ytcr] setVolume command received, but we are not the current service. Putting player to sleep...');
        this.#player.sleep();
      }
    });

    // Listen for changes in volume on Volumio's end
    this.#volumeControl.registerVolumioVolumeChangeListener(async (volumioVol: VolumioVolume) => {
      const volume = {
        level: volumioVol.vol,
        muted: volumioVol.mute
      };
      if (this.isCurrentService() && this.#hasConnectedSenders()) {
        // SetVolume() will trigger volumioupdatevolume() which will trigger the statemachine's
        // PushState() - but old volatile state with outdated info will be used.
        // So we push the latest state here to refresh the old volatile state.
        this.#logger.debug('[ytcr] Captured change in Volumio\'s volume:', volumioVol);
        await this.pushState();
        await this.#volumeControl.setVolume(volume, true);
        await this.pushState(); // Do it once more
        await this.#player.notifyExternalStateChange();
      }
      else {
        // Even if not current service, we keep track of the updated volume
        await this.#volumeControl.setVolume(volume, true);
      }
    });

    this.#player.on('state', async (states: { current: PlayerState, previous: PlayerState }) => {
      if (this.isCurrentService()) {
        const state = states.current;
        this.#logger.debug('[ytcr] Received state change event from MPDPlayer:', state);
        if (state.status === Constants.PLAYER_STATUSES.STOPPED || state.status === Constants.PLAYER_STATUSES.IDLE) {
          this.#player.sleep();
          if (state.status === Constants.PLAYER_STATUSES.STOPPED && this.#player.queue.videoIds.length > 0) {
            // If queue is not empty, it is possible that we are just moving to another song. In this case, we don't push
            // Idle state to avoid ugly flickering of the screen caused by the temporary Idle state.
            const currentVolumioState = ytcr.getStateMachine().getState() as VolumioState;
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

    this.#player.on('error', (error: MPDPlayerError) => {
      ytcr.toast('error', error.message);
    });

    receiver.start().then(async () => {
      await this.#volumeControl.init();
      await this.#player.init();
      this.#logger.debug('[ytcr] Receiver started with options:', receiverOptions);
      this.#nowPlayingMetadataProvider = new YTCRNowPlayingMetadataProvider(this.#player, this.#logger);
      defer.resolve();
    })
      .catch((error: any) => {
        this.#logger.error('[ytcr] Failed to start plugin:', error);
        if (receiver.status === Constants.STATUSES.RUNNING) {
          receiver.stop();
        }
        else {
          ytcr.toast('error', ytcr.getI18n('YTCR_RECEIVER_START_ERR', error.message || error));
        }
        // Still resolve, in case error is caused by wrong setting (e.g. conflicting port).
        defer.resolve();
      });


    return defer.promise;
  }

  #getMpdConfig() {
    return {
      path: '/run/mpd/socket'
    };
  }

  #hasConnectedSenders(): boolean {
    return this.#receiver?.getConnectedSenders().length > 0 || false;
  }

  configSaveConnection(data: any) {
    const oldPort = ytcr.getConfigValue('port', 8098);
    const port = parseInt(data['port'], 10);
    if (port < 1024 || port > 65353) {
      ytcr.toast('error', ytcr.getI18n('YTCR_INVALID_PORT'));
      return;
    }
    const oldBindToIf = ytcr.getConfigValue('bindToIf', '');
    const bindToIf = data['bindToIf'].value;

    if (oldPort !== port || oldBindToIf !== bindToIf) {
      this.#checkSendersAndPromptBeforeRestart(
        this.configConfirmSaveConnection.bind(this, { port, bindToIf }),
        {
          'endpoint': 'music_service/ytcr',
          'method': 'configConfirmSaveConnection',
          'data': { port, bindToIf }
        }
      );
    }
    else {
      ytcr.toast('success', ytcr.getI18n('YTCR_SETTINGS_SAVED'));
    }
  }

  configConfirmSaveConnection(data: any) {
    this.#config.set('port', data['port']);
    this.#config.set('bindToIf', data['bindToIf']);
    this.restart().then(() => {
      this.refreshUIConfig();
      ytcr.toast('success', ytcr.getI18n('YTCR_RESTARTED'));
    });
  }

  configSaveI18n(data: any) {
    const oldRegion = ytcr.getConfigValue('region');
    const oldLanguage = ytcr.getConfigValue('language');
    const region = data.region.value;
    const language = data.language.value;

    if (oldRegion !== region || oldLanguage !== language) {
      ytcr.setConfigValue('region', region);
      ytcr.setConfigValue('language', language);

      if (this.#player) {
        this.#player.videoLoader.refreshI18nConfig();
      }
    }

    ytcr.toast('success', ytcr.getI18n('YTCR_SETTINGS_SAVED'));
  }

  async configSaveOther(data: any) {
    this.#config.set('prefetch', data['prefetch']);
    this.#config.set('preferOpus', data['preferOpus']);
    this.#config.set('liveStreamQuality', data['liveStreamQuality'].value);
    this.#config.set('enableAutoplayOnConnect', data['enableAutoplayOnConnect']);
    this.#config.set('resetPlayerOnDisconnect', data['resetPlayerOnDisconnect'].value);
    this.#config.set('debug', data['debug']);

    if (this.#receiver) {
      this.#receiver.setLogLevel(data['debug'] ? Constants.LOG_LEVELS.DEBUG : Constants.LOG_LEVELS.INFO);
      this.#receiver.enableAutoplayOnConnect(data['enableAutoplayOnConnect']);
      this.#receiver.setResetPlayerOnDisconnectPolicy(data['resetPlayerOnDisconnect'].value);
    }

    if (this.#player) {
      await this.#player.enablePrefetch(data['prefetch']);
    }

    ytcr.toast('success', ytcr.getI18n('YTCR_SETTINGS_SAVED'));
  }

  configClearDataStore() {
    this.#checkSendersAndPromptBeforeRestart(
      this.configConfirmClearDataStore.bind(this),
      {
        'endpoint': 'music_service/ytcr',
        'method': 'configConfirmClearDataStore'
      }
    );
  }

  configConfirmClearDataStore() {
    this.#dataStore.clear();
    this.restart().then(() => {
      this.refreshUIConfig();
      ytcr.toast('success', ytcr.getI18n('YTCR_RESTARTED'));
    });
  }

  #checkSendersAndPromptBeforeRestart(onCheckPass: () => void, modalOnConfirmPayload: { endpoint: string, method: string, data?: Record<string, any> }) {
    if (this.#hasConnectedSenders()) {
      const modalData: any = {
        title: ytcr.getI18n('YTCR_CONFIGURATION'),
        size: 'lg',
        buttons: [
          {
            name: ytcr.getI18n('YTCR_NO'),
            class: 'btn btn-warning'
          },
          {
            name: ytcr.getI18n('YTCR_YES'),
            class: 'btn btn-info',
            emit: 'callMethod',
            payload: modalOnConfirmPayload
          }
        ]
      };
      const senders = this.#receiver.getConnectedSenders();
      if (senders.length > 1) {
        modalData.message = ytcr.getI18n('YTCR_CONF_RESTART_CONFIRM_M', senders[0].name, senders.length - 1);
      }
      else {
        modalData.message = ytcr.getI18n('YTCR_CONF_RESTART_CONFIRM', senders[0].name);
      }
      this.#commandRouter.broadcastMessage('openModal', modalData);
    }
    else {
      onCheckPass();
    }
  }

  refreshUIConfig() {
    this.#commandRouter.getUIConfigOnPlugin('music_service', 'ytcr', {}).then((config: any) => {
      this.#commandRouter.broadcastMessage('pushUiConfig', config);
    });
  }

  onStop() {
    const defer = libQ.defer();

    this.#receiver.removeAllListeners();
    this.#receiver.stop().then(async () => {
      this.#logger.debug('[ytcr] Receiver stopped');
      this.unsetVolatile();
      this.#volumeControl.unregisterVolumioVolumeChangeListener();
      await this.#player.destroy();
      ytcr.reset();
      this.#nowPlayingMetadataProvider = null;
      defer.resolve();
    })
      .catch((error) => {
        this.#logger.error('[ytcr] Failed to stop receiver:', error);
        defer.reject(error);
      });

    return defer.promise;
  }

  restart() {
    return this.onStop().then(() => {
      return this.onStart();
    });
  }

  getConfigurationFiles(): string[] {
    return [ 'config.json' ];
  }

  setVolatile() {
    if (!this.#volatileCallback) {
      this.#volatileCallback = this.onUnsetVolatile.bind(this);
    }
    if (!this.isCurrentService()) {
      ytcr.getStateMachine().setVolatile({
        service: this.#serviceName,
        callback: this.#volatileCallback
      });
      ytcr.getMpdPlugin().ignoreUpdate(true);
      ytcr.getStateMachine().setConsumeUpdateService(undefined);
    }
  }

  unsetVolatile() {
    ytcr.getStateMachine().unSetVolatile();
  }

  async onUnsetVolatile() {
    this.pushIdleState();
    ytcr.getMpdPlugin().ignoreUpdate(false);
    return this.#player.stop();
  }

  pushIdleState() {
    this.#logger.debug('[ytcr] Pushing idle state...');
    // Need to first push empty state with pause status first so the empty volatileState gets registered
    // By statemachine.
    this.#commandRouter.servicePushState(Object.assign(IDLE_STATE, { status: 'pause' }), this.#serviceName);
    // Then push empty state with stop status
    this.#commandRouter.servicePushState(IDLE_STATE, this.#serviceName);
  }

  async pushState(state?: VolumioState) {
    const volumioState = state || await this.#player.getVolumioState();
    if (volumioState) {
      this.#logger.debug('[ytcr] pushState(): ', volumioState);
      this.#commandRouter.servicePushState(volumioState, this.#serviceName);
    }
  }

  isCurrentService() {
    // Check what is the current Volumio service
    const currentstate = this.#commandRouter.volumioGetState();
    if (currentstate !== undefined && currentstate.service !== undefined && currentstate.service !== this.#serviceName) {
      return false;
    }
    return true;
  }

  stop() {
    return utils.jsPromiseToKew(this.#player.stop());
  }

  play() {
    return utils.jsPromiseToKew(this.#player.resume());
  }

  pause() {
    return utils.jsPromiseToKew(this.#player.pause());
  }

  resume() {
    return utils.jsPromiseToKew(this.#player.resume());
  }

  seek(position: number) {
    return utils.jsPromiseToKew(this.#player.seek(Math.round(position / 1000)));
  }

  next() {
    return utils.jsPromiseToKew(this.#player.next());
  }

  previous() {
    if (this.#previousTrackTimer) {
      clearTimeout(this.#previousTrackTimer);
      this.#previousTrackTimer = null;
      return utils.jsPromiseToKew(this.#player.previous());
    }
    if (this.#player.status === Constants.PLAYER_STATUSES.PLAYING ||
      this.#player.status === Constants.PLAYER_STATUSES.PAUSED) {
      this.#previousTrackTimer = setTimeout(() => {
        this.#previousTrackTimer = null;
      }, 3000);
      return this.#player.seek(0);
    }
    return utils.jsPromiseToKew(this.#player.previous());
  }

  getNowPlayingMetadataProvider() {
    return this.#nowPlayingMetadataProvider;
  }
}

export = ControllerYTCR;
