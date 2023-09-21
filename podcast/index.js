'use strict';

const libQ = require('kew');
const fs = require('fs-extra');
const querystring = require('querystring');
const {XMLParser} = require('fast-xml-parser');
const NodeCache = require('node-cache');
const fetch = require('node-fetch');
const podcastSearchApi = 'https://itunes.apple.com';
const urlModule = require('url');

module.exports = ControllerPodcast;

function ControllerPodcast(context) {
  var self = this;

  self.context = context;
  self.commandRouter = this.context.coreCommand;
  self.logger = this.context.logger;
  self.configManager = this.context.configManager;
  self.searchKeyword = "";
  self.i18nStrings = {};
  self.i18nStringsDefaults = {};
  self.i18nCountry = {};
  self.hideSearchResult = true;
  self.updatePodcastData = false;
  self.selectedCountry = {}
  self.cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

  self.logger.info("ControllerPodcast::constructor");
}

ControllerPodcast.prototype.onVolumioStart = function()
{
  var self = this;

  self.configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
  self.getConf(self.configFile);

  return libQ.resolve();
};

ControllerPodcast.prototype.getConfigurationFiles = function () {
  return ['config.json'];
};

ControllerPodcast.prototype.onStart = function() {
  var self = this;

  self.mpdPlugin = this.commandRouter.pluginManager.getPlugin('music_service','mpd');

  self.loadPodcastI18nStrings();
  self.loadPodcastsResource();
  self.addToBrowseSources();

  self.serviceName = "podcast";

  return libQ.resolve();
};

ControllerPodcast.prototype.onStop = function() {
  var self = this;

  return libQ.resolve();
};

ControllerPodcast.prototype.onRestart = function() {
  var self = this;

  return libQ.resolve();
};

// Configuration Methods -----------------------------------------------------
ControllerPodcast.prototype.getConf = function(configFile) {
  var self = this;

  self.config = new (require('v-conf'))();
  self.config.loadFile(configFile);
};

ControllerPodcast.prototype.setConf = function(conf) {
  var self = this;

  fs.writeJsonSync(self.configFile, JSON.stringify(conf));
};

ControllerPodcast.prototype.getUIConfig = function() {
  var self = this;
  var defer = libQ.defer();
  var lang_code = self.commandRouter.sharedVars.get('language_code');

  self.getConf(this.configFile);
  self.commandRouter.i18nJson(__dirname+'/i18n/strings_' + lang_code + '.json',
      __dirname + '/i18n/strings_en.json',
      __dirname + '/UIConfig.json')
  .then(function(uiconf)
  {
    // setup user selected podcast list
    self.podcasts.items.forEach(function (entry) {
      var podcastItem = {
        label: entry.title,
        value: entry.id
      };
      uiconf.sections[3].content[0].options.push(podcastItem);
    });
    uiconf.sections[3].content[0].value = uiconf.sections[3].content[0].options[0];

    // setup podcast search region list
    for (var entry in self.i18nCountry) {
      var countryItem = {
        label: self.i18nCountry[entry].country_name,
        value: self.i18nCountry[entry].country_code,
        langCode: self.i18nCountry[entry].language_code
      };

      uiconf.sections[0].content[0].options.push(countryItem);
    };

    var foundRegions = uiconf.sections[0].content[0].options.find(item => item.langCode === lang_code);
    if (foundRegions) {
      uiconf.sections[0].content[0].value = foundRegions;
      self.selectedCountry = foundRegions;
    }
    else {
      uiconf.sections[0].content[0].value = uiconf.sections[0].content[0].options[0];
      self.selectedCountry = uiconf.sections[0].content[0].options[0];
    }

    // setup max episode number
    var maxEpisodeConfig = uiconf.sections[5].content[0].config;
    maxEpisodeConfig.bars[0].value = self.podcasts.maxEpisode;
    uiconf.sections[5].content[0].value = maxEpisodeConfig.value;

    defer.resolve(uiconf);
  })
  .fail(function()
  {
    defer.reject(new Error());
  });

  return defer.promise;
};

