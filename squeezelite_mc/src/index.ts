// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import vconf from 'v-conf';

import os from 'os';
import sm from './lib/SqueezeliteMCContext';
import { basicPlayerStartupParamsToSqueezeliteOpts, getNetworkInterfaces, jsPromiseToKew, kewToJSPromise, PlaybackTimer } from './lib/Util';
import { getAlsaFormats, getSqueezeliteServiceStatus, initSqueezeliteService, stopSqueezeliteService, SystemError, SystemErrorCode } from './lib/System';
import PlayerStatusMonitor from './lib/PlayerStatusMonitor';
import serverDiscovery from 'lms-discovery';
import CommandDispatcher from './lib/CommandDispatcher';
import Proxy, { ProxyStatus } from './lib/Proxy';
import PlayerFinder, { PlayerFinderStatus } from './lib/PlayerFinder';
import equal from 'fast-deep-equal';
import { ServerCredentials } from './lib/types/Server';
import Player, { AlsaConfig, BasicPlayerStartupParams, PlayerRunState, PlayerStartupParams, PlayerStatus } from './lib/types/Player';
import { BasicPlayerConfig, ManualPlayerConfig, PlayerConfig } from './lib/Config';

interface VolumioState {
  service: string;
  status: 'play' | 'pause' | 'stop';
  title?: string;
  artist?: string;
  album?: string;
  albumart?: string;
  uri: '';
  trackType?: string;
  seek?: number;
  duration?: number;
  samplerate?: string;
  bitdepth?: string;
  bitrate?: string;
  channels?: number;
  volume?: number;
  mute?: boolean;
  isStreaming?: boolean;
  repeat?: boolean;
  repeatSingle?: boolean;
  random?: boolean;
}

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

