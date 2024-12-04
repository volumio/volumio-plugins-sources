// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import vconf from 'v-conf';

import yt2 from './lib/YouTube2Context';
import BrowseController from './lib/controller/browse';
import SearchController, { type SearchQuery } from './lib/controller/search/SearchController';
import PlayController from './lib/controller/play/PlayController';
import { jsPromiseToKew, kewToJSPromise } from './lib/util';
import Model, { ModelType } from './lib/model';
import { type Account, type I18nOptionValue, type I18nOptions } from './lib/types/PluginConfig';
import { type QueueItem } from './lib/controller/browse/view-handlers/ExplodableViewHandler';
import ViewHelper from './lib/controller/browse/view-handlers/ViewHelper';
import InnertubeLoader from './lib/model/InnertubeLoader';
import { type NowPlayingPluginSupport } from 'now-playing-common';
import YouTube2NowPlayingMetadataProvider from './lib/util/YouTube2NowPlayingMetadataProvider';
import { Parser } from 'volumio-youtubei.js';

interface GotoParams extends QueueItem {
  type: 'album' | 'artist';
}

class ControllerYouTube2 implements NowPlayingPluginSupport {
  #context: any;
  #config: any;
  #commandRouter: any;

  #browseController: BrowseController | null;
  #searchController: SearchController | null;
  #playController: PlayController | null;

  #nowPlayingMetadataProvider: YouTube2NowPlayingMetadataProvider | null;

  constructor(context: any) {
    this.#context = context;
    this.#commandRouter = context.coreCommand;
  }

  getUIConfig() {
    const defer = libQ.defer();

    const langCode = this.#commandRouter.sharedVars.get('language_code');
    const loadConfigPromises = [
      kewToJSPromise(this.#commandRouter.i18nJson(`${__dirname}/i18n/strings_${langCode}.json`,
        `${__dirname}/i18n/strings_en.json`,
        `${__dirname}/UIConfig.json`)),
      this.#getConfigI18nOptions(),
      this.#getConfigAccountInfo()
    ] as const;

    const configModel = Model.getInstance(ModelType.Config);

    Promise.all(loadConfigPromises)
      .then(([ uiconf, i18nOptions, account ]) => {
        const i18nUIConf = uiconf.sections[0];
        const accountUIConf = uiconf.sections[1];
        const browseUIConf = uiconf.sections[2];
        const playbackUIConf = uiconf.sections[3];
        const ytPlaybackModeConf = uiconf.sections[4];

        // I18n
        // -- region
        i18nUIConf.content[0].label = i18nOptions.options.region?.label;
        i18nUIConf.content[0].options = i18nOptions.options.region?.optionValues;
        i18nUIConf.content[0].value = i18nOptions.selected.region;
        i18nUIConf.content[1].label = i18nOptions.options.language?.label;
        i18nUIConf.content[1].options = i18nOptions.options.language?.optionValues;
        i18nUIConf.content[1].value = i18nOptions.selected.language;

        // Account
        const cookie = yt2.getConfigValue('cookie');
        let authStatusDescription;
        if (account?.isSignedIn && account.active) {
          authStatusDescription = yt2.getI18n('YOUTUBE2_AUTH_STATUS_SIGNED_IN_AS', account.active.name);
          if (account.list.length > 1) {
            const accountSelect = {
              id: 'activeChannelHandle',
              element: 'select',
              label: yt2.getI18n('YOUTUBE2_ACTIVE_CHANNEL'),
              value: {
                label: account.active.name,
                value: account.active.handle
              },
              options: account.list.map((ac) => ({
                label: ac.name,
                value: ac.handle
              }))
            };
            accountUIConf.content = [
              accountUIConf.content[0],
              accountSelect,
              ...accountUIConf.content.slice(1)
            ];
            accountUIConf.saveButton.data.push('activeChannelHandle');
          }
        }
        else if (cookie) {
          authStatusDescription = yt2.getI18n('YOUTUBE2_AUTH_STATUS_SIGNED_OUT');
        }
        accountUIConf.description = authStatusDescription;
        accountUIConf.content[0].value = cookie;

        // Browse
        const rootContentType = yt2.getConfigValue('rootContentType');
        const rootContentTypeOptions = configModel.getRootContentTypeOptions();
        const loadFullPlaylists = yt2.getConfigValue('loadFullPlaylists');
        browseUIConf.content[0].options = rootContentTypeOptions;
        browseUIConf.content[0].value = rootContentTypeOptions.find((o) => o.value === rootContentType);
        browseUIConf.content[1].value = loadFullPlaylists;

        // Playback
        const autoplay = yt2.getConfigValue('autoplay');
        const autoplayClearQueue = yt2.getConfigValue('autoplayClearQueue');
        const autoplayPrefMixRelated = yt2.getConfigValue('autoplayPrefMixRelated');
        const addToHistory = yt2.getConfigValue('addToHistory');
        const liveStreamQuality = yt2.getConfigValue('liveStreamQuality');
        const liveStreamQualityOptions = configModel.getLiveStreamQualityOptions();
        const prefetchEnabled = yt2.getConfigValue('prefetch');
        playbackUIConf.content[0].value = autoplay;
        playbackUIConf.content[1].value = autoplayClearQueue;
        playbackUIConf.content[2].value = autoplayPrefMixRelated;
        playbackUIConf.content[3].value = addToHistory;
        playbackUIConf.content[4].options = liveStreamQualityOptions;
        playbackUIConf.content[4].value = liveStreamQualityOptions.find((o) => o.value === liveStreamQuality);
        playbackUIConf.content[5].value = prefetchEnabled;

        // YouTube Playback Mode
        const ytPlaybackMode = yt2.getConfigValue('ytPlaybackMode');
        ytPlaybackModeConf.content[0].value = ytPlaybackMode.feedVideos;
        ytPlaybackModeConf.content[1].value = ytPlaybackMode.playlistVideos;

        defer.resolve(uiconf);
      })
      .catch((error: unknown) => {
        yt2.getLogger().error(yt2.getErrorMessage(`[youtube2] getUIConfig(): Cannot populate YouTube2 configuration:`, error));
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
    yt2.init(this.#context, this.#config);

    this.#browseController = new BrowseController();
    this.#searchController = new SearchController();
    this.#playController = new PlayController();

    this.#nowPlayingMetadataProvider = new YouTube2NowPlayingMetadataProvider();
    Parser.setParserErrorHandler(() => null); // Disable Innertube parser error reporting

    this.#addToBrowseSources();

    return libQ.resolve();
  }

  onStop() {
    this.#commandRouter.volumioRemoveToBrowseSources('YouTube2');

    this.#playController?.reset();

    this.#browseController = null;
    this.#searchController = null;
    this.#playController = null;

    this.#nowPlayingMetadataProvider = null;

    InnertubeLoader.reset();
    yt2.reset();

    return libQ.resolve();
  }

  getConfigurationFiles() {
    return [ 'config.json' ];
  }

  async #getConfigI18nOptions() {
    const model = Model.getInstance(ModelType.Config);
    const selected: Record<keyof I18nOptions, I18nOptionValue> = {
      region: { label: '', value: '' },
      language: { label: '', value: '' }
    };
    try {
      const options = await model.getI18nOptions();
      const selectedValues = {
        region: yt2.getConfigValue('region'),
        language: yt2.getConfigValue('language')
      };

      (Object.keys(selected) as (keyof I18nOptions)[]).forEach((key) => {
        selected[key] = options[key]?.optionValues.find((ov) => ov.value === selectedValues[key]) || { label: '', value: selectedValues[key] };
      });

      return {
        options,
        selected
      };
    }
    catch (error: unknown) {
      yt2.getLogger().error(yt2.getErrorMessage('[youtube2] Error getting i18n options:', error));
      yt2.toast('warning', 'Could not obtain i18n options');
      return {
        options: model.getDefaultI18nOptions(),
        selected
      };
    }
  }

  #getConfigAccountInfo() {
    const model = Model.getInstance(ModelType.Account);
    try {
      return model.getInfo();
    }
    catch (error: unknown) {
      yt2.getLogger().warn(yt2.getErrorMessage('[youtube2] Failed to get account config:', error));
      return null;
    }
  }

