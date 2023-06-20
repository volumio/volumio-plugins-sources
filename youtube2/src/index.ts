// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import vconf from 'v-conf';

import Innertube from 'volumio-youtubei.js';
import yt2 from './lib/YouTube2Context';
import BrowseController from './lib/controller/browse';
import SearchController, { SearchQuery } from './lib/controller/search/SearchController';
import PlayController from './lib/controller/play/PlayController';
import { jsPromiseToKew } from './lib/util';
import Auth, { AuthStatus } from './lib/util/Auth';
import Model, { ModelType } from './lib/model';
import { Account, I18nOptionValue, I18nOptions } from './lib/types/ConfigData';
import { QueueItem } from './lib/controller/browse/view-handlers/ExplodableViewHandler';
import ViewHelper from './lib/controller/browse/view-handlers/ViewHelper';

interface GotoParams extends QueueItem {
  type: 'album' | 'artist';
}

class ControllerYouTube2 {
  #context: any;
  #config: any;
  #commandRouter: any;

  #browseController: BrowseController | null;
  #searchController: SearchController | null;
  #playController: PlayController | null;

  constructor(context: any) {
    this.#context = context;
    this.#commandRouter = context.coreCommand;
  }

  getUIConfig() {
    const defer = libQ.defer();

    const langCode = this.#commandRouter.sharedVars.get('language_code');
    const loadConfigPromises = [
      this.#commandRouter.i18nJson(`${__dirname}/i18n/strings_${langCode}.json`,
        `${__dirname}/i18n/strings_en.json`,
        `${__dirname}/UIConfig.json`),
      this.#getConfigI18nOptions()
    ];

    const authStatus = Auth.getAuthStatus();
    if (authStatus.status === AuthStatus.SignedIn) {
      loadConfigPromises.push(this.#getConfigAccountInfo());
    }
    else {
      loadConfigPromises.push(libQ.resolve(null));
    }

    const configModel = Model.getInstance(ModelType.Config);

    libQ.all(loadConfigPromises)
      .then(([ uiconf, i18nOptions, account ]: any) => {
        const i18nUIConf = uiconf.sections[0];
        const accountUIConf = uiconf.sections[1];
        const browseUIConf = uiconf.sections[2];
        const playbackUIConf = uiconf.sections[3];

        // I18n
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
          case AuthStatus.SignedIn:
            if (account) {
              authStatusDescription = yt2.getI18n('YOUTUBE2_AUTH_STATUS_SIGNED_IN_AS', (account as Account).name);
            }
            else {
              authStatusDescription = yt2.getI18n('YOUTUBE2_AUTH_STATUS_SIGNED_IN');
            }
            break;
          case AuthStatus.SigningIn:
            authStatusDescription = yt2.getI18n('YOUTUBE2_AUTH_STATUS_SIGNING_IN');
            break;
          case AuthStatus.Error:
            authStatusDescription = yt2.getI18n('YOUTUBE2_AUTH_STATUS_ERROR',
              yt2.getErrorMessage('', authStatus.error, false));
            break;
          default: // AuthStatus.SignedOut
            authStatusDescription = yt2.getI18n('YOUTUBE2_AUTH_STATUS_SIGNED_OUT');
        }

        if (authStatus.status === AuthStatus.SignedOut) {
          if (authStatus.verificationInfo) {
            authStatusDescription += ` ${yt2.getI18n('YOUTUBE2_AUTH_STATUS_CODE_READY')}`;

            accountUIConf.content = [
              {
                id: 'verificationUrl',
                type: 'text',
                element: 'input',
                label: yt2.getI18n('YOUTUBE2_VERIFICATION_URL'),
                value: authStatus.verificationInfo.verificationUrl
              },
              {
                id: 'openVerificationUrl',
                element: 'button',
                label: yt2.getI18n('YOUTUBE2_GO_TO_VERIFICATION_URL'),
                onClick: {
                  type: 'openUrl',
                  url: authStatus.verificationInfo.verificationUrl
                }
              },
              {
                id: 'code',
                type: 'text',
                element: 'input',
                label: yt2.getI18n('YOUTUBE2_DEVICE_CODE'),
                value: authStatus.verificationInfo.userCode
              }
            ];
          }
          else {
            authStatusDescription += ` ${yt2.getI18n('YOUTUBE2_AUTH_STATUS_CODE_PENDING')}`;
          }
        }
        else if (authStatus.status === AuthStatus.SignedIn) {
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
        const autoplayPrefMixRelated = yt2.getConfigValue('autoplayPrefMixRelated', false);
        const addToHistory = yt2.getConfigValue('addToHistory', true);
        const liveStreamQuality = yt2.getConfigValue('liveStreamQuality', 'auto');
        const liveStreamQualityOptions = configModel.getLiveStreamQualityOptions();
        const prefetchEnabled = yt2.getConfigValue('prefetch', true);
        playbackUIConf.content[0].value = autoplay;
        playbackUIConf.content[1].value = autoplayClearQueue;
        playbackUIConf.content[2].value = autoplayPrefMixRelated;
        playbackUIConf.content[3].value = addToHistory;
        playbackUIConf.content[4].options = liveStreamQualityOptions;
        playbackUIConf.content[4].value = liveStreamQualityOptions.find((o) => o.value === liveStreamQuality);
        playbackUIConf.content[5].value = prefetchEnabled;

        defer.resolve(uiconf);
      })
      .fail((error: any) => {
        yt2.getLogger().error(`[youtube2] getUIConfig(): Cannot populate YouTube2 configuration - ${error}`);
        defer.reject(Error());
      }
      );

    return defer.promise;
  }