ControllerPodcast.prototype.updatePodcastUIConfig = function() {
  var self=this;

  var lang_code = self.commandRouter.sharedVars.get('language_code');
  self.commandRouter.i18nJson(__dirname+'/i18n/strings_' + lang_code + '.json',
      __dirname + '/i18n/strings_en.json',
      __dirname + '/UIConfig.json')
  .then(function(uiconf)
  {
    // setup search regions
    for (var entry in self.i18nCountry) {
      self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[0].options', {
        label: self.i18nCountry[entry].country_name,
        value: self.i18nCountry[entry].country_code
      });
    };
    self.configManager.setUIConfigParam(uiconf, 'sections[0].content[0].value', self.selectedCountry);

    // setup podcast search result section
    if (!self.hideSearchResult) {
      self.searchedPodcasts.forEach(function (entry) {
        self.configManager.pushUIConfigParam(uiconf,
            'sections[1].content[0].options', {
              label: entry.title,
              value: entry.title,
              url: entry.url
            });
      });
      self.configManager.setUIConfigParam(uiconf,
          'sections[1].content[0].value', {
            label: self.searchedPodcasts[0].title,
            value: self.searchedPodcasts[0].title,
            url: self.searchedPodcasts[0].url
          });
    }
    self.configManager.setUIConfigParam(uiconf, 'sections[1].hidden', self.hideSearchResult);

    // setup search keyword value
    self.configManager.setUIConfigParam(uiconf, 'sections[2].content[0].value', self.searchKeyword);

    // setup selected podcast items
    self.podcasts.items.forEach(function (entry) {
      self.configManager.pushUIConfigParam(uiconf, 'sections[3].content[0].options', {
        label: entry.title,
        value: entry.id
      });
    });
    self.configManager.setUIConfigParam(uiconf, 'sections[3].content[0].value', {
      value: self.podcasts.items[0].title,
      label: self.podcasts.items[0].title
    });

    // setup max episode number
    var maxEpisodeConfig = uiconf.sections[5].content[0].config;
    maxEpisodeConfig.bars[0].value = self.podcasts.maxEpisode;
    self.configManager.setUIConfigParam(uiconf, 'sections[5].content[0].config', maxEpisodeConfig);

    if (self.updatePodcastData) {
      self.cache.del('root');
      fs.writeJsonSync(__dirname+'/podcasts_list.json', self.podcasts);
      self.updatePodcastData = false;
    }
    self.commandRouter.broadcastMessage('pushUiConfig', uiconf);
  })
  .fail(function()
  {
    new Error();
  });
};

ControllerPodcast.prototype.setUIConfig = function(data)
{
  var uiconf=fs.readJsonSync(__dirname+'/UIConfig.json');

  return libQ.resolve();
};

// Podcast Methods -----------------------------------------------------
ControllerPodcast.prototype.fetchRssUrl = function(url) {
  var self=this;

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
  const headers = request.headers || {};
  const fetchRequest = {
    headers,
    method: request.type,
    credentials: 'same-origin'
  };
  let contentType = request.contentType;
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(reject, request.timeoutMs);
    var options = fetchRequest || {};
    options.credentials = 'same-origin';

    fetch(request.url, options).then(
      (response) => {
        clearTimeout(timeout);
        return response;
      },
      (error) => {
        clearTimeout(timeout);
        self.logger.info("ControllerPodcast::fetchRssUrl:timed out: ["+
              Date.now() + "] url=" + request.url+", error="+error);
        reject();
      }
    )
    .then((response) => response.text())
    .then((fetchData) => {
      const options = {
        ignoreAttributes : false,
        attributeNamePrefix: ""
      };

      const parser = new XMLParser(options);
      var feed = parser.parse(fetchData);
      resolve(feed);
    })
    .catch((error) => {
      self.logger.info('ControllerPodcast::fetchRssUrl: [' +
          Date.now() + '] ' + '[Podcast] Error: ' + error);
      reject();
    });
  });
}

