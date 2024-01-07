'use strict';

let libQ = require('kew');
let fs = require('fs-extra');
let config = new (require('v-conf'))();
let superagent = require('superagent');
let os = require('os');
let websocket = require('ws');
let path = require('path');
let SpotifyWebApi = require('spotify-web-api-node');
let io = require('socket.io-client');
let exec = require('child_process').exec;
let execSync = require('child_process').execSync;
let NodeCache = require('node-cache');
let { fetchPagedData, rateLimitedCall } = require('./utils/extendedSpotifyApi');

let configFileDestinationPath = '/tmp/go-librespot-config.yml';
let credentialsPath = '/data/configuration/music_service/spop/spotifycredentials.json';
let spotifyDaemonPort = '9879';
let spotifyLocalApiEndpointBase = 'http://127.0.0.1:' + spotifyDaemonPort;
let stateSocket = undefined;

let selectedBitrate;
let loggedInUsername;
let loggedInUserId;
let userCountry;
let seekTimer;
let restartTimeout;
let wsConnectionStatus = 'started';

// State management
let ws;
let currentVolumioState;
let currentSpotifyVolume;
let currentVolumioVolume;
let isInVolatileMode = false;
let ignoreStopEvent = false;

// Volume limiter
let deltaVolumeTreshold = 2;
let volumeDebounce;

// Debug
let isDebugMode = true;

// Define the ControllerSpotify class
module.exports = ControllerSpotify;

function ControllerSpotify(context) {
  // This fixed variable will let us refer to 'this' object at deeper scopes
  this.context = context;
  this.commandRouter = this.context.coreCommand;
  this.logger = this.context.logger;
  this.configManager = this.context.configManager;
  this.resetSpotifyState();
}

ControllerSpotify.prototype.onVolumioStart = function () {
  let configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
  this.config = new (require('v-conf'))();
  this.config.loadFile(configFile);
  this.config.set('shared_device', this.config.get('shared_device', true));
  return libQ.resolve();
};

ControllerSpotify.prototype.getConfigurationFiles = function () {
  return ['config.json'];
};

ControllerSpotify.prototype.onStop = function () {
  let self = this;
  let defer = libQ.defer();

  self.goLibrespotDaemonWsConnection('stop');
  self.stopLibrespotDaemon();
  self.stopSocketStateListener();
  self.removeToBrowseSources();

  defer.resolve();
  return defer.promise;
};

ControllerSpotify.prototype.onStart = function () {
  let self = this;
  let defer = libQ.defer();

  self.loadI18n();
  self.browseCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
  self.initializeLibrespotDaemon();
  self.initializeSpotifyBrowsingFacility();
  defer.resolve();
  return defer.promise;
};

ControllerSpotify.prototype.getUIConfig = function () {
  let defer = libQ.defer();
  let self = this;

  let lang_code = self.commandRouter.sharedVars.get('language_code');

  self.commandRouter
    .i18nJson(
      __dirname + '/i18n/strings_' + lang_code + '.json',
      __dirname + '/i18n/strings_en.json',
      __dirname + '/UIConfig.json',
    )
    .then(function (uiconf) {
      let credentials_type = self.config.get('credentials_type', null);
      if (self.loggedInUserId !== undefined && credentials_type === 'spotify_token') {
        uiconf.sections[1].content[0].hidden = true;
        uiconf.sections[1].content[1].hidden = false;
      }
      let bitrateNumber = self.config.get('bitrate_number', 320);
      uiconf.sections[2].content[0].value.value = bitrateNumber;
      uiconf.sections[2].content[0].value.label = self.getLabelForSelect(
        uiconf.sections[2].content[0].options,
        bitrateNumber,
      );

      let normalisationPregainValue = self.config.get('normalisation_pregain', '1.0');
      uiconf.sections[2].content[2].value.value = normalisationPregainValue;
      uiconf.sections[2].content[2].value.label = normalisationPregainValue;

      let icon = self.config.get('icon', 'avr');
      uiconf.sections[2].content[3].value.value = icon;
      uiconf.sections[2].content[3].value.label = self.getLabelForSelect(uiconf.sections[2].content[3].options, icon);

      uiconf.sections[2].content[4].value = self.config.get('shared_device');

      defer.resolve(uiconf);
    })
    .fail(function (error) {
      self.logger.error('Cannot populate Spotify configuration: ' + error);
      defer.reject(new Error());
    });

  return defer.promise;
};

ControllerSpotify.prototype.getAdditionalConf = function (type, controller, data, def) {
  let self = this;
  let setting = self.commandRouter.executeOnPlugin(type, controller, 'getConfigParam', data);

  if (setting == undefined) {
    setting = def;
  }
  return setting;
};

// Controls

ControllerSpotify.prototype.goLibrespotDaemonWsConnection = function (action) {
  let self = this;

  if (action === 'start') {
    wsConnectionStatus = 'started';
    self.initializeWsConnection();
  } else if (action === 'stop') {
    if (ws) {
      ws.terminate();
      ws = undefined;
    }
    wsConnectionStatus = 'stopped';
  } else if (action === 'restart') {
    if (wsConnectionStatus === 'started') {
      if (restartTimeout) {
        clearTimeout(restartTimeout);
      }
      restartTimeout = setTimeout(() => {
        self.initializeWsConnection();
        restartTimeout = undefined;
      }, 3000);
    }
  }
};

ControllerSpotify.prototype.initializeWsConnection = function () {
  let self = this;

  self.logger.info('Initializing connection to go-librespot Websocket');

  ws = new websocket('ws://localhost:' + spotifyDaemonPort + '/events');
  ws.on('error', function (error) {
    self.logger.info('Error connecting to go-librespot Websocket: ' + error);
    self.goLibrespotDaemonWsConnection('restart');
  });

  ws.on('message', function message(data) {
    self.debugLog('received: ' + data);
    self.parseEventState(JSON.parse(data));
  });

  ws.on('open', function () {
    self.logger.info('Connection to go-librespot Websocket established');
    setTimeout(() => {
      self.initializeSpotifyControls();
    }, 3000);
    ws.on('close', function () {
      self.logger.info('Connection to go-librespot Websocket closed');
      self.goLibrespotDaemonWsConnection('restart');
    });
  });
};

ControllerSpotify.prototype.initializeSpotifyControls = function () {
  let self = this;

  self.resetSpotifyState();
  self.startSocketStateListener();
  self.getSpotifyVolume();
};

ControllerSpotify.prototype.resetSpotifyState = function () {
  this.state = {
    status: 'stop',
    service: 'spop',
    title: '',
    artist: '',
    album: '',
    albumart: '/albumart',
    uri: '',
    // icon: 'fa fa-spotify',
    trackType: 'spotify',
    seek: 0,
    duration: 0,
    samplerate: '44.1 KHz',
    bitdepth: '16 bit',
    bitrate: '',
    codec: 'ogg',
    channels: 2,
    random: null,
    repeat: null,
    repeatSingle: null,
  };
};

ControllerSpotify.prototype.parseEventState = function (event) {
  let self = this;

  let pushStateforEvent = false;

  // create a switch case which handles types of events
  // and updates the state accordingly
  switch (event.type) {
    case 'metadata':
      self.state.title = event.data.name;
      self.state.duration = self.parseDuration(event.data.duration);
      self.state.uri = event.data.uri;
      self.state.artist = self.parseArtists(event.data.artist_names);
      self.state.album = event.data.album_name;
      self.state.albumart = event.data.album_cover_url;
      self.state.seek = event.data.position;
      pushStateforEvent = false;
      break;
    case 'will_play':
      //impro: use this event to free up audio device when starting volatile?
      pushStateforEvent = false;
      break;
    case 'playing':
      self.state.status = 'play';
      self.identifyPlaybackMode(event.data);
      setTimeout(() => {
        self.pushState();
      }, 300);
      pushStateforEvent = true;
      break;
    case 'paused':
      self.state.status = 'pause';
      self.identifyPlaybackMode(event.data);
      pushStateforEvent = true;
      break;
    case 'stopped':
      self.state.status = 'stop';
      pushStateforEvent = true;
      break;
    case 'seek':
      self.state.seek = event.data.position;
      pushStateforEvent = true;
      break;
    case 'active':
      //self.state.status = 'play';
      pushStateforEvent = false;
      self.alignSpotifyVolumeToVolumioVolume();
      break;
    case 'volume':
      try {
        if (event.data && event.data.value !== undefined) {
          self.onSpotifyVolumeChange(parseInt(event.data.value));
        }
      } catch (e) {
        self.logger.error('Failed to parse Spotify volume event: ' + e);
      }
      pushStateforEvent = false;
      break;
    case 'shuffle_context':
      self.state.random = event.data.value;
      pushStateforEvent = true;
      break;
    case 'repeat_context':
      self.state.repeatSingle = false;
      self.state.repeat = event.data.value;
      pushStateforEvent = true;
      break;
    case 'repeat_track':
      if (!event.data.value) {
        break;
      }
      self.state.repeatSingle = true;
      self.state.repeat = true;
      pushStateforEvent = true;
      break;
    default:
      self.logger.error('Failed to decode event: ' + event.type);
      pushStateforEvent = false;
      break;
  }

  if (pushStateforEvent) {
    self.pushState(self.state);
  }
};

ControllerSpotify.prototype.identifyPlaybackMode = function (data) {
  let self = this;

  // This functions checks if Spotify is playing in volatile mode or in Volumio mode (playback started from Volumio UI)
  // play_origin = 'go-librespot' means that Spotify is playing in Volumio mode
  // play_origin = 'your_library' or 'playlist' means that Spotify is playing in volatile mode
  if (data && data.play_origin && data.play_origin === 'go-librespot') {
    isInVolatileMode = false;
  } else {
    isInVolatileMode = true;
  }

  // Refactor in order to handle the case where current service is spop but not in volatile mode
  if (
    (isInVolatileMode && currentVolumioState.service !== 'spop') ||
    (isInVolatileMode && currentVolumioState.service === 'spop' && currentVolumioState.volatile !== true)
  ) {
    self.initializeSpotifyPlaybackInVolatileMode();
  }
};