  configSaveI18n(data: any) {
    const oldRegion = yt2.hasConfigKey('region') ? yt2.getConfigValue('region') : null;
    const oldLanguage = yt2.hasConfigKey('language') ? yt2.getConfigValue('language') : null;
    const region = data.region.value;
    const language = data.language.value;

    if (oldRegion !== region || oldLanguage !== language) {
      yt2.setConfigValue('region', region);
      yt2.setConfigValue('language', language);

      InnertubeLoader.applyI18nConfig();
      Model.getInstance(ModelType.Config).clearCache();
      yt2.refreshUIConfig();
    }

    yt2.toast('success', yt2.getI18n('YOUTUBE2_SETTINGS_SAVED'));
  }

  configSaveAccount(data: any) {
    const oldCookie = yt2.hasConfigKey('cookie') ? yt2.getConfigValue('cookie') : null;
    const cookie = data.cookie?.trim();
    const oldActiveChannelHandle = yt2.getConfigValue('activeChannelHandle');
    const activeChannelHandle = data.activeChannelHandle?.value || '';
    let resetInnertube = false;
    if (oldCookie !== cookie) {
      yt2.setConfigValue('cookie', cookie);
      yt2.deleteConfigValue('activeChannelHandle');
      resetInnertube = true;
    }
    else if (oldActiveChannelHandle !== activeChannelHandle) {
      yt2.setConfigValue('activeChannelHandle', activeChannelHandle);
      resetInnertube =  true;
    }
    yt2.toast('success', yt2.getI18n('YOUTUBE2_SETTINGS_SAVED'));
    if (resetInnertube) {
      InnertubeLoader.reset();
      yt2.refreshUIConfig();
    }
  }

  configSaveBrowse(data: any) {
    yt2.setConfigValue('rootContentType', data.rootContentType.value);
    yt2.setConfigValue('loadFullPlaylists', data.loadFullPlaylists);

    yt2.toast('success', yt2.getI18n('YOUTUBE2_SETTINGS_SAVED'));
  }

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
    const addToHistory = yt2.getConfigValue('addToHistory');
    const autoplay = yt2.getConfigValue('autoplay');

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

  configSaveYouTubePlaybackMode(data: any) {
    yt2.setConfigValue('ytPlaybackMode', {
      feedVideos: data.feedVideos,
      playlistVideos: data.playlistVideos
    });

    yt2.toast('success', yt2.getI18n('YOUTUBE2_SETTINGS_SAVED'));
  }

  #addToBrowseSources() {
    const source = {
      name: 'YouTube2',
      uri: 'youtube2',
      plugin_type: 'music_service',
      plugin_name: 'youtube2',
      albumart: '/albumart?sourceicon=music_service/youtube2/dist/assets/images/youtube.svg'
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
    })
    .catch((error: unknown) => {
      yt2.getLogger().error(yt2.getErrorMessage('[youtube2] Error obtaining goto URL:', error));
    });

    return defer.promise;
  }

  getNowPlayingMetadataProvider() {
    return this.#nowPlayingMetadataProvider;
  }
}

export = ControllerYouTube2;
