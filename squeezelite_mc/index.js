'use strict';

const path = require('path');
const os = require('os');
global.squeezeliteMCPluginLibRoot = path.resolve(__dirname) + '/lib';

const libQ = require('kew');
const { PlayerStatusMonitor } = require('./lib/monitor');
const { PlayerFinder } = require('./lib/finder');
const { getNetworkInterfaces, kewToJSPromise, jsPromiseToKew, PlaybackTimer } = require('./lib/util');
const { CommandDispatcher } = require('./lib/command');
const { initSqueezeliteService, stopSqueezeliteService, getAlsaFormats, ERR_DEVICE_BUSY, getSqueezeliteServiceStatus } = require('./lib/system');
const { Proxy } = require('./lib/proxy');
const { URLSearchParams } = require('url');
const equal = require('fast-deep-equal');
const serverDiscovery = require('lms-discovery');
const sm = require(squeezeliteMCPluginLibRoot + '/sm');

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

const LMS_TRACK_TYPE_TRANSLATIONS = {
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

const STATUS_NORMAL = 0;
const STATUS_ERR_START = -1;
const STATUS_ERR_REVALIDATE = -2;
const STATUS_ERR_RESTART_CONFIG = -3;

module.exports = ControllerSqueezeliteMC;

function ControllerSqueezeliteMC(context) {
  this.context = context;
  this.commandRouter = this.context.coreCommand;
  this.logger = this.context.logger;
  this.configManager = this.context.configManager;
  this.serviceName = 'squeezelite_mc';
}

ControllerSqueezeliteMC.prototype.getUIConfig = function () {
  const self = this;
  const defer = libQ.defer();

  const lang_code = self.commandRouter.sharedVars.get('language_code');

  self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
    __dirname + '/i18n/strings_en.json',
    __dirname + '/UIConfig.json')
    .then((uiconf) => {
      return jsPromiseToKew(getSqueezeliteServiceStatus()).then((status) => [uiconf, status])
    })
    .then(([uiconf, status]) => {
      const statusUIConf = uiconf.sections[0];
      const squeezeliteUIConf = uiconf.sections[1];
      const serverCredentialsUIConf = uiconf.sections[2];

      /**
       * Status conf
       */
      let statusDesc, statusButtonType;
      if (status === 'active' && this.status !== STATUS_ERR_RESTART_CONFIG) {
        const player = this.playerStatusMonitor ? this.playerStatusMonitor.getPlayer() : null;
        statusDesc = player ? 
          sm.getI18n('SQUEEZELITE_MC_DESC_STATUS_CONNECTED', player.server.name, player.server.ip) :
          sm.getI18n('SQUEEZELITE_MC_DESC_STATUS_STARTED');        
      }
      else if (this.status === STATUS_ERR_START) {
        statusDesc = sm.getI18n('SQUEEZELITE_MC_DESC_STATUS_ERR_START');
        statusButtonType = 'start';
      }
      else if (this.status === STATUS_ERR_RESTART_CONFIG) {
        statusDesc = (status === 'active') ? 
          sm.getI18n('SQUEEZELITE_MC_DESC_STATUS_ERR_RESTART_CONFIG') : 
          sm.getI18n('SQUEEZELITE_MC_DESC_STATUS_ERR_START');
        statusButtonType = (status === 'active') ? 'restart' : 'start';
      }
      else if (this.status === STATUS_ERR_REVALIDATE) {
        statusDesc = sm.getI18n('SQUEEZELITE_MC_DESC_STATUS_ERR_REVALIDATE');
        statusButtonType = 'revalidate';
      }
      else {
        statusDesc = sm.getI18n('SQUEEZELITE_MC_DESC_STATUS_STOPPED');
        statusButtonType = 'start';
      }
      let statusButton = {
        "id": "startSqueezelite",
        "element": "button",
        "onClick": {
          "type": "emit",
          "message": "callMethod",
          "data": {
              "endpoint": "music_service/squeezelite_mc",
              "method": "revalidatePlayerConfig",
              "data": JSON.stringify({
                force: true,
                refreshUIConf: true
              })
          }
        }
      };
      switch(statusButtonType) {
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
        statusUIConf.content = [statusButton];
      }

      /**
       * Squeezelite conf
       */

      // Player name
      const playerNameType = sm.getConfigValue('playerNameType', 'hostname');
      squeezeliteUIConf.content[0].value = {
        value: playerNameType
      };
      switch(playerNameType) {
        case 'custom':
          squeezeliteUIConf.content[0].value.label = sm.getI18n('SQUEEZELITE_MC_PLAYER_NAME_CUSTOM');
          break;
        default: // 'hostname'
        squeezeliteUIConf.content[0].value.label = sm.getI18n('SQUEEZELITE_MC_PLAYER_NAME_HOSTNAME');
      }
      squeezeliteUIConf.content[1].value = sm.getConfigValue('playerName', '');

      // DSD playback
      const dsdPlayback = sm.getConfigValue('dsdPlayback', 'auto');
      squeezeliteUIConf.content[2].value = {
        value: dsdPlayback
      };
      switch(dsdPlayback) {
        case 'pcm':
          squeezeliteUIConf.content[2].value.label = sm.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_PCM');
          break;
        case 'dop':
          squeezeliteUIConf.content[2].value.label = sm.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_DOP');
          break;
        case 'DSD_U8':
          squeezeliteUIConf.content[2].value.label = sm.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_U8');
          break;
        case 'DSD_U16_LE':
          squeezeliteUIConf.content[2].value.label = sm.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_U16_LE');
          break;
        case 'DSD_U16_BE':
          squeezeliteUIConf.content[2].value.label = sm.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_U16_BE');
          break;
        case 'DSD_U32_LE':
          squeezeliteUIConf.content[2].value.label = sm.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_U32_LE');
          break;
        case 'DSD_U32_BE':
          squeezeliteUIConf.content[2].value.label = sm.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_U32_BE');
          break;
        default: // 'auto'
          squeezeliteUIConf.content[2].value.label = sm.getI18n('SQUEEZELITE_MC_DSD_PLAYBACK_AUTO');
      }

      /**
       * Server Credentials conf
       */
      const serverCredentials = sm.getConfigValue('serverCredentials', {}, true);
      const discoveredServers = serverDiscovery.getAllDiscovered();
      discoveredServers.sort((s1, s2) => s1.name.localeCompare(s2.name));
      // Server field
      const serversSelectData = discoveredServers.map((server) => {
        const label = `${server.name} (${server.ip})`;
        return {
          value: server.name,
          label: serverCredentials[server.name] ? label + ' (*)' : label
        };
      });
      // Add servers with assigned credentials but not currently discovered
      Object.keys(serverCredentials).forEach((serverName) => {
        const discovered = discoveredServers.find((server) => server.name === serverName);
        if (!discovered) {
          serversSelectData.push({
            value: serverName,
            label: serverName + ' (*)(x)'
          });
        }
      });
      serverCredentialsUIConf.content[0].options = serversSelectData;
      if (serversSelectData.length > 0) {
        serverCredentialsUIConf.content[0].value = serversSelectData[0] || null;
        // Username and password fields
        serversSelectData.map((select) => select.value).forEach((serverName) => {
          const {username = '', password = ''} = serverCredentials[serverName] || {};
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
      
      defer.resolve(uiconf);
    })
    .fail((error) => {
      sm.getLogger().error('[squeezelite_mc] getUIConfig(): Cannot populate configuration - ' + error);
      defer.reject(new Error());
    });

  return defer.promise;
}

ControllerSqueezeliteMC.prototype.refreshUIConfig = function () {
  return this.commandRouter.getUIConfigOnPlugin('music_service', 'squeezelite_mc', {}).then((config) => {
    this.commandRouter.broadcastMessage('pushUiConfig', config);
  });
}

ControllerSqueezeliteMC.prototype.onVolumioStart = function () {
  const configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
  this.config = new (require('v-conf'))();
  this.config.loadFile(configFile);

  return libQ.resolve();
}

ControllerSqueezeliteMC.prototype.onStart = function () {
  const defer = libQ.defer();

  sm.init(this.context, this.config);
  this.lastState = null;
  this.playbackTimer = new PlaybackTimer();

  // Listen for volume change in Volumio
  if (!this.volumioSetVolumeCallback) {
    this.volumioSetVolumeCallback = (volume) => {
      this.volumioVolume = volume.vol;
      if (this.commandDispatcher) {
        // volumioupdatevolume() triggers pushState() in statemachine after calling 
        // this callback - but volatile state with old 'seek' value (from last push) will be used.
        // This is undesirable if current status is 'play', so we update the statemachine's volatile state
        // with seek value obtained from our internal playbackTimer.
        sm.getLogger().info(`[squeezelite_mc] Setting Squeezelite volume to ${volume.vol}`);
        if (this.lastState && this.lastState.status === 'play' && this.lastState.seek !== undefined) {
          this.pushState({ ...this.lastState, seek: this.playbackTimer.getSeek() });
        }
        this.commandDispatcher.sendVolume(this.volumioVolume);
        //await this.pushState(); // Do it once more
        //await this.player.notifyVolumeChanged();
      }
    };
    this.commandRouter.addCallback('volumioupdatevolume', this.volumioSetVolumeCallback);
  }

  this.proxy = new Proxy(sm.getConfigValue('serverCredentials', {}, true));
  this.proxy.start()
    .catch(() => {
      sm.getLogger().warn(`[squeezelite_mc] Unable to start proxy server - requests for artwork on password-protected servers will be denied`);
    })
    .then(() => this.getVolumioVolume())
    .then((volume) => {
      this.volumioVolume = volume;
      return this.initAndStartPlayerFinder();
    })
    .then(() => {
      this.playerConfigChangeHandler = this.handlePlayerConfigChange.bind(this);
      this.commandRouter.sharedVars.registerCallback('alsa.outputdevice', this.playerConfigChangeHandler);
      this.commandRouter.sharedVars.registerCallback('alsa.outputdevicemixer', this.playerConfigChangeHandler);
      sm.getMpdPlugin().config.registerCallback('dop', this.playerConfigChangeHandler);
    })
    .then(() => this.getPlayerConfig())
    .then((config) => {
      this.playerConfig = config;
      sm.getLogger().info(`[squeezelite_mc] Starting Squeezelite service with config: ${JSON.stringify(this.playerConfig)}`);
      sm.toast('info', sm.getI18n('SQUEEZELITE_MC_STARTING'));
      return initSqueezeliteService(config);
    })
    .then(() => {
      sm.toast('success', sm.getI18n('SQUEEZELITE_MC_STARTED'));
      this.status = STATUS_NORMAL;
      defer.resolve();
    })
    .catch((error) => {
      this.status = STATUS_ERR_START;
      if (error.reason === ERR_DEVICE_BUSY) {
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

ControllerSqueezeliteMC.prototype.onStop = function () {
  const defer = libQ.defer();

  this.playerConfig = null;
  this.commandDispatcher = null;
  this.playbackTimer.stop();

  // Hack to remove volume change listener
  const callbacks = this.commandRouter.callbacks['volumioupdatevolume'];
  if (callbacks && Array.isArray(callbacks)) {
    const cbIndex = callbacks.indexOf(this.volumioSetVolumeCallback);
    if (cbIndex >= 0) {
      callbacks.splice(cbIndex, 1);
    }
  }

  // Hack to remove player config change handler
  if (this.playerConfigChangeHandler) {
    this.commandRouter.sharedVars.callbacks.delete('alsa.outputdevice', this.playerConfigChangeHandler);
    this.commandRouter.sharedVars.callbacks.delete('alsa.outputdevicemixer', this.playerConfigChangeHandler);
    sm.getMpdPlugin().config.callbacks.delete('dop', this.playerConfigChangeHandler);
    this.playerConfigChangeHandler = null;
  }

  if (this.proxy.getStatus() !== Proxy.STOPPED) {
    this.proxy.stop();
  }

  const promises = [
    this.clearPlayerStatusMonitor(),
    this.clearPlayerFinder(),
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

ControllerSqueezeliteMC.prototype.initAndStartPlayerFinder = async function() {
    
  if (!this.playerFinder) {
    const playerFinder = new PlayerFinder();
    this.playerFinder = playerFinder;

    playerFinder.on('found', async (data) => {
      const serverCredentials = sm.getConfigValue('serverCredentials', {}, true);
      const player = data[0];
      sm.getLogger().info(`[squeezelite_mc] Player found: ${JSON.stringify(player)}`);
      this.commandDispatcher = new CommandDispatcher(player, serverCredentials);

      // Set Squeezelite's volume to Volumio's
      await this.commandDispatcher.sendVolume(this.volumioVolume);

      // Disable / enable Squeezelite's digital volume control based on mixer type
      const digitalVolumeControl = this.playerConfig.mixerType === 'None' ? 0 : 1;
      await this.commandDispatcher.sendPref('digitalVolumeControl', digitalVolumeControl);

      await this.clearPlayerStatusMonitor(); // Ensure there is only one monitor instance
      const playerStatusMonitor = new PlayerStatusMonitor(player, serverCredentials);
      this.playerStatusMonitor = playerStatusMonitor;
      playerStatusMonitor.on('update', this.handlePlayerStatusUpdate.bind(this));
      playerStatusMonitor.on('disconnect', this.handlePlayerDisconnect.bind(this));
      await playerStatusMonitor.start();

      sm.toast('info', sm.getI18n('SQUEEZELITE_MC_CONNECTED', player.server.name, player.server.ip));
    });

    playerFinder.on('lost', this.handlePlayerDisconnect.bind(this));
    playerFinder.on('error', this.handlePlayerDiscoveryError.bind(this));
  }

  if (this.playerFinder.getStatus() === PlayerFinder.STOPPED) {
    const networkAddresses = Object.values(getNetworkInterfaces());
    const ipAddresses = [], macAddresses = [];
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
    return this.playerFinder.start({
      serverCredentials: sm.getConfigValue('serverCredentials', {}, true),
      eventFilter: { // Only notify when found or lost player matches Volumio device IP and player ID matches mac addr
        playerIP: ipAddresses,
        playerId: macAddresses
      }
    });
  }
}

ControllerSqueezeliteMC.prototype.clearPlayerStatusMonitor = async function () {
  if (this.playerStatusMonitor) {
    await this.playerStatusMonitor.stop();
    this.playerStatusMonitor = null;
  }
}

ControllerSqueezeliteMC.prototype.clearPlayerFinder = async function () {
  if (this.playerFinder) {
    await this.playerFinder.stop();
    this.playerFinder = null;
  }
}

ControllerSqueezeliteMC.prototype.handlePlayerDisconnect = async function () {
  if (this.playerStatusMonitor) {
    const player = this.playerStatusMonitor.getPlayer();
    sm.toast('info', sm.getI18n('SQUEEZELITE_MC_DISCONNECTED', player.server.name, player.server.ip));
  }
  await this.clearPlayerStatusMonitor();
  this.commandDispatcher = null;
  this.lastState = null;
  this.playbackTimer.stop();
  if (this.isCurrentService()) {
    this.unsetVolatile();
  }
}

ControllerSqueezeliteMC.prototype.handlePlayerDiscoveryError = function (message) {
  sm.toast('error', sm.getI18n('SQUEEZELITE_MC_ERR_PLAYER_DISCOVER', message));
}

ControllerSqueezeliteMC.prototype.handlePlayerStatusUpdate = async function (data) {
  const { player, status } = data;
  const isCurrentService = this.isCurrentService();

  if (!status.playlist_loop) {  // Empty playlist
    if (isCurrentService) {
      this.pushEmptyState();
    }
    return;
  }

  const track = status.playlist_loop[0];
  const albumartUrl = (() => {
    let url = null;
    let useProxy = false;
    if (track.artwork_url) {
      if (track.artwork_url.startsWith('/imageproxy')) {
        url = `http://${player.server.ip}:${player.server.jsonPort}${track.artwork_url}`;
        useProxy = true;
      }
      else {
        url = track.artwork_url;
      }
    }
    else if (track.coverart) {
      url = `http://${player.server.ip}:${player.server.jsonPort}/music/current/cover.jpg?player=${encodeURIComponent(player.id)}&ms=${Date.now()}`;
      useProxy = true;
    }

    if (!url) {
      return '/albumart';
    }

    let proxyIP = null;
    if (useProxy && this.proxy.getStatus() === Proxy.STARTED) {
      const volumioIPs = this.commandRouter.getCachedPAddresses ? this.commandRouter.getCachedPAddresses() : this.commandRouter.getCachedIPAddresses();
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

    const qs = new URLSearchParams({
      server_name: player.server.name,
      url,
      fallback: `http://${proxyIP}/albumart`
    });

    return `http://${proxyIP}:${this.proxy.getAddress().port}/?${qs.toString()}`;

  })();

  const isStreaming = track.duration === 0 || !status.can_seek;
  const volumioState = {
    status: status.mode,
    service: this.serviceName,
    title: track.title,
    artist: track.artist || track.trackartist || track.albumartist,
    album: track.album || track.remote_title,
    albumart: albumartUrl,
    uri: '',
    trackType: LMS_TRACK_TYPE_TRANSLATIONS[track.type] || track.type,
    seek: !isStreaming ? Math.ceil(status.time * 1000) : undefined,
    duration: Math.ceil(track.duration),
    samplerate: track.samplerate ? (track.samplerate / 1000) + ' kHz' : undefined,
    bitdepth: track.samplesize ? track.samplesize + ' bit' : undefined,
    //bitrate: track.bitrate,
    channels: undefined,
    isStreaming,
    volume: status['mixer volume'],
  };

  // Volatile state does not support the 'bitrate' field!
  // If samplerate or bitdepth is not available, set bitrate as samplerate.
  if ((!volumioState.samplerate || !volumioState.bitdepth) && track.bitrate) {
    volumioState.samplerate = track.bitrate;
    volumioState.bitdepth = undefined;
  }

  switch (status['playlist repeat']) {
    case LMS_REPEAT_PLAYLIST:
      volumioState.repeat = true;
      volumioState.repeatSingle = false;
      break;
    case LMS_REPEAT_CURRENT_SONG:
      volumioState.repeat = true;
      volumioState.repeatSingle = true;
      break;
    default:  // LMS_REPEAT_OFF
      volumioState.repeat = false;
      volumioState.repeatSingle = false;
  }

  switch (status['playlist shuffle']) {
    case LMS_SHUFFLE_BY_SONG:
    case LMS_SHUFFLE_BY_ALBUM:
      volumioState.random = true;
      break;
    default:  // LMS_SHUFFLE_OFF
      volumioState.random = false;
  }

  // Sometimes, the artwork_url stays unchanged on new song (perhaps not yet loaded?),
  // so we request another status update after a short timeout period.
  if (this.lastState) {
    const isNewSong = this.lastState.title !== volumioState.title;
    if (isNewSong && track.artwork_url) {
      setTimeout(() => {
        this.requestPlayerStatusUpdate();
      }, 3000);
    }
  }
  this.lastState = volumioState;

  if (!isCurrentService && volumioState.status === 'play') {
    sm.getLogger().info(`[squeezelite_mc] 'play' status received while not being the current service.`);
    await this.stopCurrentServiceAndSetVolatile();
    this.pushState(volumioState);

    // Squeezelite might not be able to start playing immediately, such as when
    // the previous service has not yet released the audio output device. So we request another 
    // status update after a short while - hopefully Squeezelite will be playing by then.
    setTimeout(() => {
      this.requestPlayerStatusUpdate();
    }, 3000);
  }
  else if (isCurrentService) {
    if (volumioState.status === 'stop') {
      // statemachine does weird things when the volatile status is 'stop'. The result is that
      // the state appears as if the track is still playing.
      // We just push empty state here and hope for the best. At least with what we do 
      // in pushEmptyState(), playback will appear to have stopped.
      this.pushEmptyState();
    }
    else {
      this.pushState(volumioState);

      // Start or stop internal playbackTimer
      if (!volumioState.isStreaming && volumioState.status === 'play') {
        this.playbackTimer.start(volumioState.seek);
      }
      else {
        this.playbackTimer.stop();
      }
    }
  }

  // Set Volumio's volume to Squeezelite's
  if (isCurrentService && this.volumioVolume !== volumioState.volume) {
    this.commandRouter.volumiosetvolume(volumioState.volume);
  }
}

ControllerSqueezeliteMC.prototype.pushState = function (state) {
  sm.getLogger().info(`[squeezelite_mc] pushState(): ${JSON.stringify(state)}`);
  this.commandRouter.servicePushState(state, this.serviceName);
}

ControllerSqueezeliteMC.prototype.stopCurrentServiceAndSetVolatile = async function () {
  if (this.isCurrentService()) {
    return;
  }

  const stopCurrentServicePlayback = async () => {
    try {
      const currentService = this.getCurrentService();
      const statemachine = sm.getStateMachine();
      const isPlaybackByMpd = currentService === 'mpd' || (statemachine.isConsume && statemachine.consumeUpdateService === 'mpd');
      if (isPlaybackByMpd) {
        // mpdPlugin pushes 'stop' states which do not get ignored by the statemachine even after we have called setVolatile().
        // The statemachine just combines the volatile state with the mpdplugin's 'stop' states and completely messes itself up.
        // We need to tell mpdPlugin to ignore updates after stopping. Note, however, if the current service / state consumption 
        // is not handled by mpdPlugin, but similarly pushes states after stopping, then this will also screw up the statemachine...
        sm.getMpdPlugin().ignoreUpdate(true);
      }
      return kewToJSPromise(this.commandRouter.volumioStop());
    } catch (error) {
      sm.getLogger().error(sm.getErrorMessage(`[squeezelite_mc] An error occurred while stopping playback by current service:`, error));
      sm.getLogger().error('[squeezelite_mc] Continuing anyway...');
    }
  }

  // Stop any playback by the currently active service
  sm.getLogger().info('[squeezelite_mc] Stopping playback by current service...');
  sm.getStateMachine().setConsumeUpdateService(undefined);
  await stopCurrentServicePlayback();

  // Unset any volatile state of currently active service
  let statemachine = sm.getStateMachine();
  if (statemachine.isVolatile) {
    statemachine.unSetVolatile();
  }

  // Set volatile
  sm.getLogger().info('[squeezelite_mc] Setting ourselves as the current service...');
  if (!this.volatileCallback) {
    this.volatileCallback = this.onUnsetVolatile.bind(this);
  }
  sm.getStateMachine().setVolatile({
    service: this.serviceName,
    callback: this.volatileCallback
  });
  sm.getStateMachine().setConsumeUpdateService(undefined);
}

ControllerSqueezeliteMC.prototype.getConfigurationFiles = function () {
  return ['config.json'];
}

ControllerSqueezeliteMC.prototype.unsetVolatile = function () {
  sm.getStateMachine().unSetVolatile();
}

// Callback that gets called by statemachine when unsetting volatile state
ControllerSqueezeliteMC.prototype.onUnsetVolatile = function () {
  this.pushEmptyState();
  sm.getMpdPlugin().ignoreUpdate(false);

  // There is no graceful handling of switching from one music service plugin to another
  // in Volumio. Statemachine calls volatile callbacks in unsetVolatile(), but does not
  // wait for them to complete. That means there is no chance to actually clean things up before 
  // moving to another music service.
  // When we call stop() here, we should ideally be able to return a promise that resolves when
  // the output device is closed by Squeezelite, with statemachine then proceeding to the next
  // music service. But since there is no such mechanism, and if Squeezelite is in the middle of playing
  // something, then you will most likely get an "Alsa device busy" error when the next music service
  // tries to access the output device.
  // No solution I can think of, or am I doing this the wrong way?
  this.stop();
}

ControllerSqueezeliteMC.prototype.pushEmptyState = function () {
  this.playbackTimer.stop();
  sm.getLogger().info('[squeezelite_mc] Pushing empty state...');
  // Need to first push empty state with pause status first so the empty volatileState gets registered 
  // by statemachine.
  this.commandRouter.servicePushState(Object.assign(EMPTY_STATE, { status: 'pause' }), this.serviceName);
  // Then push empty state with stop status. Note that the actual state will remain as 'pause', but trying to 
  // work with the logic of the state machine, or lack thereof, is just too much to bear...
  this.commandRouter.servicePushState(EMPTY_STATE, this.serviceName);
}

ControllerSqueezeliteMC.prototype.getCurrentService = function () {
  let currentstate = this.commandRouter.volumioGetState();
  return (currentstate !== undefined && currentstate.service !== undefined) ? currentstate.service : null;
}

ControllerSqueezeliteMC.prototype.isCurrentService = function () {
  return this.getCurrentService() === this.serviceName;
};

ControllerSqueezeliteMC.prototype.requestPlayerStatusUpdate = function () {
  if (this.isCurrentService() && this.playerStatusMonitor) {
    this.playerStatusMonitor.requestUpdate();
  }
}

ControllerSqueezeliteMC.prototype.getPlayerConfig = async function () {
  const config = {};

  // Player name
  const playerNameType = sm.getConfigValue('playerNameType', 'hostname');
  const playerName = sm.getConfigValue('playerName', '');
  if (playerNameType === 'custom' && playerName) {
    config.playerName = `"${playerName}"`;
  }
  else if (os.hostname()) {
    // Default - use device hostname. Don't rely on Squeezelite to set this, since it sometimes sets its
    // name to "SqueezeLite", which is not what we want).
    config.playerName = os.hostname();
  }

  // Alsa
  const device = this.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', 'outputdevice');
  const card = device.indexOf(',') >= 0 ? device.charAt(0) : device;
  const mixerType = this.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', 'mixer_type'); // Software / Hardware
  const mixerDev = this.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', 'mixer');
  const mixer = (() => {
    if (mixerDev.indexOf(',') >= 0) {
      const mixerArr = mixerDev.split(',');
      return mixerArr[0] + ',' + mixerArr[1];
    }
    else {
      return '"' + mixerDev + '"';
    }
  })();
  config.card = card;
  config.mixerType = mixerType;
  // mixer is for squeezelite -V option:
  // - null for 'None' mixer type (use Squeezelite software volume control)
  // - Otherwise, set to same as Volumio (e.g. 'SoftMaster' for 'Software' mixer type)
  config.mixer = mixerType !== 'None' ? mixer : null;

  // DSD format
  const dsdPlayback = sm.getConfigValue('dsdPlayback', 'auto');
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
  else {  // auto based on Volumio's "DSD Playback Mode" setting
    const dop = this.commandRouter.executeOnPlugin('music_service', 'mpd', 'getConfigParam', 'dop') ? true : false;
    if (dop) {
      dsdFormatPromise = Promise.resolve('dop');
    }
    else {
      dsdFormatPromise = this.getBestSupportedDSDFormat(card);
      getBestSupportedDSDFormatCalled = true;
    }
  }
  
  config.dsdFormat = await dsdFormatPromise;
  config.invalidated = false;

  if (!getBestSupportedDSDFormatCalled) {
    // getBestSupportedDSDFormat() might not always be able to obtain ALSA formats (such as when device is busy).
    // We call it whenever we have the chance so that, if the call is successful, the ALSA formats can be kept 
    // in cache until we actually need them.
    await this.getBestSupportedDSDFormat(card, true);
  }

  return config;
}

ControllerSqueezeliteMC.prototype.getBestSupportedDSDFormat = async function (card, noErr = false) {
  const cachedAlsaFormats = sm.get('alsaFormats', []);
  const alsaFormatsPromise = cachedAlsaFormats[card] ? Promise.resolve(cachedAlsaFormats[card]) : getAlsaFormats(card);
  try {
    const alsaFormats = await alsaFormatsPromise;
    if (alsaFormats.length === 0) {
      sm.getLogger().warn(`[squeezelite_mc] No ALSA formats returned for card ${card}`)
      return null;
    }
    else {
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
  } catch (error) {
    if (noErr) {
      return null;
    }
    else {
      throw error;
    }
  }
}

ControllerSqueezeliteMC.prototype.getVolumioVolume = async function () {
  try {
    const volumeData = await kewToJSPromise(this.commandRouter.volumioretrievevolume());
    return volumeData.vol;
  } catch (error) {
    return 0;
  }
}

ControllerSqueezeliteMC.prototype.revalidatePlayerConfig = async function (options = {}) {
  const opts = (typeof options === 'string') ? JSON.parse(options) : options;
  let config;
  try {
    sm.toast('info', sm.getI18n('SQUEEZELITE_MC_REVALIDATING'));
    config = await this.getPlayerConfig();
  } catch (error) {
    if (error.reason === ERR_DEVICE_BUSY) {
      sm.toast('error', sm.getI18n('SQUEEZELITE_MC_ERR_REVALIDATE_DEV_BUSY'));
    }
    else {
      sm.toast('error', sm.getErrorMessage(sm.getI18n('SQUEEZELITE_MC_ERR_REVALIDATE'), error, false));
    }
    this.playerConfig.invalidated = true;
    this.playerStatus = STATUS_ERR_REVALIDATE;
    return;
  }
  // Check if config changed 
  if (
    opts.force ||
    !this.playerConfig ||
    this.playerConfig.invalidated ||
    (this.playerConfig.playerName !== config.playerName ||
    this.playerConfig.card !== config.card ||
    this.playerConfig.mixerType !== config.mixerType ||
    this.playerConfig.mixer !== config.mixer ||
    this.playerConfig.dsdFormat !== config.dsdFormat)) {

    this.playerConfig = config;
    sm.getLogger().info(`[squeezelite_mc] Restarting Squeezelite service with config: ${JSON.stringify(this.playerConfig)}`);

    try {
      await initSqueezeliteService(config);
      sm.toast('success', sm.getI18n('SQUEEZELITE_MC_RESTARTED_CONFIG'));
      this.status = STATUS_NORMAL;
      if (opts.refreshUIConf) {
        this.refreshUIConfig();
      }
    } catch (error) {
      if (error.reason === ERR_DEVICE_BUSY) {
        sm.toast('error', sm.getI18n('SQUEEZELITE_MC_ERR_RESTART_DEV_BUSY'));
      } 
      else {
        sm.toast('error', sm.getErrorMessage(sm.getI18n('SQUEEZELITE_MC_ERR_RESTART'), error, false));
      }
      this.status = STATUS_ERR_RESTART_CONFIG;
      this.playerConfig.invalidated = true;
      if (opts.refreshUIConf) {
        this.refreshUIConfig();
      }
    }
  }
}

ControllerSqueezeliteMC.prototype.handlePlayerConfigChange = async function () {
  // Volumio can emit multiple change notifications within a short interval.
  // We set a delay timer to avoid calling initSqueezeliteService() multiple times.
  if (this.playerConfigChangeDelayTimer) {
    clearTimeout(this.playerConfigChangeDelayTimer);
    this.playerConfigChangeDelayTimer = null;
  }
  this.playerConfigChangeDelayTimer = setTimeout(async () => {
    this.revalidatePlayerConfig();
  }, 1500);
}

ControllerSqueezeliteMC.prototype.configSaveServerCredentials = function (data = {}) {
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

  /**
   * credentials will look something like this:
   * {
   *   '<server name 1>': {
   *     'username': '...',
   *     'password': '...'
   *   },
   *   '<server name 2>': {
   *     'username': '...',
   *     'password': '...'
   *   },
   *   ...
   * }
  */

  const oldCredentials = sm.getConfigValue('serverCredentials', {}, true);
  this.config.set('serverCredentials', JSON.stringify(credentials));
  if (equal(credentials, oldCredentials)) {
    sm.toast('success', sm.getI18n('SQUEEZELITE_MC_SETTINGS_SAVED'));
  }
  else {
    // Restart components that rely on serverCredentials
    sm.toast('success', sm.getI18n('SQUEEZELITE_MC_APPLY_CONFIG_CHANGE'));
    this.refreshUIConfig().then(() => {
      this.proxy.setServerCredentials(credentials);
      this.clearPlayerStatusMonitor()
        .then(() => this.clearPlayerFinder())
        .then(() => this.initAndStartPlayerFinder());
    });
  }
}

ControllerSqueezeliteMC.prototype.configSaveSqueezeliteSettings = function(data) {
  const playerNameType = data.playerNameType.value;
  const playerName = data.playerName.trim();
  const dsdPlayback = data.dsdPlayback.value;
  if (playerNameType === 'custom' && playerName === '') {
    sm.toast('error', sm.getI18n('SQUEEZELITE_MC_ERR_PLAYER_NAME'));
    return;
  }

  const oldPlayerNameType = sm.getConfigValue('playerNameType', 'hostname');
  const oldPlayerName = sm.getConfigValue('playerName', '');
  const oldDsdPlayback = sm.getConfigValue('dsdPlayback', 'auto');
  const revalidate = oldPlayerNameType !== playerNameType ||
    oldPlayerName !== playerName ||
    oldDsdPlayback !== dsdPlayback;

  this.config.set('playerNameType', playerNameType);
  this.config.set('playerName', playerName);
  this.config.set('dsdPlayback', dsdPlayback);

  if (!revalidate) {
    sm.toast('success', sm.getI18n('SQUEEZELITE_MC_SETTINGS_SAVED'));
  }
  else {
    this.revalidatePlayerConfig();
  }
}

ControllerSqueezeliteMC.prototype.resolveOnStatusMode = function (mode, timeout = 2000) {
  if (!this.playerStatusMonitor) {
    return libQ.resolve();
  }
  const defer = libQ.defer();
  const updateHandler = (data) => {
    if (data.status.mode === mode) {
      this.playerStatusMonitor.off('update', updateHandler);
      clearTimeout(updateTimeout);
      defer.resolve();
    }
  };
  const updateTimeout = setTimeout(() => {
    this.playerStatusMonitor.off('update', updateHandler);
    defer.resolve();
  }, timeout);

  this.playerStatusMonitor.on('update', updateHandler);

  return defer.promise;
}

ControllerSqueezeliteMC.prototype.stop = function () {
  if (this.commandDispatcher) {
    this.commandDispatcher.sendStop();
    return this.resolveOnStatusMode('stop');
  }
  return libQ.resolve();
}

ControllerSqueezeliteMC.prototype.play = function () {
  if (this.commandDispatcher) {
    this.commandDispatcher.sendPlay()
    return this.resolveOnStatusMode('play');
  }
  return libQ.resolve();
}

ControllerSqueezeliteMC.prototype.pause = async function () {
  if (this.commandDispatcher) {
    this.commandDispatcher.sendPause();
    return this.resolveOnStatusMode('pause');
  }
  return libQ.resolve();
}

ControllerSqueezeliteMC.prototype.resume = function () {
  if (this.commandDispatcher) {
    this.commandDispatcher.sendPlay();
    return this.resolveOnStatusMode('play');
  }
  return libQ.resolve();
}

ControllerSqueezeliteMC.prototype.seek = function (position) {
  if (this.commandDispatcher) {
    return jsPromiseToKew(this.commandDispatcher.sendSeek(position));
  }
  return libQ.resolve();
}

ControllerSqueezeliteMC.prototype.next = function () {
  if (this.commandDispatcher) {
    return jsPromiseToKew(this.commandDispatcher.sendNext());
  }
  return libQ.resolve();
}

ControllerSqueezeliteMC.prototype.previous = function () {
  if (this.commandDispatcher) {
    if (this.previousDoubleClickTimeout) {
      this.previousDoubleClickTimeout = null;
      return jsPromiseToKew(this.commandDispatcher.sendPrevious());
    }
    else {
      this.previousDoubleClickTimeout = setTimeout(() => { this.previousDoubleClickTimeout = null }, 3000);
      return this.seek(0);
    }
  }
  return libQ.resolve();
}

ControllerSqueezeliteMC.prototype.repeat = function (value, repeatSingle) {
  if (this.commandDispatcher) {
    this.commandDispatcher.sendRepeat(value ? (repeatSingle ? LMS_REPEAT_CURRENT_SONG : LMS_REPEAT_PLAYLIST) : LMS_REPEAT_OFF);
  }
  return libQ.resolve();
}

ControllerSqueezeliteMC.prototype.random = function (value) {
  if (this.commandDispatcher) {
    this.commandDispatcher.sendShuffle(value ? LMS_SHUFFLE_BY_SONG : LMS_SHUFFLE_OFF);
  }
  return libQ.resolve();
}