ControllerSpotify.prototype.initializeSpotifyPlaybackInVolatileMode = function () {
  let self = this;

  self.logger.info('Spotify is playing in volatile mode');
  ignoreStopEvent = true;

  self.commandRouter.stateMachine.setConsumeUpdateService(undefined);
  self.context.coreCommand.stateMachine.setVolatile({
    service: 'spop',
    callback: self.libRespotGoUnsetVolatile(),
  });

  setTimeout(() => {
    ignoreStopEvent = false;
  }, 2000);
};

ControllerSpotify.prototype.parseDuration = function (spotifyDuration) {
  try {
    return parseInt(spotifyDuration / 1000);
  } catch (e) {
    return 0;
  }
};

ControllerSpotify.prototype.getCurrentBitrate = function () {
  let self = this;

  return self.selectedBitrate + ' kbps';
};

ControllerSpotify.prototype.parseArtists = function (spotifyArtists) {
  let artist = '';
  if (spotifyArtists.length > 0) {
    for (let i in spotifyArtists) {
      if (!artist.length) {
        artist = spotifyArtists[i];
      } else {
        artist = artist + ', ' + spotifyArtists[i];
      }
    }
    return artist;
  } else {
    return spotifyArtists;
  }
};

ControllerSpotify.prototype.libRespotGoUnsetVolatile = function () {
  let self = this;
  let defer = libQ.defer();

  self.debugLog('UNSET VOLATILE');
  self.debugLog(JSON.stringify(currentVolumioState));

  if (currentVolumioState && currentVolumioState.status && currentVolumioState.status !== 'stop') {
    self.logger.info('Setting Spotify stop after unset volatile call');
    setTimeout(() => {
      self.stop();
      defer.resolve('');
    }, 500);
  } else {
    defer.resolve('');
  }
};

ControllerSpotify.prototype.getState = function () {
  let self = this;

  self.debugLog('GET STATE SPOTIFY');
  self.debugLog(JSON.stringify(self.state));
  return self.state;
};

// Announce updated Spop state
ControllerSpotify.prototype.pushState = function () {
  let self = this;

  self.state.bitrate = self.getCurrentBitrate();
  self.debugLog('PUSH STATE SPOTIFY');
  self.debugLog(JSON.stringify(self.state));
  self.seekTimerAction();
  return self.commandRouter.servicePushState(self.state, 'spop');
};

ControllerSpotify.prototype.sendSpotifyLocalApiCommand = function (commandPath) {
  this.logger.info('Sending Spotify command to local API: ' + commandPath);

  superagent
    .post(spotifyLocalApiEndpointBase + commandPath)
    .accept('application/json')
    .then(() => {})
    .catch((error) => {
      this.logger.error('Failed to send command to Spotify local API: ' + commandPath + ': ' + error);
    });
};

ControllerSpotify.prototype.sendSpotifyLocalApiCommandWithPayload = function (commandPath, payload) {
  this.logger.info('Sending Spotify command with payload to local API: ' + commandPath);

  superagent
    .post(spotifyLocalApiEndpointBase + commandPath)
    .accept('application/json')
    .send(payload)
    .then(() => {})
    .catch((error) => {
      this.logger.error('Failed to send command to Spotify local API: ' + commandPath + ': ' + error);
    });
};

ControllerSpotify.prototype.pause = function () {
  this.logger.info('Spotify Received pause');

  this.debugLog('SPOTIFY PAUSE');
  this.debugLog(JSON.stringify(currentVolumioState));
  this.sendSpotifyLocalApiCommand('/player/pause');
};

ControllerSpotify.prototype.play = function () {
  this.logger.info('Spotify Play');

  if (this.state.status === 'pause') {
    this.sendSpotifyLocalApiCommand('/player/resume');
  } else {
    this.sendSpotifyLocalApiCommand('/player/play');
  }
};

ControllerSpotify.prototype.stop = function () {
  this.logger.info('Spotify Stop');
  let defer = libQ.defer();

  this.debugLog('SPOTIFY STOP');
  this.debugLog(JSON.stringify(currentVolumioState));
  if (!ignoreStopEvent) {
    this.sendSpotifyLocalApiCommand('/player/pause');
  }

  defer.resolve('');
  return defer.promise;
};

ControllerSpotify.prototype.resume = function () {
  this.logger.info('Spotify Resume');

  this.sendSpotifyLocalApiCommand('/player/resume');
};

ControllerSpotify.prototype.next = function () {
  this.logger.info('Spotify next');

  this.sendSpotifyLocalApiCommand('/player/next');
};

ControllerSpotify.prototype.previous = function () {
  this.logger.info('Spotify previous');

  this.sendSpotifyLocalApiCommand('/player/prev');
};

ControllerSpotify.prototype.seek = function (position) {
  this.logger.info('Spotify seek to: ' + position);

  this.sendSpotifyLocalApiCommandWithPayload('/player/seek', { position: position });
};

ControllerSpotify.prototype.random = function (value) {
  this.logger.info('Spotify Random: ' + value);
  this.sendSpotifyLocalApiCommandWithPayload('/player/shuffle_context', { shuffle_context: value });
};

ControllerSpotify.prototype.repeat = function (value, repeatSingle) {
  this.logger.info('Spotify Repeat: ' + value + ' - ' + repeatSingle);
  if (repeatSingle) {
    this.sendSpotifyLocalApiCommandWithPayload('/player/repeat_track', { repeat_track: true });
  } else if (value) {
    this.sendSpotifyLocalApiCommandWithPayload('/player/repeat_context', { repeat_context: true });
  } else {
    this.sendSpotifyLocalApiCommandWithPayload('/player/repeat_context', { repeat_context: false });
    this.sendSpotifyLocalApiCommandWithPayload('/player/repeat_track', { repeat_track: false });
  }
};

// Volume events

ControllerSpotify.prototype.onSpotifyVolumeChange = function (volume) {
  let self = this;

  self.debugLog('RECEIVED SPOTIFY VOLUME ' + volume);
  if (volume !== currentVolumioVolume) {
    self.logger.info('Setting Volumio Volume from Spotify: ' + volume);
    currentSpotifyVolume = volume;
    currentVolumioVolume = currentSpotifyVolume;
    self.commandRouter.volumiosetvolume(currentVolumioVolume);
  }
};

ControllerSpotify.prototype.onVolumioVolumeChange = function (volume) {
  let self = this;

  self.debugLog('RECEIVED VOLUMIO VOLUME ' + volume);
  if (volume !== currentSpotifyVolume && self.checkSpotifyAndVolumioDeltaVolumeIsEnough(currentSpotifyVolume, volume)) {
    self.logger.info('Setting Spotify Volume from Volumio: ' + volume);
    currentVolumioVolume = volume;
    currentSpotifyVolume = currentVolumioVolume;
    self.setSpotifyDaemonVolume(currentSpotifyVolume);
  }
};

ControllerSpotify.prototype.setSpotifyDaemonVolume = function (volume) {
  let self = this;

  // Volume limiter
  if (volumeDebounce) {
    clearTimeout(volumeDebounce);
  }
  volumeDebounce = setTimeout(() => {
    self.debugLog('SETTING SPOTIFY VOLUME ' + volume);
    self.sendSpotifyLocalApiCommandWithPayload('/player/volume', { volume: volume });
  }, 1500);
};

ControllerSpotify.prototype.checkSpotifyAndVolumioDeltaVolumeIsEnough = function (spotifyVolume, volumioVolume) {
  let self = this;

  self.debugLog('SPOTIFY VOLUME ' + spotifyVolume);
  self.debugLog('VOLUMIO VOLUME ' + volumioVolume);
  if (spotifyVolume === undefined) {
    return self.alignSpotifyVolumeToVolumioVolume();
  }
  try {
    let isDeltaVolumeEnough = Math.abs(parseInt(spotifyVolume) - parseInt(volumioVolume)) >= deltaVolumeTreshold;
    self.debugLog('DELTA VOLUME ENOUGH: ' + isDeltaVolumeEnough);
    return isDeltaVolumeEnough;
  } catch (e) {
    return false;
  }
};

ControllerSpotify.prototype.alignSpotifyVolumeToVolumioVolume = function () {
  let self = this;

  self.logger.info('Aligning Spotify Volume to Volumio Volume');

  let state = self.commandRouter.volumioGetState();
  let currentVolumioVolumeValue = state && state.volume ? state.volume : undefined;
  let currentDisableVolumeControl = state && state.disableVolumeControl ? state.disableVolumeControl : undefined;
  let currentMuteValue = state && state.mute ? state.mute : undefined;
  if (currentVolumioVolumeValue !== undefined && currentDisableVolumeControl !== true) {
    if (currentMuteValue === true) {
      currentVolumioVolume = 0;
    } else {
      currentVolumioVolume = currentVolumioVolumeValue;
    }
    self.logger.info('Setting Spotify Volume from Volumio: ' + currentVolumioVolume);
    currentSpotifyVolume = currentVolumioVolume;
    self.setSpotifyDaemonVolume(currentSpotifyVolume);
  }
};

ControllerSpotify.prototype.clearAddPlayTrack = function (track) {
  let self = this;
  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerSpotify::clearAddPlayTrack');
  self.resetSpotifyState();

  return self.sendSpotifyLocalApiCommandWithPayload('/player/play', { uri: track.uri });
};

