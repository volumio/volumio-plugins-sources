'use strict';

const path = require('path');
global.ytcrPluginLibRoot = path.resolve(__dirname) + '/lib';

const libQ = require('kew');
const ni = require('network-interfaces');
const receiver = require('yt-cast-receiver');
const ytcr = require(ytcrPluginLibRoot + '/ytcr');
const MPDPlayer = require(ytcrPluginLibRoot + '/mpd-player');

const PLAYER_TO_VOLUMIO_STATUSES = {
    [MPDPlayer.STATUS_PLAYING]: 'play',
    [MPDPlayer.STATUS_PAUSED]: 'pause',
    [MPDPlayer.STATUS_STOPPED]: 'stop'
};

const EMPTY_STATE = {
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

module.exports = ControllerYTCR;

function ControllerYTCR(context) {
    this.context = context;
    this.commandRouter = this.context.coreCommand;
    this.logger = this.context.logger;
    this.configManager = this.context.configManager;
    this.serviceName = 'ytcr';
    this.isConnected = false;
}

ControllerYTCR.prototype.logDebug = function(...messages) {
    if (this.debug) {
        console.log(...messages);
    }
}

ControllerYTCR.prototype.getUIConfig = function() {
    let self = this;
    let defer = libQ.defer();

    let lang_code = self.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
        __dirname + '/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then((uiconf) => {
            let connectionUIConf = uiconf.sections[0];
            let otherUIConf = uiconf.sections[1];

            let port = ytcr.getConfigValue('port', 8098);
            let defaultAutoplay = ytcr.getConfigValue('defaultAutoplay', true);
            let debug = ytcr.getConfigValue('debug', false);
            let bindToIf = ytcr.getConfigValue('bindToIf', '');

            let availableIf = getNetworkInterfaces();
            let ifOpts = [{
                value: '',
                label: ytcr.getI18n('YTCR_BIND_TO_ALL_IF')
            }];
            connectionUIConf.content[1].value = ifOpts[0];
            availableIf.forEach( info => {
                let opt = {
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
            otherUIConf.content[0].value = defaultAutoplay;
            otherUIConf.content[1].value = debug;

            let connectionStatus;
            if (self.isConnected && self.connectedClient) {
                connectionStatus = ytcr.getI18n('YTCR_CONNECTED', self.connectedClient.name);
            }
            else {
                connectionStatus = ytcr.getI18n('YTCR_IDLE');
            }
            connectionUIConf.label = ytcr.getI18n('YTCR_CONNECTION', connectionStatus);

            defer.resolve(uiconf);
        })
        .fail((error) => {
            ytcr.getLogger().error('[ytcr] getUIConfig(): Cannot populate YouTube Cast Receiver configuration - ' + error);
            defer.reject(new Error());
        }
        );

    return defer.promise;
}

ControllerYTCR.prototype.configSaveConnection = function(data) {
    let oldPort = ytcr.getConfigValue('port', 8098);
    let port = parseInt(data['port'], 10);
    if (port < 1024 || port > 65353) {
        ytcr.toast('error', ytcr.getI18n('YTCR_INVALID_PORT'));
        return;
    }
    let oldBindToIf = ytcr.getConfigValue('bindToIf', '');
    let bindToIf = data['bindToIf'].value;

    if (oldPort !== port || oldBindToIf !== bindToIf) {
        if (this.isConnected && this.connectedClient) {
            var modalData = {
                title: ytcr.getI18n('YTCR_CONFIGURATION'),
                message: ytcr.getI18n('YTCR_CONF_RESTART_CONFIRM', this.connectedClient.name),
                size: 'lg',
                buttons: [
                  {
                    name: ytcr.getI18n('YTCR_NO'),
                    class: 'btn btn-warning',
                  },
                  {
                    name: ytcr.getI18n('YTCR_YES'),
                    class: 'btn btn-info',
                    emit: 'callMethod',
                    payload: {
                        'endpoint': 'music_service/ytcr',
                        'method': 'configConfirmSaveConnection',
                        'data': {port, bindToIf}
                    }
                  }  
                ]
            };
            this.commandRouter.broadcastMessage("openModal", modalData);
        }
        else {
            this.configConfirmSaveConnection({port, bindToIf});
        }
    }
    else {
        ytcr.toast('success', ytcr.getI18n('YTCR_SETTINGS_SAVED'));
    }
}

ControllerYTCR.prototype.configConfirmSaveConnection = function(data) {
    let self = this;
    self.config.set('port', data['port']);
    self.config.set('bindToIf', data['bindToIf']);
    self.restart().then( () => {
        self.refreshUIConfig();
        ytcr.toast('success', ytcr.getI18n('YTCR_RESTARTED'));
    });
}

ControllerYTCR.prototype.configSaveOther = function(data) {
    this.config.set('defaultAutoplay', data['defaultAutoplay']);
    this.config.set('debug', data['debug']);

    this.debug = data['debug'];
    if (this.receiver) {
        this.receiver.setDefaultAutoplay(data['defaultAutoplay']);
        this.receiver.setDebug(data['debug']);
    }
    if (this.player) {
        this.player.setDebug(data['debug']);
    }

    ytcr.toast('success', ytcr.getI18n('YTCR_SETTINGS_SAVED'));
}

ControllerYTCR.prototype.refreshUIConfig = function() {
    let self = this;
    self.commandRouter.getUIConfigOnPlugin('music_service', 'ytcr', {}).then((config) => {
        self.commandRouter.broadcastMessage('pushUiConfig', config);
    });
}

ControllerYTCR.prototype.onVolumioStart = function() {
    let configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
    this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);

    return libQ.resolve();
}

ControllerYTCR.prototype.onStart = function() {
    let self = this;
    let defer = libQ.defer();

    ytcr.init(self.context, self.config);
    self.isUnsettingVolatile = false;

    self.debug = ytcr.getConfigValue('debug', false);
    self.volumeControl = new VolumeControl(self.commandRouter, {
        logDebug: self.logDebug.bind(self)
    });

    let playerOptions = {
        mpd: self.getMpdConfig(),
        volumeControl: self.volumeControl,
        autoRequestPlayNext: false,
        debug: ytcr.getConfigValue('debug', false)
    }
    MPDPlayer.instance(playerOptions).then(player => {
        let bindToIf = ytcr.getConfigValue('bindToIf', '');
        self.player = player;
        self.receiver = receiver.instance(player, { 
            port: ytcr.getConfigValue('port', 8098),
            bindToInterfaces: hasNetworkInterface(bindToIf) ? [bindToIf] : undefined,
            defaultAutoplay: ytcr.getConfigValue('defaultAutoplay', true),
            debug: self.debug
        });

        self.receiver.on('connected', client => {
            self.logger.info('[ytcr] ***** Connected *****');
            self.isConnected = true;
            self.connectedClient = client;
            ytcr.toast('success', ytcr.getI18n('YTCR_CONNECTED', client.name));
            self.refreshUIConfig();
        });
        self.receiver.on('disconnected', client => {
            self.logger.info('[ytcr] ***** Disconnected *****');
            self.isConnected = false;
            self.connectedClient = null;
            self.player.stop();
            ytcr.toast('warning', ytcr.getI18n('YTCR_DISCONNECTED', client.name));
            self.refreshUIConfig();
        });

        self.player.on('command', async(cmd, args) => {
            if (cmd === 'play' && !self.isCurrentService()) {
                self.logDebug('[ytcr] play command received while not being the current service.');
                // Stop any playback by the currently active service
                self.logDebug('[ytcr] Stopping playback by current service...');
                try {
                    await kewToJSPromise(self.commandRouter.volumioStop());
                } catch (error) {
                    self.logDebug('[ytcr] An error occurred while stopping playback by current service: ', error);
                    self.logDebug('[ytcr] Continuing anyway...');
                }
                // Unset any volatile state of currently active service
                let sm = ytcr.getStateMachine();
                if (sm.isVolatile) {
                    sm.unSetVolatile();
                }
                self.logDebug('[ytcr] Setting ourselves as the current service...');
                self.setVolatile();
                await self.pushEmptyState();
                await self.player.notifyVolumeChanged();
            }
            else if (cmd === 'setVolume' && !self.isCurrentService()) {
                self.logDebug('[ytcr] setVolume command received, but we are not the current service. Putting player to sleep...');
                self.player.sleep();
            }
        });

        self.player.on('stateChanged', async(state, moreInfo) => {
            if (self.isCurrentService() && self.isConnected) {
                self.logDebug('[ytcr] Received stateChanged from player: ', state);
                if (state.status === MPDPlayer.STATUS_PLAYING && moreInfo.triggeredBy === 'play') {
                    ytcr.toast('success', ytcr.getI18n('YTCR_PLAY_STARTED', state.title));
                }
                if (state.status === MPDPlayer.STATUS_STOPPED) {
                    self.player.sleep();
                    await self.pushEmptyState();

                    if (moreInfo.triggeredBy === 'playbackFinished') {
                        self.logDebug('[ytcr] Playback finished - request play next.');
                        await self.player.requestPlayNext();
                    }                    
                }
                else {
                    await self.pushState(state);
                }
            }
        });

        if (!self.volumioSetVolumeCallback) {
            self.volumioSetVolumeCallback = async(volume) => {
                if (self.isCurrentService() && self.isConnected) {
                    // setVolume() will trigger volumioupdatevolume() which will trigger the statemachine's 
                    // pushState() - but old volatile state with outdated info will be used. 
                    // So we push the latest state here to refresh the old volatile state.
                    self.logDebug(`[ytcr] Update volume to ${volume.vol}`);
                    await self.pushState();
                    await self.volumeControl.setVolume(volume.vol, 'volumio');
                    await self.pushState(); // Do it once more
                    await self.player.notifyVolumeChanged();
                }
                else {
                    // Even if not current service, we keep track of the updated volume
                    await self.volumeControl.setVolume(volume.vol, 'volumio');
                }
            };
            // Note: once added, the callback cannot be removed because there's no such function
            // in commandRouter! This means the callback will still be around even when the plugin
            // is stopped!!
            self.commandRouter.addCallback('volumioupdatevolume', self.volumioSetVolumeCallback);
        }

        self.player.on('error', data => {
            if (data.code === MPDPlayer.ERROR_TRACK_LOAD_FAILED) {
                ytcr.toast('error', ytcr.getI18n('YTCR_TRACK_LOAD_FAILED', data.videoId, data.message));
            }
            else if (data.code === MPDPlayer.ERROR_TRACK_UNPLAYABLE) {
                ytcr.toast('warning', ytcr.getI18n('YTCR_TRACK_UNPLAYABLE', data.trackInfo.title, data.message));
            }
        });

        self.receiver.start();

        defer.resolve();
    })
    .catch(error => {
        self.logDebug(error.stack);
        defer.reject(error);
    });

    return defer.promise;
}

ControllerYTCR.prototype.onStop = function() {
    let self = this;
    let defer = libQ.defer();

    self.receiver.stop().then(async () => {
        self.unsetVolatile();
        await self.player.destroy();
        self.isConnected = false;
        ytcr.reset();
        defer.resolve();
    })
    .catch(error => {
        self.logDebug(error.stack)
        defer.reject(error);
    });

    return defer.promise;
}

ControllerYTCR.prototype.restart = function() {
    let self = this;
    return self.onStop().then( () => {
        self.onStart();
    });
}

ControllerYTCR.prototype.getConfigurationFiles = function() {
    return ['config.json'];
}

ControllerYTCR.prototype.getMpdConfig = function() {
    let mpdPlugin = this.commandRouter.pluginManager.getPlugin('music_service', 'mpd');
    return {
        host: mpdPlugin.config.get('nHost'),
        port: mpdPlugin.config.get('nPort')
    };
}

ControllerYTCR.prototype.setVolatile = function() {
    if (!this.volatileCallback) {
        this.volatileCallback = this.onUnsetVolatile.bind(this);
    }
    if (!this.isCurrentService()) {
        ytcr.getStateMachine().setVolatile({
            service: this.serviceName,
            callback: this.volatileCallback
        });
        ytcr.getMpdPlugin().ignoreUpdate(true);
        ytcr.getStateMachine().setConsumeUpdateService(undefined);
    }
}

ControllerYTCR.prototype.unsetVolatile = function() {
    ytcr.getStateMachine().unSetVolatile();
}

ControllerYTCR.prototype.onUnsetVolatile = function() {
    this.isUnsettingVolatile = true;
    
    return this.pushEmptyState().then( () => {
        ytcr.getMpdPlugin().ignoreUpdate(false);
        return this.player.stop();
    });
}

ControllerYTCR.prototype.pushEmptyState = async function() {
    this.logDebug('[ytcr] Pushing empty state...');
    // Need to first push empty state with pause status first so the empty volatileState gets registered 
    // by statemachine.
    this.commandRouter.servicePushState(Object.assign(EMPTY_STATE, { status: 'pause' }), this.serviceName);
    // Then push empty state with stop status
    this.commandRouter.servicePushState(EMPTY_STATE, this.serviceName);
}

ControllerYTCR.prototype.pushState = async function(state) {

    if (state == undefined) {
        state = await this.player.getState();
    }

    let volumioState = {
        status: PLAYER_TO_VOLUMIO_STATUSES[state.status],
        service: this.serviceName,
        title: state.title,
        artist: state.channelTitle,
        album: 'Youtube Cast',
        albumart: state.thumbnail || '/albumart',
        uri: '',
        trackType: 'YouTube',
        seek: Math.round(state.position * 1000),
        duration: Math.round(state.duration),
        samplerate: state.sampleRate,
        bitdepth: state.bitDepth,
        bitrate: state.bitrate,
        channels: state.channels,
        volume: state.volume,
        isStreaming: state.isPlayingLiveStream
    };

    this.logDebug('[ytcr] pushState(): ', volumioState);

    this.commandRouter.servicePushState(volumioState, this.serviceName);
}

// https://github.com/ashthespy/Volumio-SpotifyConnect/blob/next/index.js
ControllerYTCR.prototype.isCurrentService = function() {
    // Check what is the current Volumio service
    let currentstate = this.commandRouter.volumioGetState();
    if (currentstate !== undefined && currentstate.service !== undefined && currentstate.service !== this.serviceName) {
        return false;
    }
    return true;
};

ControllerYTCR.prototype.stop = function() {
    return jsPromiseToKew(this.player.stop());
}

ControllerYTCR.prototype.play = function() {
    return jsPromiseToKew(this.player.resume());
}

ControllerYTCR.prototype.pause = async function() {
    return jsPromiseToKew(this.player.pause());
}

ControllerYTCR.prototype.resume = function() {
    return jsPromiseToKew(this.player.resume());
}

ControllerYTCR.prototype.seek = function(position) {
    return jsPromiseToKew(this.player.seek(Math.round(position / 1000)));
}

ControllerYTCR.prototype.next = function() {
    return jsPromiseToKew(this.player.requestPlayNext());
}

ControllerYTCR.prototype.previous = function() {
    return jsPromiseToKew(this.player.requestPlayPrevious());
}

function jsPromiseToKew(promise) {
    let defer = libQ.defer();

    promise.then( result => {
        defer.resolve(result);
    })
    .catch( error => {
        defer.reject(error);
    });

    return defer.promise;
}

function kewToJSPromise(promise) {
    // Guard against a JS promise from being passed to this function.
    // E.g. Spotify Connect's stop()
    if (typeof promise.catch === 'function' && typeof promise.fail === undefined) {
        // JS promise - return as is
        return promise;
    }
    return new Promise( (resolve, reject) => {
        promise.then( result => {
            resolve(result);
        })
        .fail( error => {
            reject(error);
        })
    });
}

function getNetworkInterfaces() {
    let ifNames = ni.getInterfaces({
        internal: false,
        ipVersion: 4
    });
    return ifNames.map( v => {
        return {
            name: v,
            ip: ni.toIp(v)
        };
    });
}

function hasNetworkInterface(ifName) {
    return getNetworkInterfaces().find( info => info.name === ifName ) !== undefined;
}

class VolumeControl {

    constructor(commandRouter, logger) {
        this.commandRouter = commandRouter;
        this.logger = logger;
        this.currentVolume = null;
    }

    async setVolume(volume, source) {
        this.logger.logDebug(`[ytcr.VolumeControl] Setting volume to ${volume}`);
        this.currentVolume = volume;
        if (source !== 'volumio') {
            this.commandRouter.volumiosetvolume(volume);
        }
    }

    getVolume() {
        let self = this;
        let result;
        if (self.currentVolume === null) {
            result = new Promise( (resolve, reject) => {
                self.commandRouter.volumioretrievevolume().then( volumeData => {
                    resolve(volumeData.vol);
                })
                .fail( error => {
                    reject(error);
                });
            });
        }
        else {
            result = Promise.resolve(self.currentVolume);
        }
        return result.then( volume => {
            self.currentVolume = volume;
            self.logger.logDebug(`[ytcr.VolumeControl] Returning volume: ${volume}`);
            return volume;
        })
        .catch( error => {
            return Promise.resolve(0);
        });
    }
}