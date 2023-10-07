'use strict';

var libQ = require('kew');
var fs = require('fs-extra');
var config = new (require('v-conf'))();
var NanoTimer = require('nanotimer');
const https = require('https');
var flacUri;
var channelMix;
var metadataUrl;
var audioFormat = "flac";

module.exports = motherearthradio;

function motherearthradio(context) {
    var self = this;

    self.context = context;
    self.commandRouter = this.context.coreCommand;
    self.logger = this.context.logger;
    self.configManager = this.context.configManager;

    self.state = {};
    self.timer = null;
};

motherearthradio.prototype.onVolumioStart = function () {
    var self = this;
    self.configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
    self.getConf(self.configFile);
    self.apiDelay = self.config.get('apiDelay');
    self.logger.info('[' + Date.now() + '] ' + '[MotherEarth] API delay: ' + self.apiDelay);

    return libQ.resolve();
};

motherearthradio.prototype.getConfigurationFiles = function () {
    return ['config.json'];
};

motherearthradio.prototype.onStart = function () {
    var self = this;

    self.mpdPlugin = this.commandRouter.pluginManager.getPlugin('music_service', 'mpd');

    self.loadRadioI18nStrings();
    self.addRadioResource();
    self.addToBrowseSources();

    self.serviceName = "motherearthradio";

    // Once the Plugin has successfull started resolve the promise
    return libQ.resolve();
};

motherearthradio.prototype.onStop = function () {
    var self = this;

    self.removeFromBrowseSources();
    return libQ.resolve();
};

motherearthradio.prototype.onRestart = function () {
    var self = this;
    // Optional, use if you need it
    return libQ.resolve();
};


// Configuration Methods -----------------------------------------------------------------------------
motherearthradio.prototype.getUIConfig = function () {
    var defer = libQ.defer();
    var self = this;

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.getConf(this.configFile);
    self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
        __dirname + '/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function (uiconf) {
            uiconf.sections[0].content[0].value = self.config.get('apiDelay');
            defer.resolve(uiconf);
        })
        .fail(function () {
            defer.reject(new Error());
        });

    return defer.promise;
};


motherearthradio.prototype.setUIConfig = function (data) {
    var self = this;
    var uiconf = fs.readJsonSync(__dirname + '/UIConfig.json');

    return libQ.resolve();
};

motherearthradio.prototype.getConf = function (configFile) {
    var self = this;

    self.config = new (require('v-conf'))();
    self.config.loadFile(configFile);
};

motherearthradio.prototype.setConf = function (varName, varValue) {
    var self = this;
    fs.writeJsonSync(self.configFile, JSON.stringify(conf));
};

motherearthradio.prototype.updateConfig = function (data) {
    var self = this;
    var defer = libQ.defer();
    var configUpdated = false;
  
    if (self.config.get('apiDelay') != data['apiDelay']) {
      self.config.set('apiDelay', data['apiDelay']);
      self.apiDelay = data['apiDelay'];
      configUpdated = true;
    }
  
    if(configUpdated) {
      var responseData = {
        title: self.getRadioI18nString('PLUGIN_NAME'),
        message: self.getRadioI18nString('SAVE_CONFIG_MESSAGE'),
        size: 'md',
        buttons: [{
          name: 'Close',
          class: 'btn btn-info'
        }]
      };
  
      self.commandRouter.broadcastMessage("openModal", responseData);
    }
  
    return defer.promise;
};

// Playback Controls ---------------------------------------------------------------------------------------
motherearthradio.prototype.addToBrowseSources = function () {
    // Use this function to add your music service plugin to music sources
    var self = this;

    self.commandRouter.volumioAddToBrowseSources({
        name: self.getRadioI18nString('PLUGIN_NAME'),
        uri: 'mer',
        plugin_type: 'music_service',
        plugin_name: "motherearthradio",
        albumart: '/albumart?sourceicon=music_service/motherearthradio/motherearthlogo.svg'
    });
};