ControllerSpotify.prototype.startSocketStateListener = function () {
  let self = this;

  if (self.stateSocket) {
    self.stateSocket.off();
    self.stateSocket.disconnect();
  }

  self.stateSocket = io.connect('http://localhost:3000');
  self.stateSocket.on('connect', function () {
    self.stateSocket.emit('getState', '');
  });

  self.stateSocket.on('pushState', function (data) {
    currentVolumioState = data;
    if (data && data.volume && !data.disableVolumeControl) {
      let currentVolume = data.volume;
      if (data.mute === true) {
        currentVolume = 0;
      }
      self.onVolumioVolumeChange(currentVolume);
    }
  });
};

ControllerSpotify.prototype.stopSocketStateListener = function () {
  let self = this;

  if (self.stateSocket) {
    self.stateSocket.off();
    self.stateSocket.disconnect();
  }
};

// DAEMON MANAGEMENT

ControllerSpotify.prototype.initializeLibrespotDaemon = function () {
  let self = this;
  let defer = libQ.defer();

  this.selectedBitrate = self.config.get('bitrate_number', '320').toString();

  self
    .createConfigFile()
    .then(function () {
      return self.startLibrespotDaemon();
    })
    .then(function () {
      self.logger.info('go-librespot daemon successfully initialized');
      setTimeout(() => {
        self.goLibrespotDaemonWsConnection('start');
        defer.resolve('');
      }, 3000);
    })
    .fail(function (e) {
      defer.reject(e);
      self.logger.error('Error initializing go-librespot daemon: ' + e);
    });

  return defer.promise;
};

ControllerSpotify.prototype.startLibrespotDaemon = function () {
  let self = this;
  let defer = libQ.defer();

  exec('/usr/bin/sudo systemctl restart go-librespot-daemon.service', function (error) {
    if (error) {
      self.logger.error('Cannot start Go-librespot Daemon: ' + error);
      defer.reject(error);
    } else {
      setTimeout(() => {
        defer.resolve();
      }, 3000);
    }
  });

  return defer.promise;
};

ControllerSpotify.prototype.stopLibrespotDaemon = function () {
  let self = this;
  let defer = libQ.defer();

  exec('/usr/bin/sudo systemctl stop go-librespot-daemon.service', function (error) {
    if (error) {
      self.logger.error('Cannot stop Go-librespot Daemon: ' + error);
      defer.reject(error);
    } else {
      setTimeout(() => {
        defer.resolve();
      }, 2000);
    }
  });

  return defer.promise;
};

ControllerSpotify.prototype.createConfigFile = function () {
  let self = this;
  let defer = libQ.defer();

  this.logger.info('Creating Spotify config file');

  try {
    var template = fs.readFileSync(path.join(__dirname, 'config.yml.tmpl'), { encoding: 'utf8' });
  } catch (e) {
    this.logger.error('Failed to read template file: ' + e);
  }

  let devicename = this.commandRouter.sharedVars.get('system.name');
  let selectedBitrate = self.config.get('bitrate_number', '320').toString();
  let icon = self.config.get('icon', 'avr');
  let externalVolume = true;
  let mixerType = self.getAdditionalConf('audio_interface', 'alsa_controller', 'mixer_type', 'None');
  if (mixerType === 'None') {
    externalVolume = false;
  }
  let normalisationPregain = self.config.get('normalisation_pregain', '1.0');
  const sharedDevice = self.config.get('shared_device');

  let conf = template
    .replace('${device_name}', devicename)
    .replace('${bitrate_number}', selectedBitrate)
    .replace('${device_type}', icon)
    .replace('${external_volume}', externalVolume)
    .replace('${normalisation_pregain}', normalisationPregain)
    .replace('${zeroconf_enabled}', sharedDevice);

  let credentials_type = self.config.get('credentials_type', null);
  let logged_user_id = self.config.get('logged_user_id', '');
  let access_token = self.config.get('access_token', '');

  if (credentials_type === 'spotify_token' && logged_user_id !== '' && access_token !== '') {
    conf += `\
credentials:
  type: spotify_token
  spotify_token:
    username: "${logged_user_id}"
    access_token: "${access_token}"
`;
  }

  fs.writeFile(configFileDestinationPath, conf, (err) => {
    if (err) {
      defer.reject(err);
      this.logger.error('Failed to write spotify config file: ' + err);
    } else {
      defer.resolve('');
      this.logger.info('Spotify config file written');
    }
  });
  return defer.promise;
};

ControllerSpotify.prototype.isOauthLoginAlreadyConfiguredOnDaemon = function () {
  let self = this;

  try {
    var credentialsFile = fs.readFileSync(credentialsPath, { encoding: 'utf8' }).toString();
  } catch (e) {
    self.logger.error('Failed to read credentials file: ' + e);
  }

  if (credentialsFile && credentialsFile.length > 0) {
    return true;
  } else {
    return false;
  }
};

ControllerSpotify.prototype.saveGoLibrespotSettings = function (data) {
  let self = this;
  let defer = libQ.defer();

  if (data.bitrate !== undefined && data.bitrate.value !== undefined) {
    self.config.set('bitrate_number', data.bitrate.value);
  }

  if (data.debug !== undefined) {
    self.config.set('debug', data.debug);
  }
  if (data.icon && data.icon.value !== undefined) {
    self.config.set('icon', data.icon.value);
  }
  if (data.normalisation_pregain && data.normalisation_pregain.value !== undefined) {
    self.config.set('normalisation_pregain', data.normalisation_pregain.value);
  }
  self.config.set('shared_device', !!data.shared_device);

  self.selectedBitrate = self.config.get('bitrate_number', '320').toString();
  self.initializeLibrespotDaemon();

  return defer.promise;
};

// OAUTH

ControllerSpotify.prototype.refreshAccessToken = function () {
  let self = this;
  let defer = libQ.defer();

  let refreshToken = self.config.get('refresh_token', 'none');
  if (refreshToken !== 'none' && refreshToken !== null && refreshToken !== undefined) {
    superagent
      .post('https://oauth-performer.dfs.volumio.org/spotify/accessToken')
      .send({ refreshToken: refreshToken })
      .then(function (results) {
        if (results && results.body && results.body.accessToken) {
          defer.resolve(results);
        } else {
          defer.resject('No access token received');
        }
      })
      .catch(function (err) {
        self.logger.info('An error occurred while refreshing Spotify Token ' + err);
      });
  }

  return defer.promise;
};

ControllerSpotify.prototype.spotifyClientCredentialsGrant = function () {
  let self = this;
  let defer = libQ.defer();
  let d = new Date();
  let now = d.getTime();

  let refreshToken = self.config.get('refresh_token', 'none');
  if (refreshToken !== 'none' && refreshToken !== null && refreshToken !== undefined) {
    self.spotifyApi.setRefreshToken(refreshToken);
    self.refreshAccessToken().then(
      function (data) {
        self.spotifyAccessToken = data.body['accessToken'];
        self.debugLog(
          '------------------------------------------------------ ACCESS TOKEN ------------------------------------------------------',
        );
        self.debugLog(self.spotifyAccessToken);
        self.debugLog(
          '------------------------------------------------------ ACCESS TOKEN ------------------------------------------------------',
        );
        self.config.set('access_token', self.spotifyAccessToken);
        self.spotifyApi.setAccessToken(self.spotifyAccessToken);
        self.spotifyAccessTokenExpiration = data.body['expiresInSeconds'] * 1000 + now;
        self.logger.info('New Spotify access token = ' + self.spotifyAccessToken);
        defer.resolve();
      },
      function (err) {
        self.logger.info('Spotify credentials grant failed with ' + err);
      },
    );
  }

  return defer.promise;
};

ControllerSpotify.prototype.oauthLogin = function (data) {
  let self = this;

  self.logger.info('Executing Spotify Oauth Login');

  if (data && data.refresh_token) {
    self.logger.info('Saving Spotify Refresh Token');
    self.config.set('refresh_token', data.refresh_token);

    self
      .spotifyApiConnect()
      .then(function () {
        self.config.set('credentials_type', 'spotify_token');
        self.initializeLibrespotDaemon();
        self.initializeSpotifyBrowsingFacility();
        let config = self.getUIConfig();
        config.then(function (conf) {
          self.commandRouter.broadcastMessage('pushUiConfig', conf);
          self.commandRouter.broadcastMessage('closeAllModals', '');
        });
      })
      .fail(function (e) {
        self.logger.error('Failed to perform Spotify API connection after OAUTH Login: ' + e);
      });
  } else {
    self.logger.error('Could not receive oauth data');
  }
};

ControllerSpotify.prototype.externalOauthLogin = function (data) {
  let self = this;
  let defer = libQ.defer();

  if (data && data.refresh_token) {
    self.logger.info('Saving Spotify Refresh Token');
    self.config.set('refresh_token', data.refresh_token);
    self.spopDaemonConnect();
    setTimeout(() => {
      defer.resolve('');
    }, 150);
  } else {
    self.logger.error('Could not receive oauth data');
    defer.resolve('');
  }
  return defer.promise;
};

ControllerSpotify.prototype.logout = function (avoidBroadcastUiConfig) {
  let self = this;

  let broadcastUiConfig = true;
  if (avoidBroadcastUiConfig === true) {
    broadcastUiConfig = false;
  }

  self.deleteCredentialsFile();
  self.resetSpotifyCredentials();
  setTimeout(() => {
    self.initializeLibrespotDaemon();
  }, 1000);

  self.commandRouter.pushToastMessage('success', self.getI18n('LOGOUT'), self.getI18n('LOGOUT_SUCCESSFUL'));

  self.pushUiConfig(broadcastUiConfig);
  self.removeToBrowseSources();
};

ControllerSpotify.prototype.pushUiConfig = function (broadcastUiConfig) {
  let self = this;

  setTimeout(() => {
    let config = self.getUIConfig();
    config.then((conf) => {
      if (broadcastUiConfig) {
        self.commandRouter.broadcastMessage('pushUiConfig', conf);
      }
    });
  }, 3000);
};