ControllerPodcast.prototype.checkAddPodcast = function(defer, rssUrl) {
  var self=this;
  var message;

  var urlObj = urlModule.parse(rssUrl);
  // exception handling for ssenhosting host url
  try {
    if (urlObj.hostname === "pod.ssenhosting.com") {
      var pathValues = urlObj.pathname.substring(1).split("/");
      if (pathValues.length === 2) {
        pathValues[1] = pathValues[1].split(".").shift();
      }
      if (pathValues.length === 3) {
        pathValues.splice(2, 1);
      }
      rssUrl = `${urlObj.protocol}//${urlObj.hostname}/${pathValues.join("/")}`
    }
  }
  catch (error) {
    self.logger.info('ControllerPodcast::checkAddPodcast:ssenhosting: [' +
        Date.now() + '] ' + '[Podcast] Error: ' + error);
    self.showMessageToast('error',
        self.getPodcastI18nString('MESSAGE_INVALID_PODCAST_FORMAT'));
    defer.reject();
    return;
  }

  var findItem = self.podcasts.items.find( item => item.url === rssUrl);
  if (findItem) {
    self.showMessageToast('info', self.getPodcastI18nString('DUPLICATED_PODCAST'));
    defer.resolve();
    return;
  }
  self.showMessageToast('info', self.getPodcastI18nString('ADD_PODCAST_PROCESSING'));

  self.fetchRssUrl(rssUrl)
  .then((feed) => {
    var imageUrl, podcastItem;

    if ( feed.rss.channel.image && feed.rss.channel.image.url )
      imageUrl = feed.rss.channel.image.url;
    else if ( feed.rss.channel['itunes:image'] )
      imageUrl = feed.rss.channel['itunes:image'].href;
    else if ( feed.rss.channel.itunes && feed.rss.channel.itunes.image )
      imageUrl = feed.rss.channel.itunes.image;

    // check validation of image url
    var validUrl;
    try {
      var checkUrl = new URL(imageUrl);
      validUrl = checkUrl.protocol === "http:" || checkUrl.protocol === "https:"
    }
    catch (_) {
      validUrl = false;
    }
    if (!validUrl)
      imageUrl = '/albumart?sourceicon=music_service/podcast/default.jpg';

    const feedTitle = feed.rss.channel.title;
    podcastItem = {
      id: Math.random().toString(36).substring(2, 10) +
          Math.random().toString(36).substring(2, 10),
      title: feedTitle,
      url: rssUrl,
      image: imageUrl
    };

    self.podcasts.items.push(podcastItem);
    self.updatePodcastData = true;
    self.hideSearchResult = true;
    self.updatePodcastUIConfig();

    message = self.getPodcastI18nString('ADD_PODCAST_COMPLETION');
    message = message.replace('{0}', feedTitle);
    self.showMessageToast('success', message);

    defer.resolve();
  })
  .catch(error => {
    self.logger.info('ControllerPodcast::checkAddPodcast: [' +
        Date.now() + '] ' + '[Podcast] Error: ' + error);
    self.showMessageToast('error',
        self.getPodcastI18nString('MESSAGE_INVALID_PODCAST_FORMAT'));
    defer.reject();
  })
};

ControllerPodcast.prototype.addPodcast = function(data) {
  var self=this;
  var defer = libQ.defer();
  var rssUrl = data['input_podcast'].trim();

  if (!rssUrl) {
    self.showMessageToast('error', self.getPodcastI18nString('MESSAGE_ERROR_INPUT_RSS_URL'));
    defer.resolve();
    return;
  }
  self.checkAddPodcast(defer, rssUrl);

  return defer.promise;
};

ControllerPodcast.prototype.deletePodcast = function(data) {
  var self = this;
  var id = data['list_podcast'].value;
  var title = data['list_podcast'].label;

  var message = self.getPodcastI18nString('DELETE_CONFIRM_MESSAGE');
  message = message.replace('{0}', title);

  var modalData = {
    title: self.getPodcastI18nString('PLUGIN_NAME'),
    message: message,
    size: 'md',
    buttons: [
      {
        name: self.getPodcastI18nString('CANCEL'),
        class: 'btn btn-info'
      },
      {
        name: self.getPodcastI18nString('CONFIRM'),
        class: 'btn btn-primary',
        emit:'callMethod',
        payload:{'endpoint':'music_service/podcast','method':'deletePodcastConfirm','data': [id, title]}
      }
    ]
  };
  self.commandRouter.broadcastMessage("openModal", modalData);
  return libQ.resolve();
};

