'use strict';

var libQ = require('kew');
var fs = require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var { XMLParser } = require('fast-xml-parser');
var { serialize } = require('v8');
var fetch = require('node-fetch');
var HTMLParser = require('node-html-parser');







module.exports = ControllerControradio;
function ControllerControradio(context) {
  var self = this;

  this.context = context;
  this.commandRouter = this.context.coreCommand;
  this.logger = this.context.logger;
  this.configManager = this.context.configManager;

  self.state = {};
  self.timer = null;

}



ControllerControradio.prototype.onVolumioStart = function () {
  var self = this;
  var configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
  this.config = new (require('v-conf'))();
  this.config.loadFile(configFile);
  return libQ.resolve();
}

ControllerControradio.prototype.onStart = function () {
  var self = this;

  self.mpdPlugin = this.commandRouter.pluginManager.getPlugin('music_service', 'mpd');

  self.addToBrowseSources();


  self.serviceName = "controradio";

  return libQ.resolve();
};

ControllerControradio.prototype.onStop = function () {
  var defer = libQ.defer();

  // Once the Plugin has successfull stopped resolve the promise
  defer.resolve();

  return libQ.resolve();
};

ControllerControradio.prototype.onRestart = function () {
  var self = this;
  // Optional, use if you need it
};


// Configuration Methods -----------------------------------------------------------------------------

ControllerControradio.prototype.getUIConfig = function () {
  var defer = libQ.defer();
  var self = this;


  return defer.promise;
};

ControllerControradio.prototype.getConfigurationFiles = function () {
  return ['config.json'];
}

ControllerControradio.prototype.setUIConfig = function (data) {
  var self = this;
  var uiconf = fs.readJsonSync(__dirname + '/UIConfig.json');

  return libQ.resolve();
};

ControllerControradio.prototype.getConf = function (varName) {
  var self = this;

  self.config = new (require('v-conf'))();
  self.config.loadFile(configFile);
};

ControllerControradio.prototype.setConf = function (varName, varValue) {
  var self = this;

  fs.writeJsonSync(self.configFile, JSON.stringify(conf));
};

ControllerControradio.prototype.updateConfig = function (data) {
  var self = this;
  var defer = libQ.defer();


  return defer.promise;
};

// Playback Controls ---------------------------------------------------------------------------------------
// If your plugin is not a music_sevice don't use this part and delete it
ControllerControradio.prototype.fetchRssUrl = function (url) {
  var self = this;

  var request = {
    type: 'GET',
    url: url,
    dataType: 'text',
    headers: {
      'Accept': '*/*',
      'User-Agent': 'Mozilla/5.0'
    },
    timeoutMs: 5000
  };
  var headers = request.headers || {};
  var fetchRequest = {
    headers,
    method: request.type,
    credentials: 'same-origin'
  };
  let contentType = request.contentType;
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  return new Promise((resolve, reject) => {
    var timeout = setTimeout(reject, request.timeoutMs);
    var options = fetchRequest || {};
    options.credentials = 'same-origin';

    fetch(request.url, options).then(
      (response) => {
        clearTimeout(timeout);
        return response;
      },
      (error) => {
        clearTimeout(timeout);
        self.logger.info("ControllerControradio::fetchRssUrl:timed out: [" +
          Date.now() + "] url=" + request.url + ", error=" + error);
        reject();
      }
    )
      .then((response) => response.text())
      .then((fetchData) => {
        var options = {
          ignoreAttributes: false,
          attributeNamePrefix: ""
        };

        var parser = new XMLParser(options);
        var feed = parser.parse(fetchData);
        resolve(feed);
      })
      .catch((error) => {
        self.logger.info('ControllerControradio::fetchRssUrl: [' +
          Date.now() + '] ' + '[Controradio] Error: ' + error);
        reject();
      });
  });
}

ControllerControradio.prototype.addToBrowseSources = function () {
  // Use this function to add your music service plugin to music sources
  var self = this;
  var data = {
    name: 'Controradio',
    uri: 'cradio',
    plugin_type: 'music_service',
    plugin_name: "controradio",
    albumart: '/albumart?sourceicon=music_service/controradio/controradio-logo.jpeg'
  };

  self.commandRouter.volumioAddToBrowseSources(data);
};

ControllerControradio.prototype.addRadioResource = function () {
  var self = this;

  var radioResource = fs.readJsonSync(__dirname + '/controradio.json');
  var baseNavigation = radioResource.baseNavigation;

  self.radioStations = radioResource.stations;
  self.rootNavigation = JSON.parse(JSON.stringify(baseNavigation));
  self.radioNavigation = JSON.parse(JSON.stringify(baseNavigation));
}



ControllerControradio.prototype.removeFromBrowseSources = function () {
  // Use this function to add your music service plugin to music sources
  var self = this;

  self.commandRouter.volumioRemoveToBrowseSources(self.getRadioI18nString('PLUGIN_NAME'));
};

ControllerControradio.prototype.handleBrowseUri = function (curUri) {
  var self = this;
  var response;

  if (curUri.startsWith('cradio')) {
    response = self.getRadioContent(curUri);
  }

  return response
    .fail(function (e) {
      self.logger.error('[Controradio] handleBrowseUri:: failed to fetch data' + e);
      libQ.reject(new Error());
    });
};