ControllerSpotify.prototype.resetSpotifyCredentials = function () {
  let self = this;

  self.config.set('logged_user_id', '');
  self.config.set('access_token', '');
  self.config.set('refresh_token', '');
  self.config.set('credentials_type', null);

  if (self.spotifyApi) {
    self.spotifyApi.resetCredentials();
  }

  self.accessToken = undefined;
  self.spotifyAccessTokenExpiration = undefined;
  self.loggedInUserId = undefined;
};

ControllerSpotify.prototype.deleteCredentialsFile = function () {
  let self = this;

  self.logger.info('Deleting Spotify credentials File');
  try {
    fs.unlinkSync(credentialsPath);
  } catch (err) {
    self.logger.error('Failed to delete credentials file ' + err);
  }
};

ControllerSpotify.prototype.spotifyApiConnect = function () {
  let self = this;
  let defer = libQ.defer();

  self.spotifyApi = new SpotifyWebApi();

  // Retrieve an access token
  self.spotifyClientCredentialsGrant().then(
    function () {
      self.logger.info('Spotify credentials grant success - running version from March 24, 2019');
      self
        .getUserInformations()
        .then(function () {
          defer.resolve();
        })
        .fail(function (err) {
          defer.reject(err);
          self.logger.error('Spotify credentials failed to read user data: ' + err);
        });
    },
    function (err) {
      self.logger.info('Spotify credentials grant failed with ' + err);
      defer.reject(err);
    },
  );

  return defer.promise;
};

ControllerSpotify.prototype.refreshAccessToken = function () {
  let self = this;
  let defer = libQ.defer();

  let refreshToken = self.config.get('refresh_token', 'none');
  if (refreshToken !== 'none' && refreshToken !== null && refreshToken !== undefined) {
    superagent
      .post('https://oauth-performer.dfs.volumio.org/spotify/accessToken')
      .send({ refreshToken: refreshToken })
      .then(function (results) {
        if (results && results.body && results.body.accessToken) {
          defer.resolve(results);
        } else {
          defer.resject('No access token received');
        }
      })
      .catch(function (err) {
        self.logger.info('An error occurred while refreshing Spotify Token ' + err);
      });
  }

  return defer.promise;
};

ControllerSpotify.prototype.spotifyCheckAccessToken = function () {
  let self = this;
  let defer = libQ.defer();
  let d = new Date();
  let now = d.getTime();

  if (self.spotifyAccessTokenExpiration < now) {
    self.refreshAccessToken().then(function (data) {
      self.spotifyAccessToken = data.body.accessToken;
      self.spotifyApi.setAccessToken(data.body.accessToken);
      self.spotifyAccessTokenExpiration = data.body.expiresInSeconds * 1000 + now;
      self.logger.info('New access token = ' + self.spotifyAccessToken);
      defer.resolve();
    });
  } else {
    defer.resolve();
  }

  return defer.promise;
};

ControllerSpotify.prototype.initializeSpotifyBrowsingFacility = function () {
  let self = this;

  let refreshToken = self.config.get('refresh_token', 'none');
  if (refreshToken !== 'none' && refreshToken !== null && refreshToken !== undefined) {
    self
      .spotifyApiConnect()
      .then(function () {
        self.logger.info('Spotify Successfully logged in');
        self.getRoot();
        self.addToBrowseSources();
      })
      .fail(function (err) {
        self.logger.info('An error occurred while initializing Spotify Browsing facility: ' + err);
      });
  }
};

ControllerSpotify.prototype.getUserInformations = function () {
  let self = this;
  let defer = libQ.defer();

  self.spotifyApi.getMe().then(
    function (data) {
      if (data && data.body) {
        self.debugLog('User informations: ' + JSON.stringify(data.body));
        self.loggedInUserId = data.body.id;
        self.userCountry = data.body.country || 'US';
        self.config.set('logged_user_id', self.loggedInUserId);
        self.isLoggedIn = true;
        defer.resolve('');
      }
    },
    function (err) {
      defer.reject('');
      self.logger.error('Failed to retrieve user informations: ' + err);
    },
  );

  return defer.promise;
};

// CACHE

ControllerSpotify.prototype.flushCache = function () {
  let self = this;

  self.browseCache.flushAll();
};

// ALBUMART

ControllerSpotify.prototype._getAlbumArt = function (item) {
  let albumart = '';
  if (item.hasOwnProperty('images') && item.images.length > 0) {
    albumart = item.images[0].url;
  }
  return albumart;
};

ControllerSpotify.prototype.getAlbumArt = function (data, path) {
  let artist, album;

  if (data != undefined && data.path != undefined) {
    path = data.path;
  }

  let web;

  if (data != undefined && data.artist != undefined) {
    artist = data.artist;
    if (data.album != undefined) album = data.album;
    else album = data.artist;

    web = '?web=' + encodeURIComponent(artist) + '/' + encodeURIComponent(album) + '/large';
  }

  let url = '/albumart';

  if (web != undefined) url = url + web;

  if (web != undefined && path != undefined) url = url + '&';
  else if (path != undefined) url = url + '?';

  if (path != undefined) url = url + 'path=' + encodeURIComponent(path);

  return url;
};

// TRANSLATIONS

ControllerSpotify.prototype.loadI18n = function () {
  let self = this;

  try {
    let language_code = this.commandRouter.sharedVars.get('language_code');
    self.i18n = fs.readJsonSync(__dirname + '/i18n/strings_' + language_code + '.json');
  } catch (e) {
    self.i18n = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
  }

  self.i18nDefaults = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
};

ControllerSpotify.prototype.getI18n = function (key) {
  let self = this;

  if (key.indexOf('.') > 0) {
    let mainKey = key.split('.')[0];
    let secKey = key.split('.')[1];
    if (self.i18n[mainKey][secKey] !== undefined) {
      return self.i18n[mainKey][secKey];
    } else {
      return self.i18nDefaults[mainKey][secKey];
    }
  } else {
    if (self.i18n[key] !== undefined) {
      return self.i18n[key];
    } else {
      return self.i18nDefaults[key];
    }
  }
};

// BROWSING

ControllerSpotify.prototype.addToBrowseSources = function () {
  let data = {
    name: 'Spotify',
    uri: 'spotify',
    plugin_type: 'music_service',
    plugin_name: 'spop',
    albumart: '/albumart?sourceicon=music_service/spop/spotify.png',
  };
  this.commandRouter.volumioAddToBrowseSources(data);
};

ControllerSpotify.prototype.removeToBrowseSources = function () {
  this.commandRouter.volumioRemoveToBrowseSources('Spotify');
};

ControllerSpotify.prototype.handleBrowseUri = function (curUri) {
  let self = this;

  self.commandRouter.logger.info('In handleBrowseUri, curUri=' + curUri);
  let response;

  if (curUri.startsWith('spotify')) {
    if (curUri == 'spotify') {
      response = self.getRoot();
    } else if (curUri.startsWith('spotify/playlists')) {
      if (curUri == 'spotify/playlists')
        response = self.getMyPlaylists(curUri); // use the Spotify Web API instead of the spop service
      else {
        response = self.listWebPlaylist(curUri); // use the function to list playlists returned from the Spotify Web API
      }
    } else if (curUri.startsWith('spotify/myalbums')) {
      response = self.getMyAlbums(curUri);
    } else if (curUri.startsWith('spotify/mytracks')) {
      response = self.getMyTracks(curUri);
    } else if (curUri.startsWith('spotify/myartists')) {
      response = self.getMyArtists(curUri);
    } else if (curUri.startsWith('spotify/mytopartists')) {
      response = self.getTopArtists(curUri);
    } else if (curUri.startsWith('spotify/mytoptracks')) {
      response = self.getTopTracks(curUri);
    } else if (curUri.startsWith('spotify/myrecentlyplayedtracks')) {
      response = self.getRecentTracks(curUri);
    } else if (curUri.startsWith('spotify/featuredplaylists')) {
      response = self.featuredPlaylists(curUri);
    } else if (curUri.startsWith('spotify:user:')) {
      response = self.listWebPlaylist(curUri);
    } else if (curUri.startsWith('spotify:playlist:')) {
      let uriSplitted = curUri.split(':');
      response = self.listWebPlaylist('spotify:user:spotify:playlist:' + uriSplitted[2]);
    } else if (curUri.startsWith('spotify/new')) {
      response = self.listWebNew(curUri);
    } else if (curUri.startsWith('spotify/categories')) {
      response = self.listWebCategories(curUri);
    } else if (curUri.startsWith('spotify:album')) {
      response = self.listWebAlbum(curUri);
    } else if (curUri.startsWith('spotify/category')) {
      response = self.listWebCategory(curUri);
    } else if (curUri.startsWith('spotify:artist:')) {
      response = self.listWebArtist(curUri);
    } else {
      self.logger.info('************* Bad browse Uri:' + curUri);
    }
  }

  return response;
};

ControllerSpotify.prototype.getRoot = function () {
  let self = this;
  let defer = libQ.defer();

  self.browseCache.get('root', function (err, value) {
    if (!err) {
      // Root has not been cached yet
      if (value == undefined) {
        self.listRoot().then((data) => {
          // Set root cache
          self.browseCache.set('root', data);
          defer.resolve(data);
        });
      } else {
        // Cached Root
        defer.resolve(value);
      }
    } else {
      self.logger.error('Could not fetch root spotify folder cached data: ' + err);
    }
  });

  return defer.promise;
};