ControllerPodcast.prototype.deletePodcastConfirm = function(data) {
  var self = this;
  var message, messageType;

  const index = self.podcasts.items.map(item => item.id).indexOf(data[0]);
  if (index > -1) {
    self.podcasts.items.splice(index, 1);

    self.updatePodcastData = true;
    self.hideSearchResult = true;
    self.updatePodcastUIConfig();
    message = self.getPodcastI18nString('DELETE_PODCAST_COMPLETION');
    messageType = 'success';
  }
  else {
    message = self.getPodcastI18nString('DELETE_PODCAST_ERROR');
    messageType = 'error';
  }
  message = message.replace('{0}', data[1]);
  self.showMessageToast(messageType, message);
  return libQ.resolve();
};

ControllerPodcast.prototype.saveMaxEpisodeNumber = function(data) {
  var self = this;

  const maxNum = data.max_episode[0];
  self.podcasts.maxEpisode = maxNum;
  fs.writeJsonSync(__dirname+'/podcasts_list.json', self.podcasts);

  self.cache.flushAll();

  var message = self.getPodcastI18nString('CHANGED_MAX_EPISODE');
  message = message.replace('{0}', maxNum);
  self.showMessageToast('info', message);
};

ControllerPodcast.prototype.searchPodcast = function(data) {
  var self = this;
  var defer = libQ.defer();
  var searchPodcast = data['search_keyword'].trim();;

  self.searchKeyword = searchPodcast;
  if (!searchPodcast) {
    self.showMessageToast('error', self.getPodcastI18nString('MESSAGE_ERROR_INPUT_KEYWORD'));
    return libQ.resolve();
  }

  self.searchedPodcasts = [];
  var message = self.getPodcastI18nString('SEARCHING_WAIT_PODCAST');
  message = message.replace('{0}', self.selectedCountry.label);
  self.showMessageToast('info', message);

  var country = self.selectedCountry.value;
  var query = {
    term: searchPodcast.trim(),
    country: country,
    media: 'podcast',
    lang: 'en_us',
    limit: 30
  };
  const queryParam = querystring.stringify(query);
  const options = {
    headers: {
      'Accept': '*/*',
      'User-Agent': 'Mozilla/5.0'
    },
    method: 'GET'
  };

  fetch(`${podcastSearchApi}/${country}/search?${queryParam}`, options)
  .then((response) => response.json())
  .then((items) => {
    if (!items || items.resultCount === 0) {
      self.hideSearchResult = true;
      self.showMessageToast('info', self.getPodcastI18nString('MESSAGE_NONE_SEARCH_RESULT_PODCAST'));
    } else {
      self.hideSearchResult = false;
      items.results.some(function (entry, index) {
        var item = {
          title: entry.collectionName,
          url: entry.feedUrl
        }
        self.searchedPodcasts.push(item);
      });
      self.showMessageToast('info', self.getPodcastI18nString('MESSAGE_SUCCESS_SEARCH_RESULT_PODCAST'));
    };
    self.updatePodcastUIConfig();
    defer.resolve();
  })
  .catch(error => {
    self.logger.info('ControllerPodcast::searchPodcast: [' +
        Date.now() + '] ' + '[Podcast] Error: ' + error);
    defer.resolve();
    self.showMessageToast('error', self.getPodcastI18nString('SEARCH_PODCAST_ERROR'));
  });

  return defer.promise;
};

ControllerPodcast.prototype.searchAddPodcast = function(data) {
  var self = this;
  var defer = libQ.defer();

  self.searchKeyword = "";
  const rssUrl = data.search_result_podcast.url;
  if (!rssUrl) {
    self.showMessageToast('error', self.getPodcastI18nString('MESSAGE_INVALID_PODCAST_URL'));
    defer.resolve();
    return;
  }

  self.checkAddPodcast(defer, rssUrl);
  return defer.promise;
};