const LMS_TRACK_TYPE_TO_VOLUMIO: Record<string, string> = {
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
  #serviceName: string;
  #context: any;
  #config: any;
  #commandRouter: any;
  #playerRunState: PlayerRunState | undefined;
  #playerStatusMonitor: PlayerStatusMonitor | null;
  #playbackTimer: PlaybackTimer | null;
  #lastState: VolumioState | null;
  #volatileCallback: (() => void) | null;
  #volumioSetVolumeCallback: ((volume: { vol: number }) => void) | null;
  #commandDispatcher: CommandDispatcher | null;
  #proxy: Proxy | null;
  #playerFinder: PlayerFinder | null;
  #volumioVolume: number | undefined;
  #playerConfigChangeDelayTimer: NodeJS.Timeout | null;
  #playerConfigChangeHandler: (() => void) | null;
  #playerStartupParams: PlayerStartupParams | null;
  #previousDoubleClickTimeout: NodeJS.Timeout | null;

  constructor(context: any) {
    this.#context = context;
    this.#commandRouter = this.#context.coreCommand;
    this.#serviceName = 'squeezelite_mc';
    this.#playerStatusMonitor = null;
    this.#playbackTimer = null;
    this.#lastState = null;
    this.#volatileCallback = null;
    this.#volumioSetVolumeCallback = null;
    this.#commandDispatcher = null;
    this.#playerFinder = null;
    this.#playerConfigChangeDelayTimer = null;
    this.#playerConfigChangeHandler = null;
    this.#playerStartupParams = null;
    this.#previousDoubleClickTimeout = null;
  }

  getUIConfig() {
    return jsPromiseToKew(this.#doGetUIConfig())
      .fail((error: any) => {
        sm.getLogger().error(`[squeezelite_mc] getUIConfig(): Cannot populate configuration - ${error}`);
        throw error;
      });
  }

  async #doGetUIConfig() {
    const langCode = this.#commandRouter.sharedVars.get('language_code');
    const uiconf = await kewToJSPromise(this.#commandRouter.i18nJson(
      `${__dirname}/i18n/strings_${langCode}.json`,
      `${__dirname}/i18n/strings_en.json`,
      `${__dirname}/UIConfig.json`));
    const status = await getSqueezeliteServiceStatus();

    const statusUIConf = uiconf.sections[0];
    const squeezeliteBasicUIConf = uiconf.sections[1];
    const squeezeliteManualUIConf = uiconf.sections[2];
    const serverCredentialsUIConf = uiconf.sections[3];

    const playerConfig = this.#getPlayerConfig();
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
    if (status === 'active' && this.#playerRunState !== PlayerRunState.ConfigRequireRestart) {
      const player = this.#playerStatusMonitor ? this.#playerStatusMonitor.getPlayer() : null;
      statusDesc = player ?
        sm.getI18n('SQUEEZELITE_MC_DESC_STATUS_CONNECTED', player.server.name, player.server.ip) :
        sm.getI18n('SQUEEZELITE_MC_DESC_STATUS_STARTED');
    }
    else if (this.#playerRunState === PlayerRunState.StartError) {
      statusDesc = sm.getI18n('SQUEEZELITE_MC_DESC_STATUS_ERR_START');
      statusButtonType = 'start';
    }
    else if (this.#playerRunState === PlayerRunState.ConfigRequireRestart) {
      statusDesc = (status === 'active') ?
        sm.getI18n('SQUEEZELITE_MC_DESC_STATUS_ERR_RESTART_CONFIG') :
        sm.getI18n('SQUEEZELITE_MC_DESC_STATUS_ERR_START');
      statusButtonType = (status === 'active') ? 'restart' : 'start';
    }
    else if (this.#playerRunState === PlayerRunState.ConfigRequireRevalidate) {
      statusDesc = sm.getI18n('SQUEEZELITE_MC_DESC_STATUS_ERR_REVALIDATE');
      statusButtonType = 'revalidate';
    }
    else {
      statusDesc = sm.getI18n('SQUEEZELITE_MC_DESC_STATUS_STOPPED');
      statusButtonType = 'start';
    }
    let statusButton: any = {
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
        statusButton.label = sm.getI18n('SQUEEZELITE_MC_BTN_START');
        break;
      case 'restart':
        statusButton.label = sm.getI18n('SQUEEZELITE_MC_BTN_RESTART');
        break;
      case 'revalidate':
        statusButton.label = sm.getI18n('SQUEEZELITE_MC_BTN_REVALIDATE');
        break;
      default:
        statusButton = null;
    }
    statusUIConf.description = statusDesc;
    if (statusButton) {
      statusUIConf.content = [ statusButton ];
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
          squeezeliteBasicUIConf.content[1].value.label = sm.getI18n('SQUEEZELITE_MC_PLAYER_NAME_CUSTOM');
          break;
        default: // 'hostname'
          squeezeliteBasicUIConf.content[1].value.label = sm.getI18n('SQUEEZELITE_MC_PLAYER_NAME_HOSTNAME');
      }
      squeezeliteBasicUIConf.content[2].value = playerName;

      // DSD playback
      squeezeliteBasicUIConf.content[3].value = {
        value: dsdPlayback
      };
      switch (dsdPlayback) {
        case 'pcm':
          squeezeliteBasicUIConf.content[3].value.label = sm.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_PCM');
          break;
        case 'dop':
          squeezeliteBasicUIConf.content[3].value.label = sm.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_DOP');
          break;
        case 'DSD_U8':
          squeezeliteBasicUIConf.content[3].value.label = sm.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_U8');
          break;
        case 'DSD_U16_LE':
          squeezeliteBasicUIConf.content[3].value.label = sm.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_U16_LE');
          break;
        case 'DSD_U16_BE':
          squeezeliteBasicUIConf.content[3].value.label = sm.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_U16_BE');
          break;
        case 'DSD_U32_LE':
          squeezeliteBasicUIConf.content[3].value.label = sm.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_U32_LE');
          break;
        case 'DSD_U32_BE':
          squeezeliteBasicUIConf.content[3].value.label = sm.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_U32_BE');
          break;
        default: // 'auto'
          squeezeliteBasicUIConf.content[3].value.label = sm.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_AUTO');
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
        const defaultStartupParams = await this.#getPlayerStartupParams(true);
        suggestedStartupOptions = basicPlayerStartupParamsToSqueezeliteOpts(defaultStartupParams);
      }
      catch (error) {
        if (error instanceof SystemError && error.code === SystemErrorCode.DeviceBusy) {
          squeezeliteManualUIConf.description = sm.getI18n('SQUEEZELITE_MC_ERR_SUGGESTED_STARTUP_OPTS_DEV_BUSY');
        }
        else {
          squeezeliteManualUIConf.description = sm.getI18n('SQUEEZELITE_MC_ERR_SUGGESTED_STARTUP_OPTS');
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
    const serverCredentials = sm.getConfigValue('serverCredentials');
    const discoveredServers = serverDiscovery.getAllDiscovered();
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
          label: sm.getI18n('SQUEEZELITE_MC_USERNAME'),
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
          label: sm.getI18n('SQUEEZELITE_MC_PASSWORD'),
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
      serverCredentialsUIConf.description = sm.getI18n('SQUEEZELITE_MC_NO_SERVERS');
      delete serverCredentialsUIConf.content[0];
      delete serverCredentialsUIConf.saveButton;
    }

    return uiconf;
  }

  getConfigurationFiles() {
    return [ 'config.json' ];
  }

  /**
   * Plugin lifecycle
   */

  onVolumioStart() {
    const configFile = this.#commandRouter.pluginManager.getConfigurationFile(this.#context, 'config.json');
    this.#config = new vconf();
    this.#config.loadFile(configFile);
    return libQ.resolve(true);
  }

  onStart() {
    const defer = libQ.defer();

    sm.init(this.#context, this.#config);
    this.#lastState = null;
    this.#playbackTimer = new PlaybackTimer();

    // Listen for volume change in Volumio
    if (!this.#volumioSetVolumeCallback) {
      this.#volumioSetVolumeCallback = (volume) => {
        this.#volumioVolume = volume.vol;
        if (this.#playbackTimer && this.#commandDispatcher) {
          /**
           * Volumioupdatevolume() triggers #pushState() in statemachine after calling
           * this callback - but volatile state with old 'seek' value (from last push) will be used.
           * this is undesirable if current status is 'play', so we update the statemachine's volatile state
           * with seek value obtained from our internal playbackTimer.
           */
          sm.getLogger().info(`[squeezelite_mc] Setting Squeezelite volume to ${volume.vol}`);
          if (this.#lastState && this.#lastState.status === 'play' && this.#lastState.seek !== undefined) {
            this.#pushState({ ...this.#lastState, seek: this.#playbackTimer.getSeek() });
          }
          this.#commandDispatcher.sendVolume(this.#volumioVolume);
        }
      };
      this.#commandRouter.addCallback('volumioupdatevolume', this.#volumioSetVolumeCallback);
    }

    this.#proxy = new Proxy(sm.getConfigValue('serverCredentials'));
    this.#proxy.start()
      .catch(() => {
        sm.getLogger().warn('[squeezelite_mc] Unable to start proxy server - requests for artwork on password-protected servers will be denied');
      })
      .then(() => this.#getVolumioVolume())
      .then((volume) => {
        this.#volumioVolume = volume;
        return this.#initAndStartPlayerFinder();
      })
      .then(() => {
        this.#playerConfigChangeHandler = this.#handlePlayerConfigChange.bind(this);
        this.#commandRouter.sharedVars.registerCallback('alsa.outputdevice', this.#playerConfigChangeHandler);
        this.#commandRouter.sharedVars.registerCallback('alsa.outputdevicemixer', this.#playerConfigChangeHandler);
        sm.getMpdPlugin().config.registerCallback('dop', this.#playerConfigChangeHandler);
      })
      .then(() => this.#getPlayerStartupParams())
      .then((config) => {
        this.#playerStartupParams = config;
        sm.getLogger().info(`[squeezelite_mc] Starting Squeezelite service with params: ${JSON.stringify(this.#playerStartupParams)}`);
        sm.toast('info', sm.getI18n('SQUEEZELITE_MC_STARTING'));
        return initSqueezeliteService(config);
      })
      .then(() => {
        sm.toast('success', sm.getI18n('SQUEEZELITE_MC_STARTED'));
        this.#playerRunState = PlayerRunState.Normal;
        defer.resolve();
      })
      .catch((error) => {
        this.#playerRunState = PlayerRunState.StartError;
        if (error instanceof SystemError && error.code === SystemErrorCode.DeviceBusy) {
          sm.toast('error', sm.getI18n('SQUEEZELITE_MC_ERR_START_DEV_BUSY'));
          defer.resolve();
        }
        else {
          sm.toast('error', sm.getErrorMessage(sm.getI18n('SQUEEZELITE_MC_ERR_START'), error, false));
          defer.reject(error);
        }
      });

    return defer.promise;
  }

  onStop() {
    const defer = libQ.defer();

    this.#playerStartupParams = null;
    this.#commandDispatcher = null;
    if (this.#playbackTimer) {
      this.#playbackTimer.stop();
    }

    // Hack to remove volume change listener
    const callbacks = this.#commandRouter.callbacks['volumioupdatevolume'];
    if (callbacks && Array.isArray(callbacks)) {
      const cbIndex = callbacks.indexOf(this.#volumioSetVolumeCallback);
      if (cbIndex >= 0) {
        callbacks.splice(cbIndex, 1);
      }
    }

    // Hack to remove player config change handler
    if (this.#playerConfigChangeHandler) {
      this.#commandRouter.sharedVars.callbacks.delete('alsa.outputdevice', this.#playerConfigChangeHandler);
      this.#commandRouter.sharedVars.callbacks.delete('alsa.outputdevicemixer', this.#playerConfigChangeHandler);
      sm.getMpdPlugin().config.callbacks.delete('dop', this.#playerConfigChangeHandler);
      this.#playerConfigChangeHandler = null;
    }

    if (this.#proxy && this.#proxy.getStatus() !== ProxyStatus.Stopped) {
      this.#proxy.stop();
    }

    const promises = [
      this.#clearPlayerStatusMonitor(),
      this.#clearPlayerFinder(),
      stopSqueezeliteService()
    ];

    sm.toast('info', sm.getI18n('SQUEEZELITE_MC_STOPPING'));

    Promise.all(promises).then(() => {
      sm.toast('success', sm.getI18n('SQUEEZELITE_MC_STOPPED'));
      sm.reset();
      defer.resolve();
    })
      .catch((error) => {
        sm.toast('error', sm.getErrorMessage(sm.getI18n('SQUEEZELITE_MC_ERR_STOP'), error, false));
        defer.reject(error);
      });

    return defer.promise;
  }

  /**
   * Workflow logic
   */

  async #initAndStartPlayerFinder() {
    if (!this.#playerFinder) {
      this.#playerFinder = new PlayerFinder();

      this.#playerFinder.on('found', async (data) => {
        const serverCredentials = sm.getConfigValue('serverCredentials');
        const player = data[0];
        sm.getLogger().info(`[squeezelite_mc] Player found: ${JSON.stringify(player)}`);
        this.#commandDispatcher = new CommandDispatcher(player, serverCredentials);

        // Set Squeezelite's volume to Volumio's
        if (this.#volumioVolume !== undefined) {
          await this.#commandDispatcher.sendVolume(this.#volumioVolume);
        }

        await this.#applyFadeOnPauseResume();

        await this.#clearPlayerStatusMonitor(); // Ensure there is only one monitor instance
        const playerStatusMonitor = new PlayerStatusMonitor(player, serverCredentials);
        this.#playerStatusMonitor = playerStatusMonitor;
        playerStatusMonitor.on('update', this.#handlePlayerStatusUpdate.bind(this));
        playerStatusMonitor.on('disconnect', this.#handlePlayerDisconnect.bind(this));
        await playerStatusMonitor.start();

        sm.toast('info', sm.getI18n('SQUEEZELITE_MC_CONNECTED', player.server.name, player.server.ip));
      });

      this.#playerFinder.on('lost', this.#handlePlayerDisconnect.bind(this));
      this.#playerFinder.on('error', this.#handlePlayerDiscoveryError.bind(this));
    }

    if (this.#playerFinder.getStatus() === PlayerFinderStatus.Stopped) {
      const networkAddresses = Object.values(getNetworkInterfaces());
      const ipAddresses: string[] = [];
      const macAddresses: string[] = [];
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
      return this.#playerFinder.start({
        serverCredentials: sm.getConfigValue('serverCredentials'),
        eventFilter: { // Only notify when found or lost player matches Volumio device IP and player ID matches mac addr
          playerIP: ipAddresses,
          playerId: macAddresses
        }
      });
    }
  }

  #applyFadeOnPauseResume() {
    const { fadeOnPauseResume } = this.#getPlayerConfig();
    if (this.#commandDispatcher && fadeOnPauseResume) {
      /**
       * Set LMS Player Settings -> Audio -> Volume Control to 'Output level is fixed at 100%'.
       * This is to avoid Squeezelite from zero-ing out the volume on pause, which obviously
       * causes problems with native DSD playback. Also, after Squeezelite mutes the volume on pause,
       * playing from another Volumio source will not restore the volume to its previous level (i.e.
       * it stays muted).
       */
      return this.#commandDispatcher.sendPref('digitalVolumeControl', 0);
    }
  }

  async #clearPlayerStatusMonitor() {
    if (this.#playerStatusMonitor) {
      await this.#playerStatusMonitor.stop();
      this.#playerStatusMonitor.removeAllListeners();
      this.#playerStatusMonitor = null;
    }
  }

  async #clearPlayerFinder() {
    if (this.#playerFinder) {
      await this.#playerFinder.stop();
      this.#playerFinder.removeAllListeners();
      this.#playerFinder = null;
    }
  }

  async #handlePlayerDisconnect() {
    if (this.#playerStatusMonitor) {
      const player = this.#playerStatusMonitor.getPlayer();
      sm.toast('info', sm.getI18n('SQUEEZELITE_MC_DISCONNECTED', player.server.name, player.server.ip));
    }
    await this.#clearPlayerStatusMonitor();
    this.#commandDispatcher = null;
    this.#lastState = null;
    if (this.#playbackTimer) {
      this.#playbackTimer.stop();
    }
    if (this.#isCurrentService()) {
      this.unsetVolatile();
    }
  }

  #handlePlayerDiscoveryError(message: string) {
    sm.toast('error', sm.getI18n('SQUEEZELITE_MC_ERR_PLAYER_DISCOVER', message));
  }

  async #handlePlayerStatusUpdate(data: {player: Player; status: PlayerStatus}) {
    const { player, status } = data;
    const isCurrentService = this.#isCurrentService();

    if (!status.currentTrack) {
      if (isCurrentService) {
        this.#pushEmptyState();
      }
      return;
    }

    const track = status.currentTrack;
    const albumartUrl = (() => {
      let url: string | null = null;
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
      if (useProxy && this.#proxy?.getStatus() === ProxyStatus.Started) {
        const volumioIPs = this.#commandRouter.getCachedPAddresses ? this.#commandRouter.getCachedPAddresses() : this.#commandRouter.getCachedIPAddresses();
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

      const proxyPort = this.#proxy?.getAddress()?.port;
      const proxyAddr = proxyPort ? `${proxyIP}:${proxyPort}` : proxyIP;

      const qs = new URLSearchParams({
        server_name: player.server.name,
        url,
        fallback: `http://${proxyIP}/albumart`
      });

      return `http://${proxyAddr}/?${qs.toString()}`;

    })();

    const isStreaming = track.duration === 0 || !status.canSeek;
    const volumioState: VolumioState = {
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
    if (this.#lastState) {
      const isNewSong = this.#lastState.title !== volumioState.title;
      if (isNewSong && track.artworkUrl) {
        setTimeout(() => {
          this.#requestPlayerStatusUpdate();
        }, 3000);
      }
    }
    this.#lastState = volumioState;

    if (!isCurrentService && volumioState.status === 'play') {
      sm.getLogger().info('[squeezelite_mc] \'play\' status received while not being the current service.');
      await this.#stopCurrentServiceAndSetVolatile();
      this.#pushState(volumioState);

      // Squeezelite might not be able to start playing immediately, such as when
      // The previous service has not yet released the audio output device. So we request another
      // Status update after a short while - hopefully Squeezelite will be playing by then.
      setTimeout(() => {
        this.#requestPlayerStatusUpdate();
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
        this.#pushEmptyState();
      }
      else {
        this.#pushState(volumioState);

        if (this.#playbackTimer) {
          // Start or stop internal playbackTimer
          if (!volumioState.isStreaming && volumioState.status === 'play') {
            this.#playbackTimer.start(volumioState.seek);
          }
          else {
            this.#playbackTimer.stop();
          }
        }
      }
    }

    // Set Volumio's volume to Squeezelite's
    if (isCurrentService && this.#volumioVolume !== volumioState.volume) {
      this.#commandRouter.volumiosetvolume(volumioState.volume);
    }
  }

  #pushState(state: VolumioState) {
    sm.getLogger().info(`[squeezelite_mc] #pushState(): ${JSON.stringify(state)}`);
    this.#commandRouter.servicePushState(state, this.#serviceName);
  }

  async #stopCurrentServiceAndSetVolatile() {
    if (this.#isCurrentService()) {
      return;
    }

    const stopCurrentServicePlayback = async () => {
      try {
        const currentService = this.#getCurrentService();
        const statemachine = sm.getStateMachine();
        const isPlaybackByMpd = currentService === 'mpd' || (statemachine.isConsume && statemachine.consumeUpdateService === 'mpd');
        if (isPlaybackByMpd) {
          /**
           * MpdPlugin pushes 'stop' states which do not get ignored by the statemachine even after we have called setVolatile().
           * The statemachine just combines the volatile state with the mpdplugin's 'stop' states and completely messes itself up.
           * We need to tell mpdPlugin to ignore updates after stopping. Note, however, if the current service / state consumption
           * is not handled by mpdPlugin, but similarly pushes states after stopping, then this will also screw up the statemachine...
           */
          sm.getMpdPlugin().ignoreUpdate(true);
        }
        return kewToJSPromise(this.#commandRouter.volumioStop());
      }
      catch (error) {
        sm.getLogger().error(sm.getErrorMessage('[squeezelite_mc] An error occurred while stopping playback by current service:', error));
        sm.getLogger().error('[squeezelite_mc] Continuing anyway...');
      }
    };

    // Stop any playback by the currently active service
    sm.getLogger().info('[squeezelite_mc] Stopping playback by current service...');
    sm.getStateMachine().setConsumeUpdateService(undefined);
    await stopCurrentServicePlayback();

    // Unset any volatile state of currently active service
    const statemachine = sm.getStateMachine();
    if (statemachine.isVolatile) {
      statemachine.unSetVolatile();
    }

    // Set volatile
    sm.getLogger().info('[squeezelite_mc] Setting ourselves as the current service...');
    if (!this.#volatileCallback) {
      this.#volatileCallback = this.onUnsetVolatile.bind(this);
    }
    sm.getStateMachine().setVolatile({
      service: this.#serviceName,
      callback: this.#volatileCallback
    });
    sm.getStateMachine().setConsumeUpdateService(undefined);
  }

  unsetVolatile() {
    sm.getStateMachine().unSetVolatile();
  }

  // Callback that gets called by statemachine when unsetting volatile state
  onUnsetVolatile() {
    this.#pushEmptyState();
    sm.getMpdPlugin().ignoreUpdate(false);

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

  #pushEmptyState() {
    if (this.#playbackTimer) {
      this.#playbackTimer.stop();
    }
    sm.getLogger().info('[squeezelite_mc] Pushing empty state...');
    // Need to first push empty state with pause status first so the empty volatileState gets registered
    // By statemachine.
    this.#commandRouter.servicePushState(Object.assign(EMPTY_STATE, { status: 'pause' }), this.#serviceName);
    // Then push empty state with stop status. Note that the actual state will remain as 'pause', but trying to
    // Work with the logic of the state machine, or lack thereof, is just too much to bear...
    this.#commandRouter.servicePushState(EMPTY_STATE, this.#serviceName);
  }

  #getCurrentService() {
    const currentstate = this.#commandRouter.volumioGetState();
    return (currentstate !== undefined && currentstate.service !== undefined) ? currentstate.service : null;
  }

  #isCurrentService() {
    return this.#getCurrentService() === this.#serviceName;
  }

  #requestPlayerStatusUpdate() {
    if (this.#isCurrentService() && this.#playerStatusMonitor) {
      this.#playerStatusMonitor.requestUpdate();
    }
  }

  #getPlayerConfig(): PlayerConfig {
    const playerConfigType = sm.getConfigValue('playerConfigType');
    const playerConfig = playerConfigType === 'basic' ?
      sm.getConfigValue('basicPlayerConfig') : sm.getConfigValue('manualPlayerConfig');
    const defaultPlayerConfig = playerConfigType === 'basic' ?
      sm.getConfigValue('basicPlayerConfig', true) : sm.getConfigValue('manualPlayerConfig', true);
    return {
      ...defaultPlayerConfig,
      ...playerConfig
    };
  }

  #getAlsaConfig(): AlsaConfig {
    const device: string = this.#commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', 'outputdevice');
    const card = device.indexOf(',') >= 0 ? device.charAt(0) : device;
    const mixerType = this.#commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', 'mixer_type'); // Software / Hardware
    // `mixer` is for squeezelite -V option:
    // - null for 'None' mixer type (use Squeezelite software volume control)
    // - Otherwise, set to same as Volumio (e.g. 'SoftMaster' for 'Software' mixer type)
    const mixer = mixerType !== 'None' ? (() => {
      const mixerDev: string = this.#commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', 'mixer');
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
  }

  async #getPlayerStartupParams(getDefault: true): Promise<BasicPlayerStartupParams>;
  async #getPlayerStartupParams(getDefault?: boolean): Promise<PlayerStartupParams>;
  async #getPlayerStartupParams(getDefault = false): Promise<PlayerStartupParams> {
    const alsaConfig = this.#getAlsaConfig();
    const playerConfigType = sm.getConfigValue('playerConfigType');
    if (playerConfigType === 'basic' || getDefault) {
      const config = sm.getConfigValue('basicPlayerConfig', getDefault);
      // Player name
      let playerName: string;
      if (config.playerNameType === 'custom' && config.playerName) {
        playerName = config.playerName;
      }
      else {
        // Default - use device hostname. Don't rely on Squeezelite to set this, since it sometimes sets its
        // Name to "SqueezeLite", which is not what we want).
        playerName = os.hostname();
      }

      // Alsa
      const { mixerType, card } = alsaConfig;

      // DSD format
      const dsdPlayback = config.dsdPlayback;
      let dsdFormatPromise: Promise<string | null>,
        getBestSupportedDSDFormatCalled = false;
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
        const dop = !!this.#commandRouter.executeOnPlugin('music_service', 'mpd', 'getConfigParam', 'dop');
        if (dop) {
          dsdFormatPromise = Promise.resolve('dop');
        }
        else {
          dsdFormatPromise = this.#getBestSupportedDSDFormat(card);
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
        await this.#getBestSupportedDSDFormat(card, true);
      }

      return {
        type: 'basic',
        playerName,
        dsdFormat,
        ...alsaConfig
      };
    }

    // Manual playerConfigType
    const config = sm.getConfigValue('manualPlayerConfig');
    return {
      type: 'manual',
      startupOptions: config.startupOptions,
      ...alsaConfig
    };
  }

  async #getBestSupportedDSDFormat(card: string, noErr = false) {
    const cachedAlsaFormats = sm.get<Record<string, string[]>>('alsaFormats', {});
    const alsaFormatsPromise = cachedAlsaFormats[card] ? Promise.resolve(cachedAlsaFormats[card]) : getAlsaFormats(card);
    try {
      const alsaFormats = await alsaFormatsPromise;
      if (alsaFormats.length === 0) {
        sm.getLogger().warn(`[squeezelite_mc] No ALSA formats returned for card ${card}`);
        return null;
      }

      cachedAlsaFormats[card] = alsaFormats;
      sm.set('alsaFormats', cachedAlsaFormats);

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
  }

  async #getVolumioVolume() {
    try {
      const volumeData = await kewToJSPromise(this.#commandRouter.volumioretrievevolume());
      return volumeData.vol;
    }
    catch (error) {
      return 0;
    }
  }

  async #revalidatePlayerConfig(options?: { force?: boolean }) {
    let startupParams;
    let startupParamsChanged;
    try {
      sm.toast('info', sm.getI18n('SQUEEZELITE_MC_REVALIDATING'));
      startupParams = await this.#getPlayerStartupParams();
    }
    catch (error) {
      if (error instanceof SystemError && error.code === SystemErrorCode.DeviceBusy) {
        sm.toast('error', sm.getI18n('SQUEEZELITE_MC_ERR_REVALIDATE_DEV_BUSY'));
      }
      else {
        sm.toast('error', sm.getErrorMessage(sm.getI18n('SQUEEZELITE_MC_ERR_REVALIDATE'), error, false));
      }
      this.#playerStartupParams = null;
      this.#playerRunState = PlayerRunState.ConfigRequireRevalidate;
      sm.refreshUIConfig();

      return;
    }

    if (startupParams.type === 'basic') {
      startupParamsChanged = options?.force ||
        !this.#playerStartupParams ||
        this.#playerStartupParams.type !== 'basic' ||
        (this.#playerStartupParams.playerName !== startupParams.playerName ||
          this.#playerStartupParams.card !== startupParams.card ||
          this.#playerStartupParams.mixerType !== startupParams.mixerType ||
          this.#playerStartupParams.mixer !== startupParams.mixer ||
          this.#playerStartupParams.dsdFormat !== startupParams.dsdFormat);
    }
    else { // `manual` startupParams type
      startupParamsChanged = options?.force ||
        !this.#playerStartupParams ||
        this.#playerStartupParams.type !== 'manual' ||
        this.#playerStartupParams.startupOptions !== startupParams.startupOptions;
    }

    if (startupParamsChanged) {
      this.#playerStartupParams = startupParams;
      sm.getLogger().info(`[squeezelite_mc] Restarting Squeezelite service with params: ${JSON.stringify(startupParams)}`);

      try {
        await initSqueezeliteService(startupParams);
        sm.toast('success', sm.getI18n('SQUEEZELITE_MC_RESTARTED_CONFIG'));
        this.#playerRunState = PlayerRunState.Normal;
        sm.refreshUIConfig();
      }
      catch (error) {
        if (error instanceof SystemError && error.code === SystemErrorCode.DeviceBusy) {
          sm.toast('error', sm.getI18n('SQUEEZELITE_MC_ERR_RESTART_DEV_BUSY'));
        }
        else {
          sm.toast('error', sm.getErrorMessage(sm.getI18n('SQUEEZELITE_MC_ERR_RESTART'), error, false));
        }
        this.#playerStartupParams = null;
        this.#playerRunState = PlayerRunState.ConfigRequireRestart;
        sm.refreshUIConfig();
      }
    }
  }

  async #handlePlayerConfigChange() {
    // Volumio can emit multiple change notifications within a short interval.
    // We set a delay timer to avoid calling initSqueezeliteService() multiple times.
    if (this.#playerConfigChangeDelayTimer) {
      clearTimeout(this.#playerConfigChangeDelayTimer);
      this.#playerConfigChangeDelayTimer = null;
    }
    this.#playerConfigChangeDelayTimer = setTimeout(async () => {
      this.#revalidatePlayerConfig();
    }, 1500);
  }

  #resolveOnStatusMode(mode: string, timeout = 2000) {
    if (!this.#playerStatusMonitor) {
      return libQ.resolve(true);
    }
    const monitor = this.#playerStatusMonitor;
    const defer = libQ.defer();
    const updateHandler = (data: any) => {
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
  }

  /**
   * Config functions
   */

  configStartSqueezelite(data: { force?: boolean }) {
    this.#revalidatePlayerConfig(data);
  }

  configSaveServerCredentials(data: Record<string, string> = {}) {
    const credentials: ServerCredentials = {};
    for (const [ fieldName, value ] of Object.entries(data)) {
      let fieldType: string | undefined,
        serverName: string | undefined;
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

    const oldCredentials = sm.getConfigValue('serverCredentials');
    sm.setConfigValue('serverCredentials', credentials);
    if (equal(credentials, oldCredentials)) {
      sm.toast('success', sm.getI18n('SQUEEZELITE_MC_SETTINGS_SAVED'));
    }
    else {
      // Restart components that rely on serverCredentials
      sm.toast('success', sm.getI18n('SQUEEZELITE_MC_APPLY_CONFIG_CHANGE'));
      sm.refreshUIConfig().then(() => {
        if (this.#proxy) {
          this.#proxy.setServerCredentials(credentials);
        }
        this.#clearPlayerStatusMonitor()
          .then(() => this.#clearPlayerFinder())
          .then(() => this.#initAndStartPlayerFinder());
      });
    }
  }

  configSwitchToBasicSqueezeliteSettings() {
    sm.setConfigValue('playerConfigType', 'basic');
    this.#revalidatePlayerConfig({ force: true });
  }

  configSwitchToManualSqueezeliteSettings() {
    sm.setConfigValue('playerConfigType', 'manual');
    this.#revalidatePlayerConfig({ force: true });
  }

  async configSaveBasicSqueezeliteSettings(data: any) {
    const playerNameType = data.playerNameType.value;
    const playerName = data.playerName.trim();
    const dsdPlayback = data.dsdPlayback.value;
    if (playerNameType === 'custom' && playerName === '') {
      sm.toast('error', sm.getI18n('SQUEEZELITE_MC_ERR_PLAYER_NAME'));
      return;
    }

    const oldConfig = sm.getConfigValue('basicPlayerConfig');
    const revalidate =
      oldConfig.playerNameType !== playerNameType ||
      oldConfig.playerName !== playerName ||
      oldConfig.dsdPlayback !== dsdPlayback;

    const newConfig: BasicPlayerConfig = {
      type: 'basic',
      playerNameType,
      playerName,
      dsdPlayback,
      fadeOnPauseResume: data.fadeOnPauseResume
    };
    sm.setConfigValue('basicPlayerConfig', newConfig);

    await this.#applyFadeOnPauseResume();

    if (!revalidate) {
      sm.toast('success', sm.getI18n('SQUEEZELITE_MC_SETTINGS_SAVED'));
    }
    else {
      this.#revalidatePlayerConfig();
    }
  }

  async configSaveManualSqueezeliteSettings(data: any) {
    const startupOptions = data.startupOptions.trim();
    const { startupOptions: oldStartupOptions } = sm.getConfigValue('manualPlayerConfig');

    const newConfig: ManualPlayerConfig = {
      type: 'manual',
      fadeOnPauseResume: data.fadeOnPauseResume,
      startupOptions
    };
    sm.setConfigValue('manualPlayerConfig', newConfig);

    await this.#applyFadeOnPauseResume();

    if (startupOptions === oldStartupOptions) {
      sm.toast('success', sm.getI18n('SQUEEZELITE_MC_SETTINGS_SAVED'));
    }
    else {
      this.#revalidatePlayerConfig();
    }
  }

  /**
   * Volumio playback control functions
   */

  stop() {
    if (this.#commandDispatcher) {
      this.#commandDispatcher.sendStop();
      return this.#resolveOnStatusMode('stop');
    }
    return libQ.resolve(true);
  }

  play() {
    if (this.#commandDispatcher) {
      this.#commandDispatcher.sendPlay();
      return this.#resolveOnStatusMode('play');
    }
    return libQ.resolve(true);
  }

  pause() {
    if (this.#commandDispatcher) {
      this.#commandDispatcher.sendPause();
      return this.#resolveOnStatusMode('pause');
    }
    return libQ.resolve(true);
  }

  resume() {
    if (this.#commandDispatcher) {
      this.#commandDispatcher.sendPlay();
      return this.#resolveOnStatusMode('play');
    }
    return libQ.resolve(true);
  }

  seek(position: number) {
    if (this.#commandDispatcher) {
      return jsPromiseToKew(this.#commandDispatcher.sendSeek(position));
    }
    return libQ.resolve(true);
  }

  next() {
    if (this.#commandDispatcher) {
      return jsPromiseToKew(this.#commandDispatcher.sendNext());
    }
    return libQ.resolve(true);
  }

  previous() {
    if (this.#commandDispatcher) {
      if (this.#previousDoubleClickTimeout) {
        this.#previousDoubleClickTimeout = null;
        return jsPromiseToKew(this.#commandDispatcher.sendPrevious());
      }

      this.#previousDoubleClickTimeout = setTimeout(() => {
        this.#previousDoubleClickTimeout = null;
      }, 3000);
      return this.seek(0);

    }
    return libQ.resolve(true);
  }

  repeat(value: boolean, repeatSingle: boolean) {
    if (this.#commandDispatcher) {
      this.#commandDispatcher.sendRepeat(value ? (repeatSingle ? LMS_REPEAT_CURRENT_SONG : LMS_REPEAT_PLAYLIST) : LMS_REPEAT_OFF);
    }
    return libQ.resolve(true);
  }

  random(value: boolean) {
    if (this.#commandDispatcher) {
      this.#commandDispatcher.sendShuffle(value ? LMS_SHUFFLE_BY_SONG : LMS_SHUFFLE_OFF);
    }
    return libQ.resolve(true);
  }
}

export = ControllerSqueezeliteMC;
