'use strict';

const path = require('path');
global.ytmusicPluginLibRoot = path.resolve(__dirname) + '/lib';

const libQ = require('kew');
const ytmusic = require(ytmusicPluginLibRoot + '/ytmusic');
const { default: InnerTube } = require('volumio-youtubei.js');
const Auth = require(ytmusicPluginLibRoot + '/utils/auth');
const SearchController = require(ytmusicPluginLibRoot + '/controller/search');
const BrowseController = require(ytmusicPluginLibRoot + '/controller/browse');
const PlayController = require(ytmusicPluginLibRoot + '/controller/play');
const ViewHelper = require(ytmusicPluginLibRoot + '/helper/view');
const Model = require(ytmusicPluginLibRoot + '/model');

module.exports = ControllerYTMusic;


function ControllerYTMusic(context) {
  this.context = context;
  this.commandRouter = this.context.coreCommand;
  this.logger = this.context.logger;
  this.configManager = this.context.configManager;
}

ControllerYTMusic.prototype.getUIConfig = function () {
  const defer = libQ.defer();

  const langCode = this.commandRouter.sharedVars.get('language_code');
  const loadConfigPromises = [
    this.commandRouter.i18nJson(__dirname + '/i18n/strings_' + langCode + '.json',
      __dirname + '/i18n/strings_en.json',
      __dirname + '/UIConfig.json'),
    this.getConfigI18nOptions()
  ];

  libQ.all(loadConfigPromises)
    .then(([uiconf, i18nOptions]) => {
      const i18nUIConf = uiconf.sections[0];
      const accountUIConf = uiconf.sections[1];

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
          authStatusDescription = ytmusic.getI18n('YTMUSIC_AUTH_STATUS_SIGNED_IN');
          break;
        case Auth.SIGNING_IN:
          authStatusDescription = ytmusic.getI18n('YTMUSIC_AUTH_STATUS_SIGNING_IN');
          break;
        case Auth.ERROR:
          authStatusDescription = ytmusic.getI18n('YTMUSIC_AUTH_STATUS_ERROR',
            ytmusic.getErrorMessage('', authStatus.error, false));
          break;
        default:  // Auth.SIGNED_OUT
          authStatusDescription = ytmusic.getI18n('YTMUSIC_AUTH_STATUS_SIGNED_OUT');
      }

      if (authStatus.status === Auth.SIGNED_OUT) {
        if (authStatus.verificationInfo) {
          authStatusDescription += ' ' + ytmusic.getI18n('YTMUSIC_AUTH_STATUS_CODE_READY');

          accountUIConf.content = [
            {
              id: 'verificationUrl',
              type: 'text',
              element: 'input',
              label: ytmusic.getI18n('YTMUSIC_VERIFICATION_URL'),
              value: authStatus.verificationInfo.verification_url
            },
            {
              id: 'openVerificationUrl',
              element: 'button',
              label: ytmusic.getI18n('YTMUSIC_GO_TO_VERIFICATION_URL'),
              onClick: {
                type: 'openUrl',
                url: authStatus.verificationInfo.verification_url
              }
            },
            {
              id: 'code',
              type: 'text',
              element: 'input',
              label: ytmusic.getI18n('YTMUSIC_DEVICE_CODE'),
              value: authStatus.verificationInfo.user_code
            },
          ];
        }
        else {
          authStatusDescription += ' ' + ytmusic.getI18n('YTMUSIC_AUTH_STATUS_CODE_PENDING');
        }
      }
      else if (authStatus.status === Auth.SIGNED_IN) {
        accountUIConf.content = [
          {
            id: 'signOut',
            element: 'button',
            label: ytmusic.getI18n('YTMUSIC_SIGN_OUT'),
            onClick: {
                type: 'emit',
                message: 'callMethod',
                data: {
                    endpoint: 'music_service/ytmusic',
                    method: 'configSignOut'
                }
            }
          }
        ];
      }

      accountUIConf.description = authStatusDescription;

      defer.resolve(uiconf);
    })
    .fail((error) => {
      ytmusic.getLogger().error('[ytmusic] getUIConfig(): Cannot populate YouTube Music configuration - ' + error);
      defer.reject(new Error());
    }
    );

  return defer.promise;
};

ControllerYTMusic.prototype.onVolumioStart = function () {
  const configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
  this.config = new (require('v-conf'))();
  this.config.loadFile(configFile);

  return libQ.resolve();
}

ControllerYTMusic.prototype.onStart = function () {
  const defer = libQ.defer();

  ytmusic.init(this.context, this.config);

  this.browseController = new BrowseController();
  this.searchController = new SearchController();
  this.playController = new PlayController();

  this.initInnerTube().then(() => {
    this.addToBrowseSources();
    defer.resolve();
  });

  return defer.promise;
};