ControllerSpotify.prototype.listRoot = function () {
  let self = this;
  let defer = libQ.defer();

  let response = {
    navigation: {
      lists: [
        {
          availableListViews: ['grid', 'list'],
          type: 'title',
          title: self.getI18n('MY_MUSIC'),
          items: [
            {
              service: 'spop',
              type: 'streaming-category',
              title: self.getI18n('MY_PLAYLISTS'),
              artist: '',
              album: '',
              albumart: '/albumart?sourceicon=music_service/spop/icons/playlist.png',
              uri: 'spotify/playlists',
            },
            {
              service: 'spop',
              type: 'streaming-category',
              title: self.getI18n('MY_ALBUMS'),
              artist: '',
              album: '',
              albumart: '/albumart?sourceicon=music_service/spop/icons/album.png',
              uri: 'spotify/myalbums',
            },
            {
              service: 'spop',
              type: 'streaming-category',
              title: self.getI18n('MY_TRACKS'),
              artist: '',
              album: '',
              albumart: '/albumart?sourceicon=music_service/spop/icons/track.png',
              uri: 'spotify/mytracks',
            },
            {
              service: 'spop',
              type: 'streaming-category',
              title: self.getI18n('MY_ARTISTS'),
              artist: '',
              album: '',
              albumart: '/albumart?sourceicon=music_service/spop/icons/artist.png',
              uri: 'spotify/myartists',
            },
            {
              service: 'spop',
              type: 'streaming-category',
              title: self.getI18n('MY_TOP_TRACKS'),
              artist: '',
              album: '',
              albumart: '/albumart?sourceicon=music_service/spop/icons/track.png',
              uri: 'spotify/mytoptracks',
            },
            {
              service: 'spop',
              type: 'streaming-category',
              title: self.getI18n('MY_TOP_ARTISTS'),
              artist: '',
              album: '',
              albumart: '/albumart?sourceicon=music_service/spop/icons/artist.png',
              uri: 'spotify/mytopartists',
            },
            {
              service: 'spop',
              type: 'streaming-category',
              title: self.getI18n('MY_RECENTLY_PLAYED_TRACKS'),
              artist: '',
              album: '',
              albumart: '/albumart?sourceicon=music_service/spop/icons/track.png',
              uri: 'spotify/myrecentlyplayedtracks',
            },
          ],
        },
      ],
    },
  };

  let spotifyRootArray = [
    self.featuredPlaylists('spotify/featuredplaylists'),
    self.listWebNew('spotify/new'),
    self.listWebCategories('spotify/categories'),
  ];
  libQ
    .all(spotifyRootArray)
    .then(function (results) {
      let discoveryArray = [
        {
          availableListViews: ['grid', 'list'],
          type: 'title',
          title: self.getI18n('FEATURED_PLAYLISTS'),
          items: results[0].navigation.lists[0].items,
        },
        {
          availableListViews: ['grid', 'list'],
          type: 'title',
          title: self.getI18n('WHATS_NEW'),
          items: results[1].navigation.lists[0].items,
        },
        {
          availableListViews: ['grid', 'list'],
          type: 'title',
          title: self.getI18n('GENRES_AND_MOODS'),
          items: results[2].navigation.lists[0].items,
        },
      ];
      response.navigation.lists = response.navigation.lists.concat(discoveryArray);
      defer.resolve(response);
    })
    .fail(function (err) {
      self.logger.info('An error occurred while getting Spotify ROOT Discover Folders: ' + err);
      defer.resolve(response);
    });

  return defer.promise;
};

ControllerSpotify.prototype.getMyPlaylists = function () {
  let self = this;
  let defer = libQ.defer();

  self.spotifyCheckAccessToken().then(function () {
    let response = {
      navigation: {
        prev: {
          uri: 'spotify',
        },
        lists: [
          {
            availableListViews: ['list', 'grid'],
            items: [],
          },
        ],
      },
    };
    self.spotifyApi.getUserPlaylists(self.loggedInUserId, { limit: 50 }).then(
      function (results) {
        for (let i in results.body.items) {
          let playlist = results.body.items[i];
          response.navigation.lists[0].items.push({
            service: 'spop',
            type: 'playlist',
            title: playlist.name,
            albumart: self._getAlbumArt(playlist),
            uri: 'spotify:user:spotify:playlist:' + playlist.id,
          });
        }

        defer.resolve(response);
      },
      function (err) {
        defer.reject('An error listing Spotify Playlists ' + err.message);
        self.logger.info('An error occurred while listing Spotify getMyPlaylists ' + err.message);
      },
    );
  });

  return defer.promise;
};

ControllerSpotify.prototype.getMyAlbums = function () {
  const defer = libQ.defer();
  const albums = [];

  this.spotifyCheckAccessToken().then(() => {
    fetchPagedData(
      this.spotifyApi,
      'getMySavedAlbums',
      {},
      {
        onData: (items) => {
          for (let i in items) {
            let album = items[i].album;
            albums.push({
              service: 'spop',
              type: 'folder',
              title: album.name,
              albumart: this._getAlbumArt(album),
              uri: album.uri,
            });
          }
        },
        onEnd: () => {
          albums.sort((a, b) => {
            if (a.artist !== b.artist) {
              return a.artist > b.artist ? 1 : -1;
            }
            return a.year > b.year ? 1 : a.year === b.year ? 0 : -1;
          });
          defer.resolve({
            navigation: {
              prev: {
                uri: 'spotify',
              },
              lists: [
                {
                  availableListViews: ['list', 'grid'],
                  items: albums,
                },
              ],
            },
          });
        },
      },
    ).catch((err) => {
      this.logger.error('An error occurred while listing Spotify my albums ' + err);
      defer.reject('');
    });
  });

  return defer.promise;
};

ControllerSpotify.prototype.getMyTracks = function () {
  const defer = libQ.defer();
  const tracks = [];

  this.spotifyCheckAccessToken().then(() => {
    fetchPagedData(
      this.spotifyApi,
      'getMySavedTracks',
      {},
      {
        onData: (items) => {
          for (let i in items) {
            let track = items[i].track;
            if (this.isTrackAvailableInCountry(track)) {
              tracks.push({
                service: 'spop',
                type: 'song',
                title: track.name,
                artist: track.artists[0] ? track.artists[0].name : null,
                album: track.album.name || null,
                albumart: this._getAlbumArt(track.album),
                uri: track.uri,
              });
            }
          }
        },
        onEnd: () => {
          tracks.sort((a, b) => {
            if (a.artist !== b.artist) {
              return a.artist > b.artist ? 1 : -1;
            }
            if (a.year !== b.year) {
              return a.year > b.year ? 1 : -1;
            }
            if (a.album !== b.album) {
              return a.album > b.album ? 1 : -1;
            }
            return a.tracknumber > b.tracknumber ? 1 : a.tracknumber === b.tracknumber ? 0 : -1;
          });
          defer.resolve({
            navigation: {
              prev: {
                uri: 'spotify',
              },
              lists: [
                {
                  availableListViews: ['list'],
                  items: tracks,
                },
              ],
            },
          });
        },
      },
    ).catch((err) => {
      this.logger.error('An error occurred while listing Spotify my tracks ' + err);
      defer.reject('');
    });
  });
  return defer.promise;
};

ControllerSpotify.prototype.getMyArtists = function () {
  const defer = libQ.defer();
  const artists = [];

  this.spotifyCheckAccessToken().then(() => {
    fetchPagedData(
      this.spotifyApi,
      'getFollowedArtists',
      { paginationType: 'after' },
      {
        getItems: (data) => data.body?.artists?.items || [],
        onData: (items) => {
          for (let i in items) {
            const artist = items[i];
            artists.push({
              service: 'spop',
              type: 'folder',
              title: artist.name,
              albumart: this._getAlbumArt(artist),
              uri: artist.uri,
            });
          }
        },
        onEnd: () => {
          artists.sort((a, b) => (a.title > b.title ? 1 : a.title === b.title ? 0 : -1));
          defer.resolve({
            navigation: {
              prev: {
                uri: 'spotify',
              },
              lists: [
                {
                  availableListViews: ['list', 'grid'],
                  items: artists,
                },
              ],
            },
          });
        },
      },
    ).catch((err) => {
      this.logger.error('An error occurred while listing Spotify my artists ' + err);
      this.handleBrowsingError(err);
      defer.reject('');
    });
  });

  return defer.promise;
};

ControllerSpotify.prototype.getTopArtists = function () {
  let self = this;

  let defer = libQ.defer();

  self.spotifyCheckAccessToken().then(function () {
    let spotifyDefer = self.spotifyApi.getMyTopArtists({ limit: 50 });
    spotifyDefer.then(
      function (results) {
        let response = {
          navigation: {
            prev: {
              uri: 'spotify',
            },
            lists: [
              {
                availableListViews: ['list', 'grid'],
                items: [],
              },
            ],
          },
        };

        for (let i in results.body.items) {
          let artist = results.body.items[i];
          response.navigation.lists[0].items.push({
            service: 'spop',
            type: 'folder',
            title: artist.name,
            albumart: self._getAlbumArt(artist),
            uri: artist.uri,
          });
        }
        defer.resolve(response);
      },
      function (err) {
        self.logger.error('An error occurred while listing Spotify my artists ' + err);
        defer.reject('');
      },
    );
  });

  return defer.promise;
};

ControllerSpotify.prototype.getTopTracks = function () {
  let self = this;

  let defer = libQ.defer();

  self.spotifyCheckAccessToken().then(function () {
    let spotifyDefer = self.spotifyApi.getMyTopTracks({ limit: 50 });
    spotifyDefer.then(
      function (results) {
        let response = {
          navigation: {
            prev: {
              uri: 'spotify',
            },
            lists: [
              {
                availableListViews: ['list'],
                items: [],
              },
            ],
          },
        };

        for (let i in results.body.items) {
          let track = results.body.items[i];
          if (self.isTrackAvailableInCountry(track)) {
            response.navigation.lists[0].items.push({
              service: 'spop',
              type: 'song',
              title: track.name,
              artist: track.artists[0].name || null,
              album: track.album.name || null,
              albumart: self._getAlbumArt(track.album),
              uri: track.uri,
            });
          }
        }
        defer.resolve(response);
      },
      function (err) {
        self.logger.error('An error occurred while listing Spotify top tracks ' + err);
        defer.reject('');
      },
    );
  });

  return defer.promise;
};