motherearthradio.prototype.removeFromBrowseSources = function () {
    // Use this function to add your music service plugin to music sources
    var self = this;

    self.commandRouter.volumioRemoveToBrowseSources(self.getRadioI18nString('PLUGIN_NAME'));
};

motherearthradio.prototype.handleBrowseUri = function (curUri) {
   var self = this;
    var response;
    if (curUri.startsWith('mer')) {
        response = self.getRadioContent('mer');
    }
    return response
        .fail(function (e) {
            self.logger.info('[' + Date.now() + '] ' + '[MotherEarth] handleBrowseUri failed');
            libQ.reject(new Error());
        });
};

motherearthradio.prototype.getRadioContent = function (station) {
    var self = this;
    var response;
    var radioStation;
    var defer = libQ.defer();

    radioStation = self.radioStations.mer;

    response = self.radioNavigation;
    response.navigation.lists[0].items = [];
    for (var i in radioStation) {
        var channel = {
            service: self.serviceName,
            type: 'mywebradio',
            title: radioStation[i].title,
            artist: '',
            album: '',
            icon: 'fa fa-music',
            uri: radioStation[i].uri
        };
        response.navigation.lists[0].items.push(channel);
    }
    defer.resolve(response);

    return defer.promise;
};

// Define a method to clear, add, and play an array of tracks
motherearthradio.prototype.clearAddPlayTrack = function (track) {
    var self = this;
    if (self.timer) {
        self.timer.clear();
    }

        flacUri = track.uri;

        channelMix = "Radio";
        metadataUrl = "https://motherearth.streamserver24.com/api/nowplaying/motherearth";
        if (track.uri.includes("klassik")) {
            channelMix = "Klassik";
            metadataUrl = "https://motherearth.streamserver24.com/api/nowplaying/motherearth_klassik";
        } else if (track.uri.includes("instrumental")) {
            channelMix = "Instrumental";
            metadataUrl = "https://motherearth.streamserver24.com/api/nowplaying/motherearth_instrumental";
        } else if (track.uri.includes("jazz")) {
            channelMix = "Jazz";
            metadataUrl = "https://motherearth.streamserver24.com/api/nowplaying/motherearth_jazz";
        }

        var songs;
        return self.mpdPlugin.sendMpdCommand('stop', [])
            .then(function () {
                return self.mpdPlugin.sendMpdCommand('clear', []);
            })
            .then(function () {
                return self.mpdPlugin.sendMpdCommand('consume 1', []);
            })
            .then(function () {
                self.logger.info('[' + Date.now() + '] ' + '[MotherEarth] set to consume mode, adding url: ' + flacUri);
                return self.mpdPlugin.sendMpdCommand('add "' + flacUri + '"', []);
            })
            .then(function () {
                self.commandRouter.pushToastMessage('info',
                    self.getRadioI18nString('PLUGIN_NAME'),
                    self.getRadioI18nString('WAIT_FOR_RADIO_CHANNEL'));

                return self.mpdPlugin.sendMpdCommand('play', []);
            }).then(function () {
                return self.setMetadata(metadataUrl);
            })
            .fail(function (e) {
                return libQ.reject(new Error());
            });
//    }
};

motherearthradio.prototype.seek = function (position) {
    var self = this;
    this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + '[MotherEarth] seek to ' + position);
    return libQ.resolve();
    //return self.mpdPlugin.seek(position);
};

// Stop
motherearthradio.prototype.stop = function () {
    var self = this;
    if (self.timer) {
        self.timer.clear();
    }
    self.commandRouter.pushToastMessage(
        'info',
        self.getRadioI18nString('PLUGIN_NAME'),
        self.getRadioI18nString('STOP_RADIO_CHANNEL')
    );

    return self.mpdPlugin.stop()
        .then(function () {
            self.state.status = 'stop';
            self.commandRouter.servicePushState(self.state, self.serviceName);
        });
};