ControllerPodcast.prototype.selectCountry = function(data) {
  var self = this;

  self.selectedCountry = data['country_code'];
  var message = self.getPodcastI18nString('CHANGED_SEARCH_REGION');
  message = message.replace('{0}', self.selectedCountry.label);
  self.showMessageToast('info', message);

  self.updatePodcastUIConfig();

  return libQ.resolve();
};

// Playback Controls ---------------------------------------------------------
ControllerPodcast.prototype.addToBrowseSources = function () {
  var self = this;

  self.commandRouter.volumioAddToBrowseSources({
    name: self.getPodcastI18nString('PLUGIN_NAME'),
    uri: 'podcast',
    plugin_type: 'music_service',
    plugin_name: "podcast",
    albumart: '/albumart?sourceicon=music_service/podcast/podcast.svg'
  });
};

ControllerPodcast.prototype.handleBrowseUri = function (curUri) {
  var self = this;
  var response;

  if (curUri.startsWith('podcast')) {
    if (curUri === 'podcast') {
      response = self.getRootContent();
    }
    else {
      response = self.getPodcastContent(curUri);
    }
  }

  return response
      .fail(function (e) {
        self.logger.info('ControllerPodcast::handleBrowseUri: [' + Date.now() + '] ' + '[podcast] handleBrowseUri failed');
        libQ.reject(new Error());
      });
};

ControllerPodcast.prototype.getRootContent = function() {
  var self = this;
  var response;

  var value = self.cache.get('root');
  if (value === undefined) {
    response = {
      navigation: {
        lists: [
          {
            title: self.getPodcastI18nString('PLUGIN_NAME'),
            icon: 'fa fa-podcast',
            availableListViews: ["list", "grid"],
            items: []
          }
        ],
        prev: {
          "uri": "/"
        }
      }
    };

    self.podcasts.items.forEach(function (entry, index) {
      var imageUrl;

      imageUrl = entry.image;
      if (imageUrl === undefined)
        imageUrl = '/albumart?sourceicon=music_service/podcast/default.jpg';

      var podcast = {
        service: self.serviceName,
        type: 'folder',
        title: entry.title,
        uri: (entry.custom !== undefined) ? `podcast/${entry.custom}` : `podcast/${entry.id}`,
        albumart: imageUrl
      };
      response.navigation.lists[0].items.push(podcast);
    });

    self.cache.set('root', response);
    return libQ.resolve(response);
  }
  else {
    return libQ.resolve(value)
  }
};