ControllerSpotify.prototype.getRecentTracks = function () {
  let self = this;

  let defer = libQ.defer();

  self.spotifyCheckAccessToken().then(function () {
    let spotifyDefer = self.spotifyApi.getMyRecentlyPlayedTracks({ limit: 50 });
    spotifyDefer.then(
      function (results) {
        let response = {
          navigation: {
            prev: {
              uri: 'spotify',
            },
            lists: [
              {
                availableListViews: ['list'],
                items: [],
              },
            ],
          },
        };

        for (let i in results.body.items) {
          let track = results.body.items[i].track;
          if (self.isTrackAvailableInCountry(track)) {
            response.navigation.lists[0].items.push({
              service: 'spop',
              type: 'song',
              title: track.name,
              artist: track.artists[0].name || null,
              album: track.album.name || null,
              albumart: self._getAlbumArt(track.album),
              uri: track.uri,
            });
          }
        }
        defer.resolve(response);
      },
      function (err) {
        self.logger.error('An error occurred while listing Spotify recent tracks ' + err);
        defer.reject('');
      },
    );
  });

  return defer.promise;
};

ControllerSpotify.prototype.featuredPlaylists = function () {
  let self = this;

  let defer = libQ.defer();

  self.spotifyCheckAccessToken().then(function () {
    let spotifyDefer = self.spotifyApi.getFeaturedPlaylists();
    spotifyDefer.then(
      function (results) {
        let response = {
          navigation: {
            prev: {
              uri: 'spotify',
            },
            lists: [
              {
                availableListViews: ['list', 'grid'],
                items: [],
              },
            ],
          },
        };

        for (let i in results.body.playlists.items) {
          let playlist = results.body.playlists.items[i];
          response.navigation.lists[0].items.push({
            service: 'spop',
            type: 'playlist',
            title: playlist.name,
            albumart: self._getAlbumArt(playlist),
            uri: playlist.uri,
          });
        }
        defer.resolve(response);
      },
      function (err) {
        self.logger.error('An error occurred while listing Spotify featured playlists ' + err);
        defer.reject('');
      },
    );
  });

  return defer.promise;
};

ControllerSpotify.prototype.listWebPlaylist = function (curUri) {
  let self = this;

  let defer = libQ.defer();

  let uriSplitted = curUri.split(':');

  let spotifyDefer = self.getPlaylistTracks(uriSplitted[2], uriSplitted[4]);
  spotifyDefer.then(function (results) {
    let response = {
      navigation: {
        prev: {
          uri: 'spotify',
        },
        lists: [
          {
            availableListViews: ['list'],
            items: [],
          },
        ],
      },
    };
    for (let i in results) {
      response.navigation.lists[0].items.push(results[i]);
    }
    let playlistInfo = self.getPlaylistInfo(uriSplitted[2], uriSplitted[4]);
    playlistInfo.then(function (results) {
      response.navigation.info = results;
      response.navigation.info.uri = curUri;
      response.navigation.info.service = 'spop';
      defer.resolve(response);
    });
  });

  return defer.promise;
};

ControllerSpotify.prototype.listWebNew = function () {
  let self = this;

  let defer = libQ.defer();

  self.spotifyCheckAccessToken().then(function () {
    let spotifyDefer = self.spotifyApi.getNewReleases({ limit: 50 });
    spotifyDefer.then(
      function (results) {
        let response = {
          navigation: {
            prev: {
              uri: 'spotify',
            },
            lists: [
              {
                availableListViews: ['list', 'grid'],
                items: [],
              },
            ],
          },
        };

        for (let i in results.body.albums.items) {
          let album = results.body.albums.items[i];
          response.navigation.lists[0].items.push({
            service: 'spop',
            type: 'folder',
            title: album.name,
            albumart: self._getAlbumArt(album),
            uri: album.uri,
          });
        }
        defer.resolve(response);
      },
      function (err) {
        self.logger.error('An error occurred while listing Spotify new albums ' + err);
        defer.reject('');
      },
    );
  });

  return defer.promise;
};

ControllerSpotify.prototype.listWebAlbum = function (curUri) {
  let self = this;
  let defer = libQ.defer();
  let uriSplitted = curUri.split(':');

  let spotifyDefer = self.getAlbumTracks(uriSplitted[2], { limit: 50 });
  spotifyDefer.then(function (results) {
    let response = {
      navigation: {
        prev: {
          uri: 'spotify',
        },
        lists: [
          {
            availableListViews: ['list'],
            items: [],
          },
        ],
      },
    };

    for (let i in results) {
      response.navigation.lists[0].items.push(results[i]);
    }
    let albumInfo = self.getAlbumInfo(uriSplitted[2]);
    albumInfo.then(function (results) {
      response.navigation.info = results;
      response.navigation.info.uri = curUri;
      response.navigation.info.service = 'spop';
      defer.resolve(response);
    });
  });

  return defer.promise;
};

ControllerSpotify.prototype.listWebCategories = function () {
  let self = this;

  let defer = libQ.defer();

  self.spotifyCheckAccessToken().then(function () {
    let spotifyDefer = self.spotifyApi.getCategories({ limit: 50 });
    spotifyDefer.then(
      function (results) {
        let response = {
          navigation: {
            prev: {
              uri: 'spotify',
            },
            lists: [
              {
                availableListViews: ['list', 'grid'],
                items: [],
              },
            ],
          },
        };

        for (let i in results.body.categories.items) {
          response.navigation.lists[0].items.push({
            service: 'spop',
            type: 'spotify-category',
            title: results.body.categories.items[i].name,
            albumart: results.body.categories.items[i].icons[0].url,
            uri: 'spotify/category/' + results.body.categories.items[i].id,
          });
        }
        defer.resolve(response);
      },
      function (err) {
        self.logger.error('An error occurred while listing Spotify categories ' + err);
        defer.reject('');
      },
    );
  });

  return defer.promise;
};

ControllerSpotify.prototype.listWebCategory = function (curUri) {
  let self = this;

  let defer = libQ.defer();

  let uriSplitted = curUri.split('/');

  self.spotifyCheckAccessToken().then(function () {
    let spotifyDefer = self.spotifyApi.getPlaylistsForCategory(uriSplitted[2], { limit: 50 });
    spotifyDefer.then(
      function (results) {
        let response = {
          navigation: {
            prev: {
              uri: 'spotify/categories',
            },
            lists: [
              {
                availableListViews: ['list', 'grid'],
                items: [],
              },
            ],
          },
        };

        for (let i in results.body.playlists.items) {
          let playlist = results.body.playlists.items[i];
          response.navigation.lists[0].items.push({
            service: 'spop',
            type: 'folder',
            title: playlist.name,
            albumart: self._getAlbumArt(playlist),
            uri: playlist.uri,
          });
        }
        defer.resolve(response);
      },
      function (err) {
        self.logger.error('An error occurred while listing Spotify playlist category ' + err);
        defer.reject('');
      },
    );
  });

  return defer.promise;
};

ControllerSpotify.prototype.listWebArtist = function (curUri) {
  let self = this;

  let defer = libQ.defer();

  let uriSplitted = curUri.split(':');

  let artistId = uriSplitted[2];

  self.spotifyCheckAccessToken().then(function () {
    let response = {
      navigation: {
        prev: {
          uri: 'spotify',
        },
        lists: [
          {
            availableListViews: ['list'],
            items: [],
            title: 'Top tracks',
          },
          {
            availableListViews: ['list', 'grid'],
            items: [],
            title: 'Albums',
          },
          {
            availableListViews: ['list'],
            items: [],
            title: 'Related Artists',
          },
        ],
      },
    };
    let spotifyDefer = self.listArtistTracks(artistId);
    spotifyDefer
      .then(function (results) {
        for (let i in results) {
          response.navigation.lists[0].items.push(results[i]);
        }
        return response;
      })
      .then(function () {
        return self.listArtistAlbums(artistId);
      })
      .then(function (results) {
        for (let i in results) {
          response.navigation.lists[1].items.push(results[i]);
        }
        return response;
      })
      .then(function () {
        return self.getArtistInfo(artistId);
      })
      .then(function (results) {
        response.navigation.info = results;
        response.navigation.info.uri = curUri;
        response.navigation.info.service = 'spop';

        return response;
      })
      .then(function () {
        return self.getArtistRelatedArtists(artistId);
      })
      .then(function (results) {
        for (let i in results) {
          response.navigation.lists[2].items.push(results[i]);
        }
        defer.resolve(response);
        return response;
      })
      .catch(function () {
        defer.resolve(response);
      });
  });

  return defer.promise;
};

ControllerSpotify.prototype.listArtistTracks = function (id) {
  let self = this;

  let defer = libQ.defer();

  let list = [];

  let spotifyDefer = self.getArtistTopTracks(id);
  spotifyDefer.then(function (data) {
    for (let i in data) {
      list.push(data[i]);
    }
    defer.resolve(list);
  });

  return defer.promise;
};

ControllerSpotify.prototype.listArtistAlbums = function (id) {
  let self = this;

  let defer = libQ.defer();

  let spotifyDefer = self.spotifyApi.getArtistAlbums(id);
  spotifyDefer.then(function (results) {
    let response = [];
    for (let i in results.body.items) {
      let album = results.body.items[i];
      response.push({
        service: 'spop',
        type: 'folder',
        title: album.name,
        albumart: self._getAlbumArt(album),
        uri: album.uri,
      });
    }
    defer.resolve(response);
  });

  return defer.promise;
};

ControllerSpotify.prototype.getArtistTracks = function (id) {
  let self = this;

  let defer = libQ.defer();

  let list = [];

  let spotifyDefer = self.getArtistTopTracks(id);
  spotifyDefer
    .then(function (data) {
      for (let i in data) {
        list.push(data[i]);
      }
      return list;
    })
    .then(function (data) {
      let spotifyDefer = self.getArtistAlbumTracks(id);
      spotifyDefer.then(function (results) {
        let response = data;
        for (let i in results) {
          response.push(results[i]);
        }
        defer.resolve(response);
      });
    });

  return defer.promise;
};

