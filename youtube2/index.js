'use strict';

const libQ = require('kew');
const yt2 = require('./lib/youtube2');
const { default: InnerTube } = require('volumio-youtubei.js');
const Auth = require('./lib/utils/auth');
const { BrowseController, PlayController, SearchController } = require('./lib/controller');
const ViewHelper = require('./lib/helper/view');
const Model = require('./lib/model');

module.exports = ControllerYouTube2;


function ControllerYouTube2(context) {
  this.context = context;
  this.commandRouter = this.context.coreCommand;
  this.logger = this.context.logger;
  this.configManager = this.context.configManager;
}

ControllerYouTube2.prototype.getUIConfig = function () {
  const defer = libQ.defer();

  const langCode = this.commandRouter.sharedVars.get('language_code');
  const loadConfigPromises = [
    this.commandRouter.i18nJson(__dirname + '/i18n/strings_' + langCode + '.json',
      __dirname + '/i18n/strings_en.json',
      __dirname + '/UIConfig.json'),
    this.getConfigI18nOptions()
  ];

  const authStatus = Auth.getAuthStatus();
  if (authStatus.status === Auth.SIGNED_IN) {
    loadConfigPromises.push(this.getConfigAccountInfo());
  }
  else {
    loadConfigPromises.push(libQ.resolve(null));
  }

  const configModel = Model.getInstance('config');

  libQ.all(loadConfigPromises)
    .then(([uiconf, i18nOptions, account]) => {
      const i18nUIConf = uiconf.sections[0];
      const accountUIConf = uiconf.sections[1];
      const browseUIConf = uiconf.sections[2];
      const playbackUIConf = uiconf.sections[3];

      // i18n
      // -- region
      i18nUIConf.content[0].label = i18nOptions.options.region.label;
      i18nUIConf.content[0].options = i18nOptions.options.region.optionValues;
      i18nUIConf.content[0].value = i18nOptions.selected.region;
      i18nUIConf.content[1].label = i18nOptions.options.language.label;
      i18nUIConf.content[1].options = i18nOptions.options.language.optionValues;
      i18nUIConf.content[1].value = i18nOptions.selected.language;

      // Account
      const authStatus = Auth.getAuthStatus();
      let authStatusDescription;
      switch (authStatus.status) {
        case Auth.SIGNED_IN:
          if (account) {
            authStatusDescription = yt2.getI18n('YOUTUBE2_AUTH_STATUS_SIGNED_IN_AS', account.name);
          }
          else {
            authStatusDescription = yt2.getI18n('YOUTUBE2_AUTH_STATUS_SIGNED_IN');
          }
          break;
        case Auth.SIGNING_IN:
          authStatusDescription = yt2.getI18n('YOUTUBE2_AUTH_STATUS_SIGNING_IN');
          break;
        case Auth.ERROR:
          authStatusDescription = yt2.getI18n('YOUTUBE2_AUTH_STATUS_ERROR',
            yt2.getErrorMessage('', authStatus.error, false));
          break;
        default:  // Auth.SIGNED_OUT
          authStatusDescription = yt2.getI18n('YOUTUBE2_AUTH_STATUS_SIGNED_OUT');
      }

      if (authStatus.status === Auth.SIGNED_OUT) {
        if (authStatus.verificationInfo) {
          authStatusDescription += ' ' + yt2.getI18n('YOUTUBE2_AUTH_STATUS_CODE_READY');

          accountUIConf.content = [
            {
              id: 'verificationUrl',
              type: 'text',
              element: 'input',
              label: yt2.getI18n('YOUTUBE2_VERIFICATION_URL'),
              value: authStatus.verificationInfo.verification_url
            },
            {
              id: 'openVerificationUrl',
              element: 'button',
              label: yt2.getI18n('YOUTUBE2_GO_TO_VERIFICATION_URL'),
              onClick: {
                type: 'openUrl',
                url: authStatus.verificationInfo.verification_url
              }
            },
            {
              id: 'code',
              type: 'text',
              element: 'input',
              label: yt2.getI18n('YOUTUBE2_DEVICE_CODE'),
              value: authStatus.verificationInfo.user_code
            },
          ];
        }
        else {
          authStatusDescription += ' ' + yt2.getI18n('YOUTUBE2_AUTH_STATUS_CODE_PENDING');
        }
      }
      else if (authStatus.status === Auth.SIGNED_IN) {
        accountUIConf.content = [
          {
            id: 'signOut',
            element: 'button',
            label: yt2.getI18n('YOUTUBE2_SIGN_OUT'),
            onClick: {
              type: 'emit',
              message: 'callMethod',
              data: {
                endpoint: 'music_service/youtube2',
                method: 'configSignOut'
              }
            }
          }
        ];
      }

      accountUIConf.description = authStatusDescription;

      // Browse
      const rootContentType = yt2.getConfigValue('rootContentType', 'full');
      const rootContentTypeOptions = configModel.getRootContentTypeOptions();
      const loadFullPlaylists = yt2.getConfigValue('loadFullPlaylists', false);
      browseUIConf.content[0].options = rootContentTypeOptions;
      browseUIConf.content[0].value = rootContentTypeOptions.find((o) => o.value === rootContentType);
      browseUIConf.content[1].value = loadFullPlaylists;

      // Playback
      const autoplay = yt2.getConfigValue('autoplay', false);
      const autoplayClearQueue = yt2.getConfigValue('autoplayClearQueue', false);
      const addToHistory = yt2.getConfigValue('addToHistory', true);
      const liveStreamQuality = yt2.getConfigValue('liveStreamQuality', 'auto');
      const liveStreamQualityOptions = configModel.getLiveStreamQualityOptions();
      playbackUIConf.content[0].value = autoplay;
      playbackUIConf.content[1].value = autoplayClearQueue;
      playbackUIConf.content[2].value = addToHistory;
      playbackUIConf.content[3].options = liveStreamQualityOptions;
      playbackUIConf.content[3].value = liveStreamQualityOptions.find((o) => o.value === liveStreamQuality);

      defer.resolve(uiconf);
    })
    .fail((error) => {
      yt2.getLogger().error('[youtube2] getUIConfig(): Cannot populate YouTube2 configuration - ' + error);
      defer.reject(Error());
    }
    );

  return defer.promise;
};

