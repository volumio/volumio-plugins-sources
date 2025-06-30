'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var io = require('socket.io-client');
var tidyuri = "";

module.exports = randomizer;

function randomizer(context) {
	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;
}

randomizer.prototype.onVolumioStart = function() {
    var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
    this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);
    return libQ.resolve();
}

randomizer.prototype.onStart = function() {
    var self = this;
    var defer=libQ.defer();
    self.load18nStrings();
    self.socket = io.connect('http://localhost:3000');

    // Add to browse sources
    const source = {
      name: 'Randomizer',
      uri: 'randomizer',
      plugin_type: 'user_interface',
      plugin_name: 'randomizer',
      albumart: '/albumart?sourceicon=user_interface/randomizer/assets/randomizer.png'
    };
    self.commandRouter.volumioAddToBrowseSources(source);

    // Once the Plugin has successfull started resolve the promise
    defer.resolve();

    return defer.promise;
};

randomizer.prototype.rand = function(max, min) {
    return Math.floor(Math.random() * (+max - +min)) + min;
}

randomizer.prototype.randomTracks = function() {
    var self = this;
    var defer=libQ.defer();
    var i = 0;
    var queue = 0;
    self.tracks = self.config.get('tracks');
    if (isNaN(self.tracks)) self.tracks = 25;
    self.socket.emit('browseLibrary', {'uri':'albums://'});
    self.socket.on('pushBrowseLibrary',function(data) {
       var item = data.navigation.lists[0].items[0];
       var list = data.navigation.lists[0].items;
       if (list == 0)
       {
         self.commandRouter.pushToastMessage('error', self.getI18nString("ERROR_NO_LIBRARY_FOUND_TITLE"), self.getI18nString("ERROR_NO_TRACKS_LIBRARY_MESSAGE"));
         self.socket.off('pushBrowseLibrary');
         self.socket.off('pushQueue');
       }
       if (list !=0 && queue == 0)
       {
         self.socket.emit('clearQueue');
       }
       if (list !=0)
       {
         if (item.type == 'song')
         {
           try {
             while (item.type == 'song') {
               item = data.navigation.lists[0].items[i];
               i++;
             }
           }
           catch(err) {
             i-- ;
             var track = self.rand(i, 0);
             item = data.navigation.lists[0].items[track];
             i = 0;
           }
           if (queue <= self.tracks-1)
           {
             self.socket.emit('addToQueue', {'uri':item.uri});
             queue++ ;
           }
         } else {
           var list = data.navigation.lists[0].items;
           var random = self.rand(list.length - 1, 0);
           var select = list[random];
           self.socket.emit('browseLibrary', {'uri':select.uri});
         }
       }
    });
    self.socket.on('pushQueue', function(data) {
       if (data && data.length == 1) {
          self.socket.emit('play',{'value':0});
       }
       if (data.length >= self.tracks) {
          self.socket.off('pushBrowseLibrary');
          self.socket.off('pushQueue');
       } else {
          self.socket.emit('browseLibrary', {'uri':'albums://'});
       }
    });
    // Once the Plugin has successfully started resolve the promise
    defer.resolve();
    return libQ.resolve();
}




randomizer.prototype.trackToAlbum = function() {
    var self = this;
    var defer=libQ.defer();
    self.socket.emit('getState', '');
    self.socket.on('pushState', function (data) {
      if (data.uri.length == 0)
      {
        self.socket.off('pushState');
        self.socket.off('pushQueue');
        self.commandRouter.pushToastMessage('error', self.getI18nString("ERROR_QUEUE_EMPTY_TITLE"), self.getI18nString("ERROR_QUEUE_EMPTY_MESSAGE"));
      }
      if (data.service !='mpd' && data.uri.length !=0)
      {
        self.getI18nString("ERROR_NOT_MPD_TITLE")
        var serv = self.getI18nString("ERROR_NOT_MPD_TITLE").concat(" ", data.service , "."); 
        self.commandRouter.pushToastMessage('error', serv, self.getI18nString("ERROR_NOT_MPD_MESSAGE"));
        self.socket.off('pushState');
        self.socket.off('pushQueue');
      }
      if (data.service =='mpd' && data.uri.length != 0)
      {
           self.socket.emit('clearQueue');
           var album = (data.uri.lastIndexOf('/'));
           data.uri = data.uri.substring(0, album);
           self.socket.emit('addToQueue', {'uri': data.uri})
       }
       self.socket.off('pushState');
   });
   self.socket.on('pushQueue', function(data) {
     if (data && data.length > 0)
     {
       self.socket.emit('play',{'value':0});
       self.socket.off('pushQueue');
       self.socket.off('pushState');
     }
   });

   // Once the Plugin has successfull stopped resolve the promise
   defer.resolve();

   return libQ.resolve();
}