ControllerSpotify.prototype.getArtistAlbumTracks = function (id) {
  let self = this;

  let defer = libQ.defer();

  let spotifyDefer = self.spotifyApi.getArtistAlbums(id);
  spotifyDefer
    .then(function (results) {
      //	var response = data;
      return results.body.items.map(function (a) {
        return a.id;
      });
    })
    .then(function (albums) {
      let spotifyDefer = self.spotifyApi.getAlbums(albums);
      spotifyDefer.then(function (data) {
        let results = data;
        let response = [];
        for (let i in results.body.albums) {
          let album = results.body.albums[i];
          for (let j in album.tracks.items) {
            let track = album.tracks.items[j];
            if (self.isTrackAvailableInCountry(track)) {
              response.push({
                service: 'spop',
                type: 'song',
                name: track.name,
                title: track.name,
                artist: track.artists[0].name,
                album: album.name,
                albumart: self._getAlbumArt(album),
                uri: track.uri,
              });
            }
          }
        }
        defer.resolve(response);
      });
    });

  return defer.promise;
};

ControllerSpotify.prototype.getArtistAlbums = function (artistId) {
  let self = this;

  let defer = libQ.defer();

  self.spotifyCheckAccessToken().then(function () {
    let spotifyDefer = self.spotifyApi.getArtistAlbums(artistId);
    spotifyDefer.then(function (results) {
      let response = [];
      for (let i in results.body.items) {
        let album = results.body.items[i];
        response.push({
          service: 'spop',
          type: 'folder',
          title: album.name,
          albumart: self._getAlbumArt(album),
          uri: album.uri,
        });
      }
      defer.resolve(response);
    });
  });
  return defer.promise;
};

ControllerSpotify.prototype.getArtistRelatedArtists = function (artistId) {
  let self = this;

  let defer = libQ.defer();

  let list = [];

  self.spotifyCheckAccessToken().then(function () {
    let spotifyDefer = self.spotifyApi.getArtistRelatedArtists(artistId);
    spotifyDefer.then(function (results) {
      for (let i in results.body.artists) {
        let artist = results.body.artists[i];
        let albumart = self._getAlbumArt(artist);
        let item = {
          service: 'spop',
          type: 'folder',
          title: artist.name,
          albumart: albumart,
          uri: artist.uri,
        };
        if (albumart == '') {
          item.icon = 'fa fa-user';
        }
        list.push(item);
      }
      defer.resolve(list);
    });
  });

  return defer.promise;
};

ControllerSpotify.prototype.getAlbumTracks = function (id) {
  let self = this;
  let defer = libQ.defer();

  self.spotifyCheckAccessToken().then(function () {
    let spotifyDefer = self.spotifyApi.getAlbum(id);
    spotifyDefer.then(
      function (results) {
        let response = [];
        let album = results.body.name;
        let albumart = results.body.images[0].url;
        for (let i in results.body.tracks.items) {
          let track = results.body.tracks.items[i];
          if (self.isTrackAvailableInCountry(track)) {
            response.push({
              service: 'spop',
              type: 'song',
              title: track.name,
              name: track.name,
              artist: track.artists[0].name,
              album: album,
              albumart: albumart,
              uri: track.uri,
              samplerate: self.getCurrentBitrate(),
              bitdepth: '16 bit',
              bitrate: '',
              codec: 'ogg',
              trackType: 'spotify',
              duration: Math.trunc(track.duration_ms / 1000),
            });
          }
        }
        defer.resolve(response);
      },
      function (err) {
        self.logger.error('An error occurred while listing Spotify album tracks ' + err);
        defer.reject('');
      },
    );
  });

  return defer.promise;
};

ControllerSpotify.prototype.getPlaylistTracks = function (userId, playlistId) {
  let defer = libQ.defer();
  let response = [];

  this.spotifyCheckAccessToken().then(() => {
    fetchPagedData(
      this.spotifyApi,
      'getPlaylistTracks',
      { requiredArgs: [playlistId] },
      {
        onData: (items) => {
          for (let i in items) {
            let track = items[i].track;
            if (this.isTrackAvailableInCountry(track)) {
              let item = {
                service: 'spop',
                type: 'song',
                name: track.name,
                title: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                uri: track.uri,
                samplerate: this.getCurrentBitrate(),
                bitdepth: '16 bit',
                bitrate: '',
                codec: 'ogg',
                trackType: 'spotify',
                albumart:
                  track.album.hasOwnProperty('images') && track.album.images.length > 0
                    ? track.album.images[0].url
                    : '',
                duration: Math.trunc(track.duration_ms / 1000),
              };
              response.push(item);
            }
          }
        },
        onEnd: () => {
          defer.resolve(response);
        },
      },
    ).catch((err) => {
      this.logger.error('An error occurred while exploding listing Spotify playlist tracks ' + err);
      defer.reject(err);
    });
  });

  return defer.promise;
};

ControllerSpotify.prototype.getArtistTopTracks = function (id) {
  let self = this;
  let defer = libQ.defer();

  self.spotifyCheckAccessToken().then(function () {
    let spotifyDefer = self.spotifyApi.getArtistTopTracks(id, 'GB');
    spotifyDefer.then(
      function (results) {
        let response = [];
        for (let i in results.body.tracks) {
          let albumart = '';
          let track = results.body.tracks[i];
          if (track.album.hasOwnProperty('images') && track.album.images.length > 0) {
            albumart = track.album.images[0].url;
          }
          if (self.isTrackAvailableInCountry(track)) {
            response.push({
              service: 'spop',
              type: 'song',
              name: track.name,
              title: track.name,
              artist: track.artists[0].name,
              album: track.album.name,
              albumart: albumart,
              duration: parseInt(track.duration_ms / 1000),
              samplerate: self.getCurrentBitrate(),
              bitdepth: '16 bit',
              bitrate: '',
              codec: 'ogg',
              trackType: 'spotify',
              uri: track.uri,
            });
          }
        }
        defer.resolve(response);
      },
      function (err) {
        self.logger.error('An error occurred while listing Spotify artist tracks ' + err);
        defer.reject('');
      },
    );
  });

  return defer.promise;
};

ControllerSpotify.prototype.getArtistInfo = function (id) {
  let self = this;
  let defer = libQ.defer();

  let info = {};
  self.spotifyCheckAccessToken().then(function () {
    let spotifyDefer = self.spotifyApi.getArtist(id);
    spotifyDefer.then(
      function (results) {
        if (results && results.body && results.body.name) {
          info.title = results.body.name;
          info.albumart = results.body.images[0].url;
          info.type = 'artist';
        }
        defer.resolve(info);
      },
      function (err) {
        self.logger.info('An error occurred while listing Spotify artist informations ' + err);
        defer.resolve(info);
      },
    );
  });

  return defer.promise;
};

ControllerSpotify.prototype.getAlbumInfo = function (id) {
  let self = this;
  let defer = libQ.defer();

  let info = {};
  self.spotifyCheckAccessToken().then(function () {
    let spotifyDefer = self.spotifyApi.getAlbum(id);
    spotifyDefer
      .then(function (results) {
        if (results && results.body && results.body.name) {
          info.album = results.body.name;
          info.artist = results.body.artists[0].name;

          info.albumart = results.body.images[0].url;
          info.type = 'album';
        }
        return results.body.artists[0].id;
      })
      .then(function (artist) {
        return self.spotifyApi.getArtist(artist);
      })
      .then(
        function (artistResults) {
          if (artistResults && artistResults.body && artistResults.body.name) {
            info.artistImage = artistResults.body.images[0].url;
            info.artistUri = artistResults.body.uri;
          }
          defer.resolve(info);
        },
        function (err) {
          self.logger.error('An error occurred while listing Spotify album informations ' + err);
          defer.resolve(info);
        },
      );
  });

  return defer.promise;
};

ControllerSpotify.prototype.getPlaylistInfo = function (userId, playlistId) {
  let self = this;
  let defer = libQ.defer();

  let info = {};
  self.spotifyCheckAccessToken().then(function () {
    let spotifyDefer = self.spotifyApi.getPlaylist(playlistId);
    spotifyDefer.then(
      function (results) {
        if (results && results.body && results.body.name) {
          info.title = results.body.name;
          info.albumart = results.body.images[0].url;
          info.type = 'album';
          info.service = 'spop';
        }
        defer.resolve(info);
      },
      function (err) {
        defer.resolve(info);
        self.logger.error('An error occurred while getting Playlist info: ' + err);
      },
    );
  });

  return defer.promise;
};

ControllerSpotify.prototype.getTrack = function (id) {
  let defer = libQ.defer();

  this.spotifyCheckAccessToken().then(() => {
    rateLimitedCall(this.spotifyApi, 'getTrack', { args: [id], logger: this.logger })
      .then((results) => {
        const track = results.body;
        let response = [];
        let artist = '';
        let album = '';
        let albumart = '';

        if (track.artists.length > 0) {
          artist = track.artists[0].name;
        }

        if (track.hasOwnProperty('album') && track.album.hasOwnProperty('name')) {
          album = track.album.name;
        }

        if (track.album.hasOwnProperty('images') && track.album.images.length > 0) {
          albumart = track.album.images[0].url;
        } else {
          albumart = '';
        }

        let item = {
          uri: track.uri,
          service: 'spop',
          name: track.name,
          artist: artist,
          album: album,
          type: 'song',
          duration: parseInt(track.duration_ms / 1000),
          albumart: albumart,
          samplerate: this.getCurrentBitrate(),
          bitdepth: '16 bit',
          bitrate: '',
          codec: 'ogg',
          trackType: 'spotify',
        };
        response.push(item);
        this.debugLog('GET TRACK: ' + JSON.stringify(response));
        defer.resolve(response);
      })
      .catch((e) => {
        defer.reject(e);
      });
  });
  return defer.promise;
};