ControllerYouTube2.prototype.onVolumioStart = function () {
  const configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
  this.config = new (require('v-conf'))();
  this.config.loadFile(configFile);

  return libQ.resolve();
}

ControllerYouTube2.prototype.onStart = function () {
  const defer = libQ.defer();

  yt2.init(this.context, this.config);

  this.browseController = new BrowseController();
  this.searchController = new SearchController();
  this.playController = new PlayController();

  this.initInnerTube().then(() => {
    this.addToBrowseSources();
    defer.resolve();
  });

  return defer.promise;
};

ControllerYouTube2.prototype.onStop = function () {
  this.commandRouter.volumioRemoveToBrowseSources('YouTube2');

  this.browseController = null;
  this.searchController = null;
  this.playController = null;

  Auth.unregisterAuthHandlers();

  yt2.reset();

  return libQ.resolve();
};

ControllerYouTube2.prototype.initInnerTube = function () {
  const defer = libQ.defer();

  const innerTube = yt2.get('innertube');
  if (innerTube) {
    Auth.unregisterAuthHandlers();
    yt2.set('innertube', null);
  }

  InnerTube.create().then((innerTube) => {
    yt2.set('innertube', innerTube);
    this.applyI18nConfigToInnerTube();
    Auth.registerAuthHandlers();
    Auth.signIn();
    defer.resolve(innerTube);
  })
    .catch((error) => {
      defer.reject(error);
    });

  return defer.promise;
}

ControllerYouTube2.prototype.applyI18nConfigToInnerTube = function () {
  const innerTube = yt2.get('innertube');
  if (innerTube) {
    const region = yt2.getConfigValue('region', 'US');
    const language = yt2.getConfigValue('language', 'en');

    innerTube.session.context.client.gl = region;
    innerTube.session.context.client.hl = language;
  }
}

ControllerYouTube2.prototype.getConfigurationFiles = function () {
  return ['config.json'];
}

ControllerYouTube2.prototype.getConfigI18nOptions = function () {
  const defer = libQ.defer();

  const model = Model.getInstance('config');
  model.getI18nOptions().then((options) => {
    const selectedValues = {
      region: yt2.getConfigValue('region', 'US'),
      language: yt2.getConfigValue('language', 'en')
    };
    const selected = {};
    ['region', 'language'].forEach((key) => {
      selected[key] = options[key].optionValues.find((ov) => ov.value === selectedValues[key]) || { label: '', value: selectedValues[key] };
    });

    defer.resolve({
      options,
      selected
    });
  });

  return defer.promise;
}

ControllerYouTube2.prototype.getConfigAccountInfo = function () {
  const defer = libQ.defer();

  const model = Model.getInstance('account');
  model.getInfo().then((account) => {
    defer.resolve(account);
  })
    .catch((error) => {
      defer.resolve(null);
    });

  return defer.promise;
}

