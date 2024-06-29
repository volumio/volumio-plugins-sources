'use strict';

var libQ = require('kew');
var fs = require('fs-extra');
var { XMLParser } = require('fast-xml-parser');
var HTMLParser = require('node-html-parser');
var unirest = require('unirest');
var url = 'https://ondemand.controradio.it/rss/Home.xml';
var baseNavigation = {
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





module.exports = ControllerControradio;
function ControllerControradio(context) {
  var self = this;

  this.context = context;
  this.commandRouter = this.context.coreCommand;
  this.logger = this.context.logger;
  this.configManager = this.context.configManager;

  self.state = {};
  self.timer = null;
  self.radioItems = [];

};



ControllerControradio.prototype.onVolumioStart = function () {
  var self = this;
  var configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
  this.config = new (require('v-conf'))();
  this.config.loadFile(configFile);
  return libQ.resolve();
};

ControllerControradio.prototype.onStart = function () {
  var self = this;

  self.mpdPlugin = this.commandRouter.pluginManager.getPlugin('music_service', 'mpd');

  self.addToBrowseSources();

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
ControllerControradio.prototype.getControradioData = function (url) {
  var self = this;
  var defer = libQ.defer();

  unirest.get(url)
    .timeout(4000)
    .end(function (response) {
      if (response.ok) {
        var options = {
          ignoreAttributes: false,
          attributeNamePrefix: ""
        };
        var parser = new XMLParser(options);
        var feed = parser.parse(response.body);
        defer.resolve(feed);
      } else {
        self.logger.error('Controradio::getControradioData - failed to fetch data from uri ' + url + ': ' + response.statusCode);
      }
    });

  return defer.promise;

};

ControllerControradio.prototype.addToBrowseSources = function () {
  // Use this function to add your music service plugin to music sources
  var self = this;
  var data = {
    name: 'Controradio',
    uri: 'cradio',
    plugin_type: 'music_service',
    plugin_name: "controradio",
    albumart: '/albumart?sourceicon=music_service/controradio/albumart.png'
  };

  self.commandRouter.volumioAddToBrowseSources(data);
};

ControllerControradio.prototype.addRadioResource = function () {
  var self = this;

  var radioResource = fs.readJsonSync(__dirname + '/controradio.json');

  self.radioProgram = radioResource.baseNavigation.navigation.lists[0].items;

};



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

  self.getControradioData(url)
    .then((feeds) => {

      if (feeds && feeds.rss.channel && feeds.rss.channel.item && feeds.rss.channel.item.length) {

        var items = feeds.rss.channel.item;

        for (var item of items) {
          var channel = {
            service: 'controradio',
            type: 'webradio',
            title: self.formatString(item.title),
            uri: self.extractAudioSrc(item['content:encoded']),
            albumart: self.extractImgSrc(item['content:encoded']),
            icon: ''
          };

          if ((channel.albumart === null || channel.albumart === undefined)) {
            channel.icon = 'fa fa-music';
          }
          if (channel.uri != null) {

            baseNavigation.navigation.lists[0].items.push(channel);
            self.radioItems.push(channel);
          }
        }
        defer.resolve(baseNavigation);

      } else {
        self.logger.error('Failed to fetch data from channel list');
      }
    })

  return defer.promise;
};

ControllerControradio.prototype.formatString = function (title) {
  var self = this;

  var regex = /del (\d{2}) (\w+) (\d{4}) (\d{2}:\d{2})/;
  title = title.replace(/^[^\w\s]/, '');
  var matches = title.match(regex);

  if (!matches) {
    return title;
  }

  var months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

  var day = matches[1];
  var monthName = matches[2];
  var year = matches[3];
  var time = matches[4];

  var monthNumber = months.indexOf(monthName) + 1;

  var formattedDate = `${day}/${monthNumber.toString().padStart(2, '0')}/${year}`;

  var titleString = title.replace(regex, '').trim();

  var formattedString = `${formattedDate} - ${time} - ${titleString}`;

  return formattedString;
};

ControllerControradio.prototype.extractAudioSrc = function (html) {
  var self = this;
  var audioElement = null;
  if (html) {
    try {
      var root = HTMLParser.parse(html);

      audioElement = root.querySelector('audio').getAttribute('src');

      if (!audioElement) {
        self.logger.error('[Controradio] extractAudioSrc:: audio element not found');
      } else {
        return audioElement;
      }
    } catch (error) {
      self.logger.error('[Controradio] extractAudioSrc:: failed to parse html', error);
    }
  } else {
    self.logger.error('[Controradio] extractAudioSrc:: failed to parse html (empty input)');
  }
  return audioElement;
};

ControllerControradio.prototype.extractImgSrc = function (html) {
  var self = this;
  var imgElement = null;
  if (html) {
    try {
      var root = HTMLParser.parse(html);

      imgElement = root.querySelector('img').getAttribute('src');

      if (!imgElement) {
        self.logger.error('[Controradio] extractImgSrc:: Img element not found');
      } else {
        return imgElement;
      }
    } catch (error) {
      self.logger.error('[Controradio] extractImgSrc:: failed to parse html', error);
    }
  } else {
    self.logger.error('[Controradio] extractImgSrc:: failed to parse html (empty input)');
  }
  return imgElement;


};

ControllerControradio.prototype.checkImageUrl = function (url) {
  var self = this;
  var defer = libQ.defer();

  unirest.get(url)
    .timeout(4000)
    .end(function (response) {
      if (response.status === 200 && response.body) {
        defer.resolve(true);
      } else {
        defer.resolve(false);
      }
    });

  return defer.promise;
};



// Define a method to clear, add, and play an array of tracks
ControllerControradio.prototype.clearAddPlayTrack = function (track) {
  var self = this;
  var defer = libQ.defer();

  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerControradio::clearAddPlayTrack');

  self.mpdPlugin.sendMpdCommand('stop', [])
    .then(function () {
      return self.mpdPlugin.sendMpdCommand('clear', []);
    })
    .then(function (e) {
      return self.mpdPlugin.sendMpdCommand('add "' + track.uri + '"', []);
    })
    .then(function () {
      self.commandRouter.stateMachine.setConsumeUpdateService('mpd', true);
      return self.mpdPlugin.sendMpdCommand('play', []);
    })
    .fail(function (e) {
      self.logger.error('Could not Clear and Play Controradio Track: ' + e);
      defer.reject(new Error());
    });

  return defer.promise;

};

ControllerControradio.prototype.stop = function () {
  var self = this;
  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerControradio::stop');

  self.commandRouter.stateMachine.setConsumeUpdateService('mpd');
  return self.mpdPlugin.stop();
};


ControllerControradio.prototype.pause = function () {
  var self = this;
  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerControradio::pause');

  // TODO don't send 'toggle' if already paused
  self.commandRouter.stateMachine.setConsumeUpdateService('mpd');
  return self.mpdPlugin.pause();
};


ControllerControradio.prototype.resume = function () {
  var self = this;
  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerControradio::resume');

  // TODO don't send 'toggle' if already playing
  self.commandRouter.stateMachine.setConsumeUpdateService('mpd', true);
  return self.mpdPlugin.resume();
};

ControllerControradio.prototype.seek = function (position) {
  var self = this;
  this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerControradio::seek');

  self.commandRouter.stateMachine.setConsumeUpdateService('mpd', true);
  return self.mpdPlugin.seek(position);
};

ControllerControradio.prototype.next = function () {
  var self = this;

  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerControradio::next');
  self.commandRouter.stateMachine.setConsumeUpdateService();
  return this.commandRouter.stateMachine.next();
};

ControllerControradio.prototype.previous = function () {
  var self = this;

  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'ControllerControradio::previous');
  self.commandRouter.stateMachine.setConsumeUpdateService();
  return this.commandRouter.stateMachine.previous();
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

};