randomizer.prototype.randomAlbum = function() {
    var self = this;
    var defer=libQ.defer();
    self.socket.emit('browseLibrary',{'uri':'albums://'});
    self.socket.on('pushBrowseLibrary',function(data)
    {
      var list = data.navigation.lists[0].items;
      if (list == 0)
      {
        self.commandRouter.pushToastMessage('error', self.getI18nString("ERROR_NO_LIBRARY_FOUND_TITLE"), self.getI18nString("ERROR_NO_ALBUM_LIBRARY_MESSAGE"));
        self.socket.off('pushBrowseLibrary');
        self.socket.off('pushQueue');
      }
      if (list != 0)
      {
        self.socket.emit('clearQueue');
        var q = self.rand(list.length, 0);
        var select = list[q];
        tidyuri = select.uri.replace(/%20/g, " ");
        self.socket.emit('addToQueue', {'uri':tidyuri})
      }
      self.socket.off('pushBrowseLibrary');    
    });
    self.socket.on('pushQueue', function(data) { 
      if (data.length > 0) {
        self.socket.emit('play',{'value':0});
        //self.socket.off('pushBrowseLibrary');
        self.socket.off('pushQueue');
      }
     });
    defer.resolve();
    return libQ.resolve();
}

randomizer.prototype.truePrevious = function() {
     var self = this;
     var defer=libQ.defer();
     self.socket.emit('getState', '');
     self.socket.on('pushState', function (data) {
     if (data.position >= 1)
     {
       self.socket.on('pushState', function () {
       });
       self.socket.emit("play",{"value":data.position - 1});
     } else {
        self.commandRouter.pushToastMessage('error', self.getI18nString("ERROR_START_OF_QUEUE_TITLE"), self.getI18nString("ERROR_START_OF_QUEUE_MESSAGE"));
     }
     self.socket.off('pushState');
  });
  // Once the Plugin has successfully started resolve the promise
  defer.resolve();
  return libQ.resolve();
};



randomizer.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    // Remove from browse sources
    self.commandRouter.volumioRemoveToBrowseSources('Randomizer');

    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();

    return libQ.resolve();
};

randomizer.prototype.saveSettings = function (data) {
    var self = this;
    var defer = libQ.defer();
    defer.resolve();
  
    if(isNaN(data['tracks'])) data['tracks'] = -1;
    if(data['tracks'] <= 0) {
        self.commandRouter.pushToastMessage('error', self.getI18nString("ERROR_NUMBER_PLEASE_TITLE"), self.getI18nString("ERROR_NUMBER_PLEASE_MESSAGE"));
      } else {
        self.commandRouter.pushToastMessage('success', self.getI18nString("SUCCESS_TITLE"), self.getI18nString("SUCCESS_MESSAGE"));
    }
    if(data['tracks'] >= 1) {
       self.config.set('tracks', parseInt(data['tracks']),10);
    }

    return defer.promise;
};


randomizer.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;
    var lang_code = this.commandRouter.sharedVars.get('language_code');
    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {
            uiconf.sections[0].content[0].value = self.config.get('tracks');
            defer.resolve(uiconf);
        })
        .fail(function()
        {
            defer.reject(new Error());
        });

    return defer.promise;
};

randomizer.prototype.load18nStrings = function () {
    var self = this;

    try {
        var language_code = this.commandRouter.sharedVars.get('language_code');
        self.i18nStrings = fs.readJsonSync(__dirname + '/i18n/strings_' + language_code + ".json");
    } catch (e) {
        self.i18nStrings = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
    }

    self.i18nStringsDefaults = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
};

randomizer.prototype.getI18nString = function (key) {
    var self = this;

    if (self.i18nStrings[key] !== undefined)
        return self.i18nStrings[key];
    else
        return self.i18nStringsDefaults[key];
};


// Configuration Methods -----------------------------------------------------------------------------

randomizer.prototype.getConfigurationFiles = function() {
	return ['config.json'];
}

randomizer.prototype.handleBrowseUri = function(uri) {
  
  switch (uri) {
    case 'randomizer':
      break;
    case 'randomizer/randomTracks':
      this.randomTracks();
      break;
    case 'randomizer/trackToAlbum':
      this.trackToAlbum();
      break;
    case 'randomizer/randomAlbum':
      this.randomAlbum();
      break;
    default:
      return libQ.reject(`Unknown Randomizer URI: ${uri}`)
  }

  let tracks = this.config.get('tracks');
  if (isNaN(tracks)) tracks = 25;

  return libQ.resolve({
    navigation: {
      prev: { uri: '/' },
      lists: [
        {
          title: this.getI18nString('RANDOMIZER'),
          availableListViews: [ 'list', 'grid' ],
          items: [
            {
              service: 'randomizer',
              type: 'item-no-menu',
              title: this.getI18nString('RANDOMTRACKS_LBL_COUNT').replace('()', tracks),
              uri: `randomizer/randomTracks`,
              albumart: '/albumart?sourceicon=user_interface/randomizer/assets/random_tracks.png'
            },
            {
              service: 'randomizer',
              type: 'item-no-menu',
              title: this.getI18nString('RANDOMALBUM_LBL'),
              uri: `randomizer/randomAlbum`,
              albumart: '/albumart?sourceicon=user_interface/randomizer/assets/random_album.png'
            },
            {
              service: 'randomizer',
              type: 'item-no-menu',
              title: this.getI18nString('TRACKTOALBUM_LBL'),
              uri: `randomizer/trackToAlbum`,
              albumart: '/albumart?sourceicon=user_interface/randomizer/assets/track_to_album.png'
            }
          ]
        }
      ]
    }
  });
}