ControllerControradio.prototype.getRadioContent = function (station) {
  var self = this;
  var defer = libQ.defer();

  var response = {
    'navigation': {
      'lists': [
        {
          'availableListViews': [
            'list'
          ],
          'items': [

          ]
        }
      ],
      'prev': {
        'uri': 'radio'
      }
    }
  };

  var url = 'https://ondemand.controradio.it/rss/Home.xml';
  self.fetchRssUrl(url)
    .then((feeds) => {
      if (feeds && feeds.rss.channel && feeds.rss.channel.item && feeds.rss.channel.item.length) {
        var items = feeds.rss.channel.item;

        for (var item of items) {
          if (item && item['content:encoded']) {
            var root = HTMLParser.parse(item['content:encoded']);

            var audioElement = root.querySelector('audio');
            var imgElement = root.querySelector('img');

            if (audioElement && imgElement) {
              var audioSrc = audioElement.getAttribute('src');
              var imgSrc = imgElement.getAttribute('src');
            }
          }
          var channel = {
            service: self.serviceName,
            type: 'webradio',
            title: item.title,
            uri: audioSrc,
            albumart:imgSrc,
          };
          self.logger.info("controradio", channel)

          response.navigation.lists[0].items.push(channel);
        }

        defer.resolve(response);

      } else {
        self.logger.error('Failed to fetch data from channel list');
        defer.reject();
      }
    })
    .catch(error => {
      self.logger.error('GetRadioContent::failed to load channel list' + error);
      defer.reject();

    })


  return defer.promise;
};


ControllerControradio.prototype.extractAudioSrc = function (html) {
  var defer = libQ.defer();
  if (html) {
    try {
      var root = HTMLParser.parse(html);

      var audioElement = root.querySelector('audio').getAttribute('src');

      if (!audioElement) {
        defer.reject('[Controradio] extractAudioSrc:: audio element not found');
      } else {
        defer.resolve(audioElement);
      }
    } catch (error) {
      defer.reject('[Controradio] extractAudioSrc:: failed to parse html', error);
    }
  } else {
    defer.reject('[Controradio] extractAudioSrc:: failed to parse html (empty input)');
  }
  return defer.promise();
};

ControllerControradio.prototype.extractImgSrc = function (html) {
  var defer = libQ.defer();


};




// Define a method to clear, add, and play an array of tracks
ControllerControradio.prototype.clearAddPlayTrack = function (track) {
  var self = this;
  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerControradio::clearAddPlayTrack');

  self.commandRouter.logger.info(JSON.stringify(track));

  return self.sendSpopCommand('uplay', [track.uri]);
};

ControllerControradio.prototype.seek = function (timepos) {
  this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerControradio::seek to ' + timepos);

  return this.sendSpopCommand('seek ' + timepos, []);
};

// Stop
ControllerControradio.prototype.stop = function () {
  var self = this;
  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerControradio::stop');


};

// Spop pause
ControllerControradio.prototype.pause = function () {
  var self = this;
  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerControradio::pause');


};

// Get state
ControllerControradio.prototype.getState = function () {
  var self = this;
  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerControradio::getState');


};

//Parse state
ControllerControradio.prototype.parseState = function (sState) {
  var self = this;
  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerControradio::parseState');

  //Use this method to parse the state and eventually send it with the following function
};

// Announce updated State
ControllerControradio.prototype.pushState = function (state) {
  var self = this;
  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerControradio::pushState');

  return self.commandRouter.servicePushState(state, self.servicename);
};


ControllerControradio.prototype.explodeUri = function (uri) {
  var self = this;
  var defer = libQ.defer();
  var response = [];



  defer.resolve(response);

  return defer.promise;
};


ControllerControradio.prototype.getAlbumArt = function (data, path) {

  var artist, album;

  if (data != undefined && data.path != undefined) {
    path = data.path;
  }

  var web;

  if (data != undefined && data.artist != undefined) {
    artist = data.artist;
    if (data.album != undefined)
      album = data.album;
    else album = data.artist;

    web = '?web=' + nodetools.urlEncode(artist) + '/' + nodetools.urlEncode(album) + '/large'
  }

  var url = '/albumart';

  if (web != undefined)
    url = url + web;

  if (web != undefined && path != undefined)
    url = url + '&';
  else if (path != undefined)
    url = url + '?';

  if (path != undefined)
    url = url + 'path=' + nodetools.urlEncode(path);

  return url;
};

ControllerControradio.prototype.getRadioI18nString = function (key) {
  var self = this;

  if (self.i18nStrings[key] !== undefined)
    return self.i18nStrings[key];
  else
    return self.i18nStringsDefaults[key];
};

ControllerControradio.prototype.loadRadioI18nStrings = function () {
  var self = this;
  self.i18nStrings = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
  self.i18nStringsDefaults = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
};

ControllerControradio.prototype.search = function (query) {
  var self = this;
  var defer = libQ.defer();

  // Mandatory, search. You can divide the search in sections using following functions

  return defer.promise;
};

ControllerControradio.prototype._searchArtists = function (results) {

};

ControllerControradio.prototype._searchAlbums = function (results) {

};

ControllerControradio.prototype._searchPlaylists = function (results) {


};

ControllerControradio.prototype._searchTracks = function (results) {

};

ControllerControradio.prototype.goto = function (data) {
  var self = this
  var defer = libQ.defer()

  // Handle go to artist and go to album function

  return defer.promise;
};