ControllerPodcast.prototype.getPodcastContent = function(uri) {
  var self = this;
  var defer = libQ.defer();
  var uris = uri.split('/');

  const podcastId = uris[1];
  const targetPodcast = self.podcasts.items.find(item => item.id === podcastId);
  var podcastResponse = self.cache.get(targetPodcast.id);
  if (podcastResponse === undefined) {
    var response = {
      "navigation": {
        "lists": [
          {
            icon: 'fa fa-podcast',
            "availableListViews": [
              "list", "grid"
            ],
            "items": []
          }
        ],
        "prev": {
          "uri": "podcast"
        }
      }
    };

    var message = self.getPodcastI18nString('WAIT_PODCAST_ITEMS');
    message = message.replace('{0}', targetPodcast.title);
    self.showMessageToast('info', message);

    self.fetchRssUrl(targetPodcast.url)
    .then((feed) => {
      const langCode = self.commandRouter.sharedVars.get('language_code');
      const formatter = new Intl.DateTimeFormat(langCode);
      response.navigation.lists[0].title = feed.rss.channel.title;

      if (!feed.rss.channel.item) {
        feed.rss.channel.item = [];
      }
      if (!Array.isArray(feed.rss.channel.item)) {
        var tempItem = feed.rss.channel.item;
        feed.rss.channel.item = [];
        feed.rss.channel.item.push(tempItem);
      }

      feed.rss.channel.item.some(function (entry, index) {
        if (entry.enclosure && entry.enclosure.url) {
          var imageUrl;
          if ((entry.image !== undefined) && (entry.image.url !== undefined))
            imageUrl = entry.image.url;
          else if ((entry['itunes:image'] !== undefined) && (entry['itunes:image'].href !== undefined))
            imageUrl = entry['itunes:image'].href;
          else if (entry.image !== undefined)
            imageUrl = entry.image

          const pubDate = entry.pubDate ? formatter.format(new Date(entry.pubDate)) : null;
          const param = {
            title: entry.title,
            url: entry.enclosure.url,
            albumart: imageUrl
          }
          var urlParam = JSON.stringify(param);
          var podcastItem = {
            service: self.serviceName,
            type: 'song',
            title: (pubDate ? `${pubDate} - ` : '') + entry.title,
            uri: `podcast/${podcastId}/${encodeURIComponent(urlParam)}`
          };
          if (imageUrl)
            podcastItem.albumart = imageUrl
          else
            podcastItem.icon = 'fa fa-podcast'

          response.navigation.lists[0].items.push(podcastItem);
        }
        return (index > self.podcasts.maxEpisode);  // limits podcast episodes
      });

      self.cache.set(targetPodcast.id, response);
      defer.resolve(response);
    })
    .catch((error) => {
      self.logger.info('ControllerPodcast::getPodcastContent: [' + Date.now() + '] ' + '[Podcast] Error: ' + error);
      self.showDialogMessage(targetPodcast.title +
          ": " + self.getPodcastI18nString('MESSAGE_INVALID_PODCAST_FORMAT'));
      defer.reject();
    })
  }
  else {
    // reload current podcast items from caching
    defer.resolve(podcastResponse);
  }

  return defer.promise;
};

ControllerPodcast.prototype.explodeUri = function (uri) {
  var self = this;
  var uris = uri.split("/");
  var response=[];

  // podcast/channel/episode
  if (uris.length < 3) {
    return libQ.reject();
  };

  const podcastId = uris[1];
  const podcastParam = uris[2];
  const podcastItem = self.podcasts.items.find(item => item.id === podcastId);

  const episode = JSON.parse(decodeURIComponent(podcastParam));
  response.push({
    service: self.serviceName,
    type: 'track',
    uri: uri,
    trackType: self.getPodcastI18nString('PLUGIN_NAME'),
    name: episode.title,
    albumart: episode.albumart
      ? episode.albumart
      : podcastItem && podcastItem.image
          ? podcastItem.image
          : '/albumart?sourceicon=music_service/podcast/podcast.svg',
    serviceName: self.serviceName
  });

  return libQ.resolve(response);
};

ControllerPodcast.prototype.clearAddPlayTrack = function(track) {
  var self = this;

  var uris = track.uri.split("/");
  if (uris.length < 3) {
    return libQ.reject();
  };
  const podcastParam = uris[2];
  const episode = JSON.parse(decodeURIComponent(podcastParam));
  const trackUrl = episode.url;

  return self.mpdPlugin.sendMpdCommand('stop', [])
    .then(function() {
        return self.mpdPlugin.sendMpdCommand('clear', []);
    })
    .then(function() {
        return self.mpdPlugin.sendMpdCommand('add "'+trackUrl+'"',[]);
    })
    .then(function () {
      self.mpdPlugin.clientMpd.on('system', function (status) {
        if (status !== 'playlist' && status !== undefined) {
          self.getState().then(function (state) {
            if (state.status === 'play') {
              return self.pushState(state);
            }
          });
        }
      });

      return self.mpdPlugin.sendMpdCommand('play', []).then(function () {
        self.commandRouter.checkFavourites({uri: track.uri}).then(function(favouriteStatus) {
          self.commandRouter.emitFavourites(
              {service: self.service, uri: track.uri, favourite: favouriteStatus.favourite}
          );
        })

        return self.getState().then(function (state) {
          return self.pushState(state);
        });
      });

    })
    .fail(function (e) {
      return libQ.reject(new Error());
    });
};