ControllerYTMusic.prototype.onStop = function () {
  this.commandRouter.volumioRemoveToBrowseSources('YouTube Music');

  this.browseController = null;
  this.searchController = null;
  this.playController = null;

  Auth.unregisterAuthHandlers();

  ytmusic.reset();

  return libQ.resolve();
};

ControllerYTMusic.prototype.initInnerTube = function () {
  const defer = libQ.defer();

  const innerTube = ytmusic.get('innertube');
  if (!innerTube) {
    Auth.unregisterAuthHandlers();
    ytmusic.set('innertube', null);
  }

  InnerTube.create().then((innerTube) => {
    ytmusic.set('innertube', innerTube);
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

ControllerYTMusic.prototype.applyI18nConfigToInnerTube = function () {
  const innerTube = ytmusic.get('innertube');
  if (innerTube) {
    const region = ytmusic.getConfigValue('region', 'US');
    const language = ytmusic.getConfigValue('language', 'en');

    innerTube.session.context.client.gl = region;
    innerTube.session.context.client.hl = language;
  }
}

ControllerYTMusic.prototype.getConfigurationFiles = function () {
  return ['config.json'];
}

ControllerYTMusic.prototype.getConfigI18nOptions = function () {
  const defer = libQ.defer();

  const model = Model.getInstance('config');
  model.getI18nOptions().then((options) => {
    const selectedValues = {
      region: ytmusic.getConfigValue('region', 'US'),
      language: ytmusic.getConfigValue('language', 'en')
    };
    const selected = {};
    ['region', 'language'].forEach((key) => {
      selected[key] = options[key].optionValues.find((ov) => ov.value === selectedValues[key]) || { label: '', value: selectedValues[key] };
    });

    defer.resolve({
      options,
      selected
    });
  })

  return defer.promise;
}

ControllerYTMusic.prototype.configSaveI18n = function (data) {
  const oldRegion = ytmusic.getConfigValue('region');
  const oldLanguage = ytmusic.getConfigValue('language');
  const region = data.region.value;
  const language = data.language.value;

  if (oldRegion !== region || oldLanguage !== language) {
    ytmusic.setConfigValue('region', region);
    ytmusic.setConfigValue('language', language);

    this.applyI18nConfigToInnerTube();
    Model.getInstance('config').clearCache();
    ytmusic.refreshUIConfig();
  }

  ytmusic.toast('success', ytmusic.getI18n('YTMUSIC_SETTINGS_SAVED'));
}

ControllerYTMusic.prototype.configSignOut = function () {
  Auth.signOut();
}

ControllerYTMusic.prototype.addToBrowseSources = function () {
  const source = {
    name: 'YouTube Music',
    uri: 'ytmusic',
    plugin_type: 'music_service',
    plugin_name: 'ytmusic',
    albumart: '/albumart?sourceicon=music_service/ytmusic/assets/images/ytmusic-mono-s.png'
  };
  this.commandRouter.volumioAddToBrowseSources(source);
};

ControllerYTMusic.prototype.handleBrowseUri = function (uri) {
  return this.browseController.browseUri(uri);
}

ControllerYTMusic.prototype.explodeUri = function (uri) {
  return this.browseController.explodeUri(uri);
};

ControllerYTMusic.prototype.clearAddPlayTrack = function (track) {
  return this.playController.clearAddPlayTrack(track);
}

ControllerYTMusic.prototype.stop = function () {
  return this.playController.stop();
};

ControllerYTMusic.prototype.pause = function () {
  return this.playController.pause();
};

ControllerYTMusic.prototype.resume = function () {
  return this.playController.resume();
}

ControllerYTMusic.prototype.next = function () {
  return this.playController.next();
}

ControllerYTMusic.prototype.previous = function () {
  return this.playController.previous();
}

ControllerYTMusic.prototype.seek = function (position) {
  return this.playController.seek(position);
}

ControllerYTMusic.prototype.goto = function (data) {
  const defer = libQ.defer();

  this.playController.getGotoUri(data).then((uri) => {
    if (uri) {
      defer.resolve(this.browseController.browseUri(uri));
    }
    else {
      const view = ViewHelper.getViewsFromUri(data.uri)?.[1];
      const trackData = view?.explodeTrackData ? JSON.parse(decodeURIComponent(view.explodeTrackData)) : null;
      const trackTitle = trackData?.title;
      const errMsg = trackTitle ? 
        ytmusic.getI18n(`YTMUSIC_ERR_GOTO_${data.type.toUpperCase()}_NOT_FOUND_FOR`, trackTitle) :
        ytmusic.getI18n(`YTMUSIC_ERR_GOTO_${data.type.toUpperCase()}_NOT_FOUND`);
      ytmusic.toast('error', errMsg);
      defer.reject(errMsg);
    }
  });

  return defer.promise;
}

ControllerYTMusic.prototype.search = function (query) {
  return this.searchController.search(query);
}
