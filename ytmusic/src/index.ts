// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import vconf from 'v-conf';

import ytmusic from './lib/YTMusicContext';
import BrowseController from './lib/controller/browse/BrowseController';
import SearchController, { type SearchQuery } from './lib/controller/search/SearchController';
import PlayController from './lib/controller/play/PlayController';
import { jsPromiseToKew, kewToJSPromise } from './lib/util';
import Model, { ModelType } from './lib/model';
import { type I18nOptionValue, type I18nOptions } from './lib/types/PluginConfig';
import { type QueueItem } from './lib/controller/browse/view-handlers/ExplodableViewHandler';
import ViewHelper from './lib/controller/browse/view-handlers/ViewHelper';
import InnertubeLoader from './lib/model/InnertubeLoader';
import YTMusicNowPlayingMetadataProvider from './lib/util/YTMusicNowPlayingMetadataProvider';
import { type NowPlayingPluginSupport } from 'now-playing-common';
import { Parser } from 'volumio-youtubei.js';

interface GotoParams extends QueueItem {
  type: 'album' | 'artist';
}

class ControllerYTMusic implements NowPlayingPluginSupport {
  #context: any;
  #config: any;
  #commandRouter: any;

  #browseController: BrowseController | null;
  #searchController: SearchController | null;
  #playController: PlayController | null;

  #nowPlayingMetadataProvider: YTMusicNowPlayingMetadataProvider | null;

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