ControllerPodcast.prototype.getState = function () {
  var self = this;

  return self.mpdPlugin.sendMpdCommand('status', [])
  .then(function (objState) {
    var collectedState = self.mpdPlugin.parseState(objState);

    // If there is a track listed as currently playing, get the track info
    if (collectedState.position !== null) {
      var trackinfo=self.commandRouter.stateMachine.getTrack(self.commandRouter.stateMachine.currentPosition);
      if (collectedState.samplerate) trackinfo.samplerate = collectedState.samplerate;
      if (collectedState.bitdepth) trackinfo.bitdepth = collectedState.bitdepth;

      collectedState.isStreaming = trackinfo.isStreaming !== undefined ? trackinfo.isStreaming : false;
      collectedState.title = trackinfo.title;
      collectedState.artist = trackinfo.artist;
      collectedState.album = trackinfo.album;
      collectedState.uri = trackinfo.uri;
      collectedState.trackType = trackinfo.trackType.split('?')[0];
      collectedState.serviceName = trackinfo.serviceName;
    } else {
      collectedState.isStreaming = false;
      collectedState.title = null;
      collectedState.artist = null;
      collectedState.album = null;
      collectedState.uri = null;
      collectedState.serviceName = self.serviceName;
    }
    return collectedState;
  });
};

ControllerPodcast.prototype.pushState = function (state) {
  var self = this;

  return self.commandRouter.servicePushState(state, self.serviceName);
};

ControllerPodcast.prototype.seek = function (position) {
  var self = this;

  return self.mpdPlugin.seek(position);
};

ControllerPodcast.prototype.stop = function() {
  var self = this;

  self.showMessageToast('info', self.getPodcastI18nString('STOP_PODCAST'));

  return self.mpdPlugin.stop().then(function () {
    return self.getState().then(function (state) {
      return self.pushState(state);
    });
  });
};

ControllerPodcast.prototype.pause = function() {
  var self = this;

  return self.mpdPlugin.pause().then(function () {
    return self.getState().then(function (state) {
      return self.pushState(state);
    });
  });
};

ControllerPodcast.prototype.resume = function() {
  var self = this;

  return self.mpdPlugin.resume().then(function () {
    return self.getState().then(function (state) {
      return self.pushState(state);
    });
  });
};

ControllerPodcast.prototype.showDialogMessage = function(message) {
  var self = this;

  var modalData = {
    title: self.getPodcastI18nString('PLUGIN_NAME'),
    message: message,
    size: 'md',
    buttons: [
      {
        name: self.getPodcastI18nString('CLOSE'),
        class: 'btn btn-info'
      }
    ]
  };
  self.commandRouter.broadcastMessage("openModal", modalData);
};

ControllerPodcast.prototype.showMessageToast = function (type, message) {
  var self=this;

  self.commandRouter.pushToastMessage(
      type,
      self.getPodcastI18nString('PLUGIN_NAME'),
      message
  );
};

// resource functions for Podcast -----------------------------------
ControllerPodcast.prototype.loadPodcastsResource = function() {
  var self = this;

  self.podcasts = fs.readJsonSync(__dirname+'/podcasts_list.json');
  self.searchedPodcasts = null;
};

ControllerPodcast.prototype.loadPodcastI18nStrings = function () {
  var self = this;

  try {
    var language_code = self.commandRouter.sharedVars.get('language_code');
    self.i18nStrings=fs.readJsonSync(__dirname+'/i18n/strings_'+language_code+".json");
  } catch(e) {
    self.i18nStrings=fs.readJsonSync(__dirname+'/i18n/strings_en.json');
  }

  self.i18nCountry=fs.readJsonSync(__dirname+'/i18n/country_code.json');
  self.i18nStringsDefaults=fs.readJsonSync(__dirname+'/i18n/strings_en.json');
};

ControllerPodcast.prototype.getPodcastI18nString = function (key) {
  var self = this;

  if (self.i18nStrings[key] !== undefined)
    return self.i18nStrings[key];
  else
    return self.i18nStringsDefaults[key];
};
