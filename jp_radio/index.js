'use strict';
var libQ = require('kew');
const JpRadio = require('./lib/radio');

module.exports = ControllerJpRadio;
function ControllerJpRadio(context) {
  var self = this;

  this.context = context;
  this.commandRouter = this.context.coreCommand;
  this.logger = this.context.logger;
  this.configManager = this.context.configManager;

  this.serviceName = "jp_radio";
}

ControllerJpRadio.prototype.saveRadikoAccount = function (data) {
  var self = this;
  var defer = libQ.defer();
  var configUpdated = false;

  if (self.config.get('radikoUser') != data['radikoUser']) {
    self.config.set('radikoUser', data['radikoUser']);
    configUpdated = true;
  }
  if (self.config.get('radikoPass') != data['radikoPass']) {
    self.config.set('radikoPass', data['radikoPass']);
    configUpdated = true;
  }

  if (configUpdated) {
    self.commandRouter.pushToastMessage('success', 'Settings have been saved successfully. Please restart the plugin.');
  }
  defer.resolve({});
  return defer.promise;
};

ControllerJpRadio.prototype.onVolumioStart = function () {
  var self = this;
  var configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
  this.config = new (require('v-conf'))();
  this.config.loadFile(configFile);

  return libQ.resolve();
};

ControllerJpRadio.prototype.onStart = function () {
  var self = this;
  var defer = libQ.defer();
  const radikoUser = self.config.get('radikoUser');
  const radikoPass = self.config.get('radikoPass');

  let acct = null;

  if (radikoUser !== undefined && radikoUser && radikoPass !== undefined && radikoPass) {
    acct = {
      'mail': radikoUser,
      'pass': radikoPass
    };
  }

  self.appRadio = new JpRadio(9000, this.logger, acct);

  // Once the Plugin has successfull started resolve the promise
  defer.resolve();

  self.appRadio.start();

  self.addToBrowseSources();

  return defer.promise;
};

ControllerJpRadio.prototype.onStop = function () {
  var self = this;
  var defer = libQ.defer();

  // Once the Plugin has successfull stopped resolve the promise
  defer.resolve();

  self.appRadio.stop();

  self.commandRouter.volumioRemoveToBrowseSources('RADIKO');

  return libQ.resolve();
};

ControllerJpRadio.prototype.onRestart = function () {
  var self = this;
  // Optional, use if you need it
};

// Configuration Methods -----------------------------------------------------------------------------

ControllerJpRadio.prototype.getUIConfig = function () {
  var defer = libQ.defer();
  var self = this;

  var lang_code = this.commandRouter.sharedVars.get('language_code');

  self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
    __dirname + '/i18n/strings_en.json',
    __dirname + '/UIConfig.json')
    .then(function (uiconf) {
      uiconf.sections[0].content[0].value = self.config.get('radikoUser');
      uiconf.sections[0].content[1].value = self.config.get('radikoPass');
      defer.resolve(uiconf);
    }).fail(function () {
      defer.reject(new Error());
    });

  return defer.promise;
};

ControllerJpRadio.prototype.getConfigurationFiles = function () {
  return ['config.json'];
}

ControllerJpRadio.prototype.setUIConfig = function (data) {
  var self = this;
  //Perform your installation tasks here
};

ControllerJpRadio.prototype.getConf = function (varName) {
  var self = this;
  //Perform your installation tasks here
};

ControllerJpRadio.prototype.setConf = function (varName, varValue) {
  var self = this;
  //Perform your installation tasks here
};

// Playback Controls ---------------------------------------------------------------------------------------
// If your plugin is not a music_sevice don't use this part and delete it

ControllerJpRadio.prototype.addToBrowseSources = function () {
  var self = this;
  // Use this function to add your music service plugin to music sources
  var radikoNow = {
    name: 'RADIKO',
    uri: 'radiko',
    plugin_type: 'music_service',
    plugin_name: self.serviceName,
    albumart: '/albumart?sourceicon=music_service/jp_radio/images/app_radiko.svg'
  };

  self.commandRouter.volumioAddToBrowseSources(radikoNow);
};

ControllerJpRadio.prototype.handleBrowseUri = function (curUri) {
  var self = this;
  if (curUri.startsWith('radiko')) {
    if (curUri === 'radiko') {
      var response = {
        navigation: {
          lists: [{
            title: 'LIVE',
            availableListViews: ['grid', 'list'],
            items: self.appRadio.radioStations()
          }]
        }
      };
      return libQ.resolve(response);
    }
  }
  return libQ.resolve();
};

// Define a method to clear, add, and play an array of tracks
ControllerJpRadio.prototype.clearAddPlayTrack = function (track) {
  var self = this;
  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'JP_Radio::clearAddPlayTrack');

  self.commandRouter.logger.info(JSON.stringify(track));

  return self.sendSpopCommand('uplay', [track.uri]);
};

ControllerJpRadio.prototype.seek = function (timepos) {
  this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'JP_Radio::seek to ' + timepos);

  return this.sendSpopCommand('seek ' + timepos, []);
};

// Stop
ControllerJpRadio.prototype.stop = function () {
  var self = this;
  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'JP_Radio::stop');
};

// Spop pause
ControllerJpRadio.prototype.pause = function () {
  var self = this;
  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'JP_Radio::pause');
};

// Get state
ControllerJpRadio.prototype.getState = function () {
  var self = this;
  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'JP_Radio::getState');
};

//Parse state
ControllerJpRadio.prototype.parseState = function (sState) {
  var self = this;
  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'JP_Radio::parseState');

  //Use this method to parse the state and eventually send it with the following function
};

// Announce updated State
ControllerJpRadio.prototype.pushState = function (state) {
  var self = this;
  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'JP_Radio::pushState');

  return self.commandRouter.servicePushState(state, self.servicename);
};

ControllerJpRadio.prototype.explodeUri = function (uri) {
  var self = this;
  var defer = libQ.defer();

  // Mandatory: retrieve all info for a given URI

  return defer.promise;
};

ControllerJpRadio.prototype.getAlbumArt = function (data, path) {

  var artist, album;

  if (data != undefined && data.path != undefined) {
    path = data.path;
  }

  var web;

  if (data != undefined && data.artist != undefined) {
    artist = data.artist;
    if (data.album != undefined) {
      album = data.album;
    } else {
      album = data.artist
    }

    web = '?web=' + nodetools.urlEncode(artist) + '/' + nodetools.urlEncode(album) + '/large'
  }

  var url = '/albumart';

  if (web != undefined)
    url = url + web;

  if (web != undefined && path != undefined) {
    url = url + '&';
  } else if (path != undefined) {
    url = url + '?';
  }

  if (path != undefined) {
    url = url + 'path=' + nodetools.urlEncode(path);
  }

  return url;
};

ControllerJpRadio.prototype.search = function (query) {
  var self = this;
  var defer = libQ.defer();

  // Mandatory, search. You can divide the search in sections using following functions

  return defer.promise;
};

ControllerJpRadio.prototype._searchArtists = function (results) {

};

ControllerJpRadio.prototype._searchAlbums = function (results) {

};

ControllerJpRadio.prototype._searchPlaylists = function (results) {

};

ControllerJpRadio.prototype._searchTracks = function (results) {

};

ControllerJpRadio.prototype.goto = function (data) {
  var self = this
  var defer = libQ.defer()

  // Handle go to artist and go to album function

  return defer.promise;
};