  onVolumioStart() {
    const configFile = this.#commandRouter.pluginManager.getConfigurationFile(this.#context, 'config.json');
    this.#config = new vconf();
    this.#config.loadFile(configFile);
    return libQ.resolve();
  }

  onStart() {
    const defer = libQ.defer();

    yt2.init(this.#context, this.#config);

    this.#browseController = new BrowseController();
    this.#searchController = new SearchController();
    this.#playController = new PlayController();

    this.#initInnertube().then(() => {
      this.#addToBrowseSources();
      defer.resolve();
    });

    return defer.promise;
  }

  onStop() {
    this.#commandRouter.volumioRemoveToBrowseSources('YouTube2');

    this.#browseController = null;
    this.#searchController = null;
    this.#playController = null;

    Auth.unregisterHandlers();

    yt2.reset();

    return libQ.resolve();
  }

  #initInnertube() {
    const defer = libQ.defer();

    const innerTube = yt2.get('innertube');
    if (innerTube) {
      Auth.unregisterHandlers();
      yt2.set('innertube', null);
    }

    Innertube.create().then((innerTube) => {
      yt2.set('innertube', innerTube);
      this.#applyI18nConfigToInnerTube();
      Auth.registerHandlers();
      Auth.signIn();
      defer.resolve(innerTube);
    })
      .catch((error) => {
        defer.reject(error);
      });

    return defer.promise;
  }

  #applyI18nConfigToInnerTube = function () {
    const innertube = yt2.get<Innertube>('innertube');
    if (innertube) {
      const region = yt2.getConfigValue('region', 'US');
      const language = yt2.getConfigValue('language', 'en');

      innertube.session.context.client.gl = region;
      innertube.session.context.client.hl = language;
    }
  };

  getConfigurationFiles() {
    return [ 'config.json' ];
  }

  #getConfigI18nOptions() {
    const defer = libQ.defer();

    const model = Model.getInstance(ModelType.Config);
    model.getI18nOptions().then((options) => {
      const selectedValues = {
        region: yt2.getConfigValue('region', 'US'),
        language: yt2.getConfigValue('language', 'en')
      };
      const selected: Record<keyof I18nOptions, I18nOptionValue> = {
        region: { label: '', value: '' },
        language: { label: '', value: '' }
      };
      (Object.keys(selected) as (keyof I18nOptions)[]).forEach((key) => {
        selected[key] = options[key]?.optionValues.find((ov) => ov.value === selectedValues[key]) || { label: '', value: selectedValues[key] };
      });

      defer.resolve({
        options,
        selected
      });
    });

    return defer.promise;
  }

  #getConfigAccountInfo() {
    const defer = libQ.defer();

    const model = Model.getInstance(ModelType.Account);
    model.getInfo().then((account) => {
      defer.resolve(account);
    })
      .catch((error) => {
        yt2.getLogger().warn(`Failed to get account config: ${error}`);
        defer.resolve(null);
      });

    return defer.promise;
  }

  configSaveI18n(data: any) {
    const oldRegion = yt2.getConfigValue('region', null);
    const oldLanguage = yt2.getConfigValue('language', null);
    const region = data.region.value;
    const language = data.language.value;

    if (oldRegion !== region || oldLanguage !== language) {
      yt2.setConfigValue('region', region);
      yt2.setConfigValue('language', language);

      this.#applyI18nConfigToInnerTube();
      Model.getInstance(ModelType.Config).clearCache();
      yt2.refreshUIConfig();
    }

    yt2.toast('success', yt2.getI18n('YOUTUBE2_SETTINGS_SAVED'));
  }

  configSignOut = function () {
    Auth.signOut();
  };

  configSaveBrowse = function (data: any) {
    yt2.setConfigValue('rootContentType', data.rootContentType.value);
    yt2.setConfigValue('loadFullPlaylists', data.loadFullPlaylists);

    yt2.toast('success', yt2.getI18n('YOUTUBE2_SETTINGS_SAVED'));
  };

  configSavePlayback(data: any) {
    yt2.setConfigValue('autoplay', data.autoplay);
    yt2.setConfigValue('autoplayClearQueue', data.autoplayClearQueue);
    yt2.setConfigValue('autoplayPrefMixRelated', data.autoplayPrefMixRelated);
    yt2.setConfigValue('addToHistory', data.addToHistory);
    yt2.setConfigValue('liveStreamQuality', data.liveStreamQuality.value);
    yt2.setConfigValue('prefetch', data.prefetch);

    yt2.toast('success', yt2.getI18n('YOUTUBE2_SETTINGS_SAVED'));

    this.#configCheckAutoplay();
  }

  #configCheckAutoplay() {
    const addToHistory = yt2.getConfigValue<boolean>('addToHistory', true);
    const autoplay = yt2.getConfigValue<boolean>('autoplay', false);

    if (autoplay && !addToHistory) {
      const modalData = {
        title: yt2.getI18n('YOUTUBE2_AUTOPLAY'),
        message: yt2.getI18n('YOUTUBE2_MSG_AUTOPLAY_ADD_TO_HISTORY'),
        size: 'lg',
        buttons: [
          {
            name: yt2.getI18n('YOUTUBE2_CONFIRM_ADD_TO_HISTORY'),
            class: 'btn btn-info',
            emit: 'callMethod',
            payload: {
              endpoint: 'music_service/youtube2',
              method: 'configEnableAddToHistory'
            }
          },
          {
            name: yt2.getI18n('YOUTUBE2_NO'),
            class: 'btn'
          }
        ]
      };

      this.#commandRouter.broadcastMessage('openModal', modalData);
    }
  }

  configEnableAddToHistory() {
    yt2.setConfigValue('addToHistory', true);
    yt2.toast('success', yt2.getI18n('YOUTUBE2_SETTINGS_SAVED'));
    yt2.refreshUIConfig();
  }

  #addToBrowseSources() {
    const source = {
      name: 'YouTube2',
      uri: 'youtube2',
      plugin_type: 'music_service',
      plugin_name: 'youtube2',
      albumart: '/albumart?sourceicon=music_service/youtube2/assets/images/youtube.svg'
    };
    this.#commandRouter.volumioAddToBrowseSources(source);
  }

  handleBrowseUri(uri: string) {
    if (!this.#browseController) {
      return libQ.reject('YouTube2 plugin is not started');
    }
    return jsPromiseToKew(this.#browseController.browseUri(uri));
  }

  explodeUri(uri: string) {
    if (!this.#browseController) {
      return libQ.reject('YouTube2 Discover plugin is not started');
    }
    return jsPromiseToKew(this.#browseController.explodeUri(uri));
  }

  clearAddPlayTrack(track: any) {
    if (!this.#playController) {
      return libQ.reject('YouTube2 plugin is not started');
    }
    return jsPromiseToKew(this.#playController.clearAddPlayTrack(track));
  }

  stop() {
    if (!this.#playController) {
      return libQ.reject('YouTube2 plugin is not started');
    }
    return this.#playController.stop();
  }

  pause() {
    if (!this.#playController) {
      return libQ.reject('YouTube2 plugin is not started');
    }
    return this.#playController.pause();
  }

  resume() {
    if (!this.#playController) {
      return libQ.reject('YouTube2 plugin is not started');
    }
    return this.#playController.resume();
  }

  seek(position: number) {
    if (!this.#playController) {
      return libQ.reject('YouTube2 plugin is not started');
    }
    return this.#playController.seek(position);
  }

  next() {
    if (!this.#playController) {
      return libQ.reject('YouTube2 plugin is not started');
    }
    return this.#playController.next();
  }

  previous() {
    if (!this.#playController) {
      return libQ.reject('YouTube2 plugin is not started');
    }
    return this.#playController.previous();
  }

  prefetch(track: QueueItem) {
    if (!this.#playController) {
      return libQ.reject('YouTube2 plugin is not started');
    }
    return jsPromiseToKew(this.#playController.prefetch(track));
  }

  search(query: SearchQuery) {
    if (!this.#searchController) {
      return libQ.reject('YouTube2 plugin is not started');
    }
    return jsPromiseToKew(this.#searchController.search(query));
  }

  goto(data: GotoParams) {
    if (!this.#playController) {
      return libQ.reject('YouTube2 plugin is not started');
    }

    const defer = libQ.defer();

    this.#playController.getGotoUri(data.type, data.uri).then((uri) => {
      if (uri) {
        if (!this.#browseController) {
          return libQ.reject('YouTube2 plugin is not started');
        }
        defer.resolve(this.#browseController.browseUri(uri));
      }
      else {
        const view = ViewHelper.getViewsFromUri(data.uri)?.[1];
        const trackData = view?.explodeTrackData || null;
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
}

export = ControllerYouTube2;