    Promise.all(loadConfigPromises)
      .then(([ uiconf, i18nOptions, account ]) => {
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
        const cookie = ytmusic.getConfigValue('cookie');
        let authStatusDescription;
        if (account?.isSignedIn && account.active) {
          authStatusDescription = ytmusic.getI18n('YTMUSIC_AUTH_STATUS_SIGNED_IN_AS', account.active.name);
          if (account.list.length > 1) {
            const accountSelect = {
              id: 'activeChannelHandle',
              element: 'select',
              label: ytmusic.getI18n('YTMUSIC_ACTIVE_CHANNEL'),
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
          authStatusDescription = ytmusic.getI18n('YTMUSIC_AUTH_STATUS_SIGNED_OUT');
        }
        accountUIConf.description = authStatusDescription;
        accountUIConf.content[0].value = cookie;

        // Browse
        const loadFullPlaylists = ytmusic.getConfigValue('loadFullPlaylists');
        browseUIConf.content[0].value = loadFullPlaylists;

        // Playback
        const autoplay = ytmusic.getConfigValue('autoplay');
        const autoplayClearQueue = ytmusic.getConfigValue('autoplayClearQueue');
        const addToHistory = ytmusic.getConfigValue('addToHistory');
        const prefetchEnabled = ytmusic.getConfigValue('prefetch');
        const preferOpus = ytmusic.getConfigValue('preferOpus');
        playbackUIConf.content[0].value = autoplay;
        playbackUIConf.content[1].value = autoplayClearQueue;
        playbackUIConf.content[2].value = addToHistory;
        playbackUIConf.content[3].value = prefetchEnabled;
        playbackUIConf.content[4].value = preferOpus;

        defer.resolve(uiconf);
      })
      .catch((error: unknown) => {
        ytmusic.getLogger().error(ytmusic.getErrorMessage('[ytmusic] getUIConfig(): Cannot populate YouTube Music configuration:', error));
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
    ytmusic.init(this.#context, this.#config);

    this.#browseController = new BrowseController();
    this.#searchController = new SearchController();
    this.#playController = new PlayController();

    this.#nowPlayingMetadataProvider = new YTMusicNowPlayingMetadataProvider();
    Parser.setParserErrorHandler(() => null); // Disable Innertube parser error reporting
    
    this.#addToBrowseSources();

    return libQ.resolve();
  }

  onStop() {
    this.#commandRouter.volumioRemoveToBrowseSources('YouTube Music');

    this.#playController?.reset();

    this.#browseController = null;
    this.#searchController = null;
    this.#playController = null;

    this.#nowPlayingMetadataProvider = null;

    InnertubeLoader.reset();
    ytmusic.reset();

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
        region: ytmusic.getConfigValue('region'),
        language: ytmusic.getConfigValue('language')
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
      ytmusic.getLogger().error(ytmusic.getErrorMessage('[ytmusic] Error getting i18n options:', error));
      ytmusic.toast('warning', 'Could not obtain i18n options');
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
      ytmusic.getLogger().warn(ytmusic.getErrorMessage('[ytmusic] Failed to get account config:', error));
      return null;
    }
  }

  configSaveI18n(data: any) {
    const oldRegion = ytmusic.hasConfigKey('region') ? ytmusic.getConfigValue('region') : null;
    const oldLanguage = ytmusic.hasConfigKey('language') ? ytmusic.getConfigValue('language') : null;
    const region = data.region.value;
    const language = data.language.value;

    if (oldRegion !== region || oldLanguage !== language) {
      ytmusic.setConfigValue('region', region);
      ytmusic.setConfigValue('language', language);

      InnertubeLoader.applyI18nConfig();
      Model.getInstance(ModelType.Config).clearCache();
      ytmusic.refreshUIConfig();
    }

    ytmusic.toast('success', ytmusic.getI18n('YTMUSIC_SETTINGS_SAVED'));
  }

  configSaveAccount(data: any) {
    const oldCookie = ytmusic.hasConfigKey('cookie') ? ytmusic.getConfigValue('cookie') : null;
    const cookie = data.cookie?.trim();
    const oldActiveChannelHandle = ytmusic.getConfigValue('activeChannelHandle');
    const activeChannelHandle = data.activeChannelHandle?.value || '';
    let resetInnertube = false;
    if (oldCookie !== cookie) {
      ytmusic.setConfigValue('cookie', cookie);
      ytmusic.deleteConfigValue('activeChannelHandle');
      resetInnertube = true;
    }
    else if (oldActiveChannelHandle !== activeChannelHandle) {
      ytmusic.setConfigValue('activeChannelHandle', activeChannelHandle);
      resetInnertube =  true;
    }
    ytmusic.toast('success', ytmusic.getI18n('YTMUSIC_SETTINGS_SAVED'));
    if (resetInnertube) {
      InnertubeLoader.reset();
      ytmusic.refreshUIConfig();
    }
  }

  configSaveBrowse(data: any) {
    ytmusic.setConfigValue('loadFullPlaylists', data.loadFullPlaylists);

    ytmusic.toast('success', ytmusic.getI18n('YTMUSIC_SETTINGS_SAVED'));
  }

  configSavePlayback(data: any) {
    ytmusic.setConfigValue('autoplay', data.autoplay);
    ytmusic.setConfigValue('autoplayClearQueue', data.autoplayClearQueue);
    ytmusic.setConfigValue('addToHistory', data.addToHistory);
    ytmusic.setConfigValue('prefetch', data.prefetch);
    ytmusic.setConfigValue('preferOpus', data.preferOpus);

    ytmusic.toast('success', ytmusic.getI18n('YTMUSIC_SETTINGS_SAVED'));
  }

  #addToBrowseSources() {
    const source = {
      name: 'YouTube Music',
      uri: 'ytmusic',
      plugin_type: 'music_service',
      plugin_name: 'ytmusic',
      albumart: '/albumart?sourceicon=music_service/ytmusic/dist/assets/images/ytmusic-mono-s.png'
    };
    this.#commandRouter.volumioAddToBrowseSources(source);
  }

  handleBrowseUri(uri: string) {
    if (!this.#browseController) {
      return libQ.reject('YouTube Music plugin is not started');
    }
    return jsPromiseToKew(this.#browseController.browseUri(uri));
  }

  explodeUri(uri: string) {
    if (!this.#browseController) {
      return libQ.reject('YouTube Music Discover plugin is not started');
    }
    return jsPromiseToKew(this.#browseController.explodeUri(uri));
  }

  clearAddPlayTrack(track: any) {
    if (!this.#playController) {
      return libQ.reject('YouTube Music plugin is not started');
    }
    return jsPromiseToKew(this.#playController.clearAddPlayTrack(track));
  }

  stop() {
    if (!this.#playController) {
      return libQ.reject('YouTube Music plugin is not started');
    }
    return this.#playController.stop();
  }

  pause() {
    if (!this.#playController) {
      return libQ.reject('YouTube Music plugin is not started');
    }
    return this.#playController.pause();
  }

  resume() {
    if (!this.#playController) {
      return libQ.reject('YouTube Music plugin is not started');
    }
    return this.#playController.resume();
  }

  seek(position: number) {
    if (!this.#playController) {
      return libQ.reject('YouTube Music plugin is not started');
    }
    return this.#playController.seek(position);
  }

  next() {
    if (!this.#playController) {
      return libQ.reject('YouTube Music plugin is not started');
    }
    return this.#playController.next();
  }

  previous() {
    if (!this.#playController) {
      return libQ.reject('YouTube Music plugin is not started');
    }
    return this.#playController.previous();
  }

  search(query: SearchQuery) {
    if (!this.#searchController) {
      return libQ.reject('YouTube Music plugin is not started');
    }
    return jsPromiseToKew(this.#searchController.search(query));
  }

  prefetch(track: QueueItem) {
    if (!this.#playController) {
      return libQ.reject('YouTube Music plugin is not started');
    }
    return jsPromiseToKew(this.#playController.prefetch(track));
  }

  goto(data: GotoParams) {
    if (!this.#playController) {
      return libQ.reject('YouTube Music plugin is not started');
    }

    const defer = libQ.defer();

    this.#playController.getGotoUri(data.type, data.uri).then((uri) => {
      if (uri) {
        if (!this.#browseController) {
          return libQ.reject('YouTube Music plugin is not started');
        }
        defer.resolve(this.#browseController.browseUri(uri));
      }
      else {
        const view = ViewHelper.getViewsFromUri(data.uri)?.[1];
        const trackData = view?.explodeTrackData || null;
        const trackTitle = trackData?.title;
        let errMsg;
        if (data.type === 'album') {
          errMsg = trackTitle ? ytmusic.getI18n('YTMUSIC_ERR_GOTO_ALBUM_NOT_FOUND_FOR', trackTitle) :
            ytmusic.getI18n('YTMUSIC_ERR_GOTO_ALBUM_NOT_FOUND');
        }
        else if (data.type === 'artist') {
          errMsg = trackTitle ? ytmusic.getI18n('YTMUSIC_ERR_GOTO_ARTIST_NOT_FOUND_FOR', trackTitle) :
            ytmusic.getI18n('YTMUSIC_ERR_GOTO_ARTIST_NOT_FOUND');
        }
        else {
          errMsg = ytmusic.getI18n('YTMUSIC_ERR_GOTO_UNKNOWN_TYPE', data.type);
        }

        ytmusic.toast('error', errMsg);
        defer.reject(Error(errMsg));
      }
    })
    .catch((error: unknown) => {
      ytmusic.getLogger().error(ytmusic.getErrorMessage('[ytmusic] Error obtaining goto URL:', error));
    });

    return defer.promise;
  }

  getNowPlayingMetadataProvider() {
    return this.#nowPlayingMetadataProvider;
  }
}

export = ControllerYTMusic;