// SEARCH FUNCTIONS
ControllerSpotify.prototype.search = function (query) {
  let self = this;
  let defer = libQ.defer();

  self.spotifyCheckAccessToken().then(function () {
    let spotifyDefer = self.spotifyApi.search(query.value, ['artist', 'album', 'playlist', 'track']);
    spotifyDefer.then(
      function (results) {
        let list = [];
        // Show artists, albums, playlists then tracks
        if (results.body.hasOwnProperty('artists') && results.body.artists.items.length > 0) {
          let artistlist = [];
          let artists = self._searchArtists(results);
          for (const i in artists) {
            artistlist.push(artists[i]);
          }
          list.push({
            type: 'title',
            title: 'Spotify ' + self.commandRouter.getI18nString('COMMON.SEARCH_ARTIST_SECTION'),
            availableListViews: ['list', 'grid'],
            items: artistlist,
          });
        }
        if (results.body.hasOwnProperty('albums') && results.body.albums.items.length > 0) {
          let albumlist = [];
          let albums = self._searchAlbums(results);
          for (const i in albums) {
            albumlist.push(albums[i]);
          }
          list.push({
            type: 'title',
            title: 'Spotify ' + self.commandRouter.getI18nString('COMMON.SEARCH_ALBUM_SECTION'),
            availableListViews: ['list', 'grid'],
            items: albumlist,
          });
        }
        if (results.body.hasOwnProperty('playlists') && results.body.playlists.items.length > 0) {
          let playlistlist = [];
          let playlists = self._searchPlaylists(results);
          for (const i in playlists) {
            playlistlist.push(playlists[i]);
          }
          list.push({
            type: 'title',
            title: 'Spotify ' + self.commandRouter.getI18nString('COMMON.PLAYLISTS'),
            availableListViews: ['list', 'grid'],
            items: playlistlist,
          });
        }
        if (results.body.hasOwnProperty('tracks') && results.body.tracks.items.length > 0) {
          let songlist = [];
          let tracks = self._searchTracks(results);
          for (const i in tracks) {
            songlist.push(tracks[i]);
          }
          list.push({
            type: 'title',
            title: 'Spotify ' + self.commandRouter.getI18nString('COMMON.TRACKS'),
            availableListViews: ['list'],
            items: songlist,
          });
        }
        defer.resolve(list);
      },
      function (err) {
        self.logger.error('An error occurred while searching ' + err);
        defer.reject('');
      },
    );
  });

  return defer.promise;
};

ControllerSpotify.prototype._searchArtists = function (results) {
  let list = [];

  for (let i in results.body.artists.items) {
    let albumart = '';
    let artist = results.body.artists.items[i];
    if (artist.hasOwnProperty('images') && artist.images.length > 0) {
      albumart = artist.images[0].url;
    }
    let item = {
      service: 'spop',
      type: 'folder',
      title: artist.name,
      albumart: albumart,
      uri: artist.uri,
    };
    if (albumart == '') {
      item.icon = 'fa fa-user';
    }
    list.push(item);
  }

  return list;
};

ControllerSpotify.prototype._searchAlbums = function (results) {
  let list = [];

  for (let i in results.body.albums.items) {
    let albumart = '';
    let album = results.body.albums.items[i];
    if (album.hasOwnProperty('images') && album.images.length > 0) {
      albumart = album.images[0].url;
    }
    let artist = '';
    if (album.artists && album.artists[0] && album.artists[0].name) {
      artist = album.artists[0].name;
    }

    list.push({
      service: 'spop',
      type: 'folder',
      title: album.name,
      artist: artist,
      albumart: albumart,
      uri: album.uri,
    });
  }

  return list;
};

ControllerSpotify.prototype._searchPlaylists = function (results) {
  let list = [];

  for (let i in results.body.playlists.items) {
    let albumart = '';
    let playlist = results.body.playlists.items[i];
    if (playlist.hasOwnProperty('images') && playlist.images.length > 0) {
      albumart = playlist.images[0].url;
    }
    list.push({
      service: 'spop',
      type: 'folder',
      title: playlist.name,
      albumart: albumart,
      uri: playlist.uri,
    });
  }

  return list;
};

ControllerSpotify.prototype._searchTracks = function (results) {
  let list = [];

  for (let i in results.body.tracks.items) {
    let albumart = '';
    let track = results.body.tracks.items[i];
    if (track.album.hasOwnProperty('images') && track.album.images.length > 0) {
      albumart = track.album.images[0].url;
    }
    list.push({
      service: 'spop',
      type: 'song',
      title: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      albumart: albumart,
      uri: track.uri,
    });
  }

  return list;
};

ControllerSpotify.prototype._searchTracks = function (results) {
  let list = [];

  for (let i in results.body.tracks.items) {
    let albumart = '';
    let track = results.body.tracks.items[i];
    if (track.album.hasOwnProperty('images') && track.album.images.length > 0) {
      albumart = track.album.images[0].url;
    }
    list.push({
      service: 'spop',
      type: 'song',
      title: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      albumart: albumart,
      uri: track.uri,
    });
  }

  return list;
};

ControllerSpotify.prototype.searchArtistByName = function (artistName) {
  let self = this;
  let defer = libQ.defer();

  self.spotifyApi.search(artistName, ['artist']).then((results) => {
    if (results.body.hasOwnProperty('artists') && results.body.artists.items.length > 0) {
      let artistResult = results.body.artists.items[0];
      self
        .listWebArtist('spotify:artist:' + artistResult.id)
        .then((result) => {
          defer.resolve(result);
        })
        .fail((error) => {
          defer.reject(error);
        });
    } else {
      defer.reject('No artist found');
    }
  });
  return defer.promise;
};

ControllerSpotify.prototype.searchAlbumByName = function (albumName) {
  let self = this;
  let defer = libQ.defer();

  let spotifyDefer = self.spotifyApi.search(albumName, ['album']);
  spotifyDefer.then((results) => {
    if (results.body.hasOwnProperty('albums') && results.body.albums.items.length > 0) {
      let albumResult = results.body.albums.items[0];
      self
        .listWebAlbum('spotify:album:' + albumResult.id)
        .then((result) => {
          defer.resolve(result);
        })
        .fail((error) => {
          defer.reject(error);
        });
    } else {
      defer.reject('No album found');
    }
  });
  return defer.promise;
};

ControllerSpotify.prototype.goto = function (data) {
  let self = this;

  if (data.type == 'artist') {
    return self.searchArtistByName(data.value);
  } else if (data.type == 'album') {
    return this.searchAlbumByName(data.value);
  }
};

// PLUGIN FUNCTIONS

ControllerSpotify.prototype.debugLog = function (stringToLog) {
  if (isDebugMode) {
    console.log('SPOTIFY: ' + stringToLog);
  }
};

ControllerSpotify.prototype.isTrackAvailableInCountry = function (currentTrackObj) {
  let self = this;

  if (
    self.userCountry &&
    self.userCountry.length &&
    currentTrackObj &&
    currentTrackObj.available_markets &&
    currentTrackObj.available_markets.length
  ) {
    if (currentTrackObj.available_markets.includes(self.userCountry)) {
      return true;
    } else {
      return false;
    }
  } else {
    return true;
  }
};

ControllerSpotify.prototype.explodeUri = function (uri) {
  let self = this;

  self.debugLog('EXPLODING URI:' + uri);

  let defer = libQ.defer();

  let uriSplitted;

  let response;

  if (uri.startsWith('spotify/playlists')) {
    response = self.getMyPlaylists();
    defer.resolve(response);
  } else if (uri.startsWith('spotify:playlist:')) {
    uriSplitted = uri.split(':');
    response = self.getPlaylistTracks(uriSplitted[0], uriSplitted[2]);
    defer.resolve(response);
  } else if (uri.startsWith('spotify:artist:')) {
    uriSplitted = uri.split(':');
    response = self.getArtistTracks(uriSplitted[2]);
    defer.resolve(response);
  } else if (uri.startsWith('spotify:album:')) {
    uriSplitted = uri.split(':');
    response = self.getAlbumTracks(uriSplitted[2]);
    defer.resolve(response);
  } else if (uri.startsWith('spotify:user:')) {
    uriSplitted = uri.split(':');
    response = self.getPlaylistTracks(uriSplitted[2], uriSplitted[4]);
    defer.resolve(response);
  } else if (uri.startsWith('spotify:track:')) {
    uriSplitted = uri.split(':');
    response = self.getTrack(uriSplitted[2]);
    defer.resolve(response);
  } else {
    self.logger.info('Bad URI while exploding Spotify URI: ' + uri);
  }

  return defer.promise;
};

ControllerSpotify.prototype.seekTimerAction = function () {
  if (this.state.status === 'play') {
    if (seekTimer === undefined) {
      seekTimer = setInterval(() => {
        this.state.seek = this.state.seek + 1000;
      }, 1000);
    }
  } else {
    clearInterval(seekTimer);
    seekTimer = undefined;
  }
};

ControllerSpotify.prototype.getLabelForSelect = function (options, key) {
  let n = options.length;
  for (let i = 0; i < n; i++) {
    if (options[i].value === key) {
      return options[i].label;
    }
  }

  return 'VALUE NOT FOUND BETWEEN SELECT OPTIONS!';
};

ControllerSpotify.prototype.getSpotifyVolume = function () {
  let self = this;

  self.logger.info('Getting Spotify volume');
  superagent
    .get(spotifyLocalApiEndpointBase + '/player/volume')
    .accept('application/json')
    .then((results) => {
      if (results && results.body && results.body.value) {
        self.logger.info('Spotify volume: ' + results.body.value);
        currentSpotifyVolume = results.body.value;
      }
    });
};