ControllerControradio.prototype.explodeUri = function (uri) {
  var self = this;
  var defer = libQ.defer();
  var response = [];
  var trackItem = self.radioItems.find(item => item.uri === uri);
  var albumartUrl;

  if (trackItem && trackItem.albumart) {
    self.checkImageUrl(trackItem.albumart).then(function (isImageUrlValid) {

      if (!isImageUrlValid) {
        albumartUrl = '/albumart';
      } else {
        albumartUrl = trackItem.albumart;
      }

      response.push({
        uri: uri,
        service: 'controradio',
        name: trackItem.title,
        albumart: albumartUrl,
        type: 'webradio'
      });

      defer.resolve(response);
    });
  }

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
  var lowercaseQuery = query.value.toLowerCase();
  var searchResultsObject = {
    "title": "Controradio",
    "icon": "fa fa-music",
    "availableListViews": [
      "list", "grid"
    ],
    "items": [
    ]
  };

  self.getControradioData(url)
    .then((feeds) => {
      if (feeds && feeds.rss.channel && feeds.rss.channel.item && feeds.rss.channel.item.length) {

        var items = feeds.rss.channel.item;

        for (var item of items) {
          var lowercaseTitle = item.title.toLowerCase();
          if (lowercaseTitle.includes(lowercaseQuery)) {

            var channel = {
              service: 'controradio',
              type: 'webradio',
              title: self.formatString(item.title),
              uri: self.extractAudioSrc(item['content:encoded']),
              albumart: self.extractImgSrc(item['content:encoded']),
              icon: ''

            };

            if ((channel.albumart === null || channel.albumart === undefined)) {
              channel.icon = 'fa fa-music';
            }
            if (channel.uri != null) {

              searchResultsObject.items.push(channel);
            }
          }
        }

        defer.resolve(searchResultsObject);

      } else {
        self.logger.error('Failed to find data from search');
      }
    })
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