ControllerYouTube2.prototype.configSaveI18n = function (data) {
  const oldRegion = yt2.getConfigValue('region');
  const oldLanguage = yt2.getConfigValue('language');
  const region = data.region.value;
  const language = data.language.value;

  if (oldRegion !== region || oldLanguage !== language) {
    yt2.setConfigValue('region', region);
    yt2.setConfigValue('language', language);

    this.applyI18nConfigToInnerTube();
    Model.getInstance('config').clearCache();
    yt2.refreshUIConfig();
  }

  yt2.toast('success', yt2.getI18n('YOUTUBE2_SETTINGS_SAVED'));
}

ControllerYouTube2.prototype.configSignOut = function () {
  Auth.signOut();
}

ControllerYouTube2.prototype.configSaveBrowse = function (data) {
  yt2.setConfigValue('rootContentType', data.rootContentType.value);
  yt2.setConfigValue('loadFullPlaylists', data.loadFullPlaylists);

  yt2.toast('success', yt2.getI18n('YOUTUBE2_SETTINGS_SAVED'));
}

ControllerYouTube2.prototype.configSavePlayback = function (data) {
  yt2.setConfigValue('autoplay', data.autoplay);
  yt2.setConfigValue('autoplayClearQueue', data.autoplayClearQueue);
  yt2.setConfigValue('addToHistory', data.addToHistory);
  yt2.setConfigValue('liveStreamQuality', data.liveStreamQuality.value);

  yt2.toast('success', yt2.getI18n('YOUTUBE2_SETTINGS_SAVED'));
}

ControllerYouTube2.prototype.addToBrowseSources = function () {
  const source = {
    name: 'YouTube2',
    uri: 'youtube2',
    plugin_type: 'music_service',
    plugin_name: 'youtube2',
    albumart: '/albumart?sourceicon=music_service/youtube2/assets/images/youtube.svg'
  };
  this.commandRouter.volumioAddToBrowseSources(source);
};

ControllerYouTube2.prototype.handleBrowseUri = function (uri) {
  const defer = libQ.defer();

  this.browseController.browseUri(uri).then((result) => {
    defer.resolve(result);
  })
    .catch((error) => {
      defer.reject(error);
    });

  return defer.promise;
}

ControllerYouTube2.prototype.explodeUri = function (uri) {
  const defer = libQ.defer();

  this.browseController.explodeUri(uri).then((result) => {
    defer.resolve(result);
  })
    .catch((error) => {
      defer.reject(error);
    });

  return defer.promise;
};

ControllerYouTube2.prototype.clearAddPlayTrack = function (track) {
  return this.playController.clearAddPlayTrack(track);
}

ControllerYouTube2.prototype.stop = function () {
  return this.playController.stop();
};

ControllerYouTube2.prototype.pause = function () {
  return this.playController.pause();
};

ControllerYouTube2.prototype.resume = function () {
  return this.playController.resume();
}

ControllerYouTube2.prototype.next = function () {
  return this.playController.next();
}

ControllerYouTube2.prototype.previous = function () {
  return this.playController.previous();
}

ControllerYouTube2.prototype.seek = function (position) {
  return this.playController.seek(position);
}

ControllerYouTube2.prototype.goto = function (data) {
  const defer = libQ.defer();

  this.playController.getGotoUri(data).then((uri) => {
    if (uri) {
      defer.resolve(this.browseController.browseUri(uri));
    }
    else {
      const view = ViewHelper.getViewsFromUri(data.uri)?.[1];
      const trackData = view?.explodeTrackData ? JSON.parse(decodeURIComponent(view.explodeTrackData)) : null;
      const trackTitle = trackData?.title;
      let errMsg;
      if (data.type === 'album') {
        errMsg = trackTitle ? yt2.getI18n('YOUTUBE2_ERR_GOTO_PLAYLIST_NOT_FOUND_FOR', trackTitle) :
          yt2.getI18n('YOUTUBE2_ERR_GOTO_PLAYLIST_NOT_FOUND');
      }
      else if (data.type === 'artist') {
        errMsg = trackTitle ? yt2.getI18n('YOUTUBE2_ERR_GOTO_CHANNEL_NOT_FOUND_FOR', trackTitle) :
          yt2.getI18n('YOUTUBE2_ERR_GOTO_CHANNEL_NOT_FOUND');
      }
      else {
        errMsg = yt2.getI18n('YOUTUBE2_ERR_GOTO_UNKNOWN_TYPE', data.type);
      }
      
      yt2.toast('error', errMsg);
      defer.reject(Error(errMsg));
    }
  });

  return defer.promise;
}

ControllerYouTube2.prototype.search = function (query) {
  return this.searchController.search(query);
}