// Pause
motherearthradio.prototype.pause = function () {
    var self = this;

    // stop timer
    if (self.timer) {
        self.timer.clear();
    }

    // pause the song
    return self.mpdPlugin.sendMpdCommand('pause', [1])
    .then(function () {
        var vState = self.commandRouter.stateMachine.getState();
        self.state.status = 'pause';
        self.state.seek = vState.seek;
        self.commandRouter.servicePushState(self.state, self.serviceName);
    });
};

// Resume
motherearthradio.prototype.resume = function () {
    var self = this;

    return self.mpdPlugin.sendMpdCommand('play', [])
        .then(function () {
            // adapt play status and update state machine
            self.state.status = 'play';
            self.commandRouter.servicePushState(self.state, self.serviceName);
            return self.setMetadata(metadataUrl);
    });
};

motherearthradio.prototype.explodeUri = function (uri) {
    var self = this;
    var defer = libQ.defer();
    var response = [];

    var uris = uri.split("/");
    var channel = parseInt(uris[1]);
    var query;
    var station;

    station = uris[0].substring(3);

    switch (uris[0]) {
        case 'webmer':
            if (self.timer) {
                self.timer.clear();
            }
            if (channel <= 3) {
                // FLAC option chosen
                response.push({
                    service: self.serviceName,
                    type: 'track',
                    trackType: audioFormat,
                    radioType: station,
                    albumart: '/albumart?sourceicon=music_service/motherearthradio/motherearthlogo.svg',
                    uri: self.radioStations.mer[channel].url,
                    name: self.radioStations.mer[channel].title,
                    duration: 1000,
		    samplerate: '192kHz'
                });
                defer.resolve(response);
            } else {
                // non flac webradio chosen
                response.push({
                    service: self.serviceName,
                    type: 'track',
                    trackType: self.getRadioI18nString('PLUGIN_NAME'),
                    radioType: station,
                    albumart: '/albumart?sourceicon=music_service/motherearthradio/motherearthlogo.svg',
                    uri: self.radioStations.mer[channel].url,
                    name: self.radioStations.mer[channel].title,
		    samplerate: '96kHz'
                });
                defer.resolve(response);
            }
            break;
        default:
            defer.resolve();
    }
    return defer.promise;
};

motherearthradio.prototype.addRadioResource = function () {
    var self = this;

    var radioResource = fs.readJsonSync(__dirname + '/radio_stations.json');
    var baseNavigation = radioResource.baseNavigation;

    self.radioStations = radioResource.stations;
    self.rootNavigation = JSON.parse(JSON.stringify(baseNavigation));
    self.radioNavigation = JSON.parse(JSON.stringify(baseNavigation));
};

motherearthradio.prototype.getMetadata = function (url) {
    var self = this;
    var defer = libQ.defer();
    https.get(url, (resp) => {
      if (resp.statusCode < 200 || resp.statusCode > 500) {
            self.logger.info('[' + Date.now() + '] ' + '[MotherEarth] Failed to query azuracast api, status code: ' + resp.statusCode);
            defer.resolve(null);
            self.errorToast(url, 'ERROR_STREAM_SERVER');
        } else {
        let data = '';
        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received.
        resp.on('end', () => {
            defer.resolve(data);
        });
        }

    }).on("error", (err) => {
        self.logger.info('[' + Date.now() + '] ' + '[MotherEarth] Error: ' + err.message);
          defer.resolve(null);
        self.errorToast(url, 'ERROR_STREAM_SERVER');
    });
    return defer.promise;
}

motherearthradio.prototype.loadRadioI18nStrings = function () {
    var self = this;
    self.i18nStrings = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
    self.i18nStringsDefaults = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
};

motherearthradio.prototype.getRadioI18nString = function (key) {
    var self = this;

    if (self.i18nStrings[key] !== undefined)
        return self.i18nStrings[key];
    else
        return self.i18nStringsDefaults[key];
};

motherearthradio.prototype.search = function (query) {
    return libQ.resolve();
};

motherearthradio.prototype.errorToast = function (station, msg) {
    var self = this;

    var errorMessage = self.getRadioI18nString(msg);
    errorMessage.replace('{0}', station.toUpperCase());
    self.commandRouter.pushToastMessage('error',
        self.getRadioI18nString('PLUGIN_NAME'), errorMessage);
};

motherearthradio.prototype.pushSongState = function (metadata) {
    var self = this;
    var merState = {
        status: 'play',
        service: self.serviceName,
        type: 'webradio',
        trackType: audioFormat,
        radioType: 'mer',
        albumart: metadata.now_playing.song.art,
        uri: flacUri,
        name: metadata.now_playing.song.text,
        title: metadata.now_playing.song.title,
        artist: metadata.now_playing.song.artist,
        album: metadata.now_playing.song.album,
	streaming: true,
        disableUiControls: true,
        duration: metadata.now_playing.remaining,
        seek: 0,
        bitdepth: '24 bit',
        channels: 2
    };

    self.state = merState;

    //workaround to allow state to be pushed when not in a volatile state
    var vState = self.commandRouter.stateMachine.getState();
    var queueItem = self.commandRouter.stateMachine.playQueue.arrayQueue[vState.position];

    queueItem.name =  metadata.now_playing.song.title;
    queueItem.artist =  metadata.now_playing.song.artist;
    queueItem.album = metadata.now_playing.song.album;
    queueItem.albumart = metadata.now_playing.song.art;
    queueItem.trackType = 'Mother Earth ' + channelMix;
    queueItem.duration = metadata.now_playing.remaining;
//    queueItem.samplerate = '96 KHz';
//    queueItem.bitdepth = '24 bit';
    queueItem.channels = 2;
    
    //reset volumio internal timer
    self.commandRouter.stateMachine.currentSeek = 0;
    self.commandRouter.stateMachine.playbackStart=Date.now();
    self.commandRouter.stateMachine.currentSongDuration=metadata.now_playing.remaining;
    self.commandRouter.stateMachine.askedForPrefetch=false;
    self.commandRouter.stateMachine.prefetchDone=false;
    self.commandRouter.stateMachine.simulateStopStartDone=false;

    //volumio push state
    self.commandRouter.servicePushState(merState, self.serviceName);
};

motherearthradio.prototype.setMetadata = function (metadataUrl) {
    var self = this;
    return self.getMetadata(metadataUrl)
    .then(function (eventResponse) {
        if (eventResponse !== null) {
            var result = JSON.parse(eventResponse);
            if (result.now_playing.remaining === undefined) {
                self.errorToast('web', 'INCORRECT_RESPONSE');
            }
//	    self.commandRouter.pushToastMessage('info', "[MotherEarth] received new metadata: ' + JSON.stringify(result)'");
            return result;
      }
    }).then(function(metadata) {
        // show metadata and adjust time of playback and timer
        if(self.apiDelay) {
            metadata.now_playing.remaining = parseInt(metadata.now_playing.remaining) + parseInt(self.apiDelay);
        }
        var duration = metadata.now_playing.remaining * 1000;
        return libQ.resolve(self.pushSongState(metadata))
        .then(function () {
            self.logger.info('[' + Date.now() + '] ' + '[MotherEarth] setting new timer with duration of ' + duration + ' seconds.');
            self.timer = new merTimer(self.setMetadata.bind(self), [metadataUrl], duration);
        });
    });
};

function merTimer(callback, args, delay) {
    var start, remaining = delay;

    var nanoTimer = new NanoTimer();

    merTimer.prototype.pause = function () {
        nanoTimer.clearTimeout();
        remaining -= new Date() - start;
    };

    merTimer.prototype.resume = function () {
        start = new Date();
        nanoTimer.clearTimeout();
        nanoTimer.setTimeout(callback, args, remaining + 'm');
    };

    merTimer.prototype.clear = function () {
        nanoTimer.clearTimeout();
    };

    this.resume();
};

