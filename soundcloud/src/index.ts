// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import vconf from 'v-conf';

import sc from './lib/SoundCloudContext';
import BrowseController from './lib/controller/browse/BrowseController';
import SearchController, { SearchQuery } from './lib/controller/search/SearchController';
import PlayController from './lib/controller/play/PlayController';
import { jsPromiseToKew } from './lib/util/Misc';
import { QueueItem } from './lib/controller/browse/view-handlers/ExplodableViewHandler';
import locales from './assets/locales.json';
import Model from './lib/model';
import { LongStreamFormat } from './lib/PluginConfig';

interface GotoParams extends QueueItem {
  type: 'album' | 'artist';
}

class ControllerSoundCloud {
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
    this.#commandRouter.i18nJson(`${__dirname}/i18n/strings_${langCode}.json`,
      `${__dirname}/i18n/strings_en.json`,
      `${__dirname}/UIConfig.json`)
      .then((uiconf: any) => {
        const generalUIConf = uiconf.sections[0];
        const playbackConf = uiconf.sections[1];
        const cacheUIConf = uiconf.sections[2];

        // General
        const localeOptions = this.#configGetLocaleOptions();
        const accessToken = sc.getConfigValue('accessToken');
        generalUIConf.content[0].value = accessToken;
        generalUIConf.content[2].value = localeOptions.selected;
        generalUIConf.content[2].options = localeOptions.options;
        generalUIConf.content[3].value = sc.getConfigValue('itemsPerPage');
        generalUIConf.content[4].value = sc.getConfigValue('itemsPerSection');
        generalUIConf.content[5].value = sc.getConfigValue('combinedSearchResults');
        generalUIConf.content[6].value = sc.getConfigValue('loadFullPlaylistAlbum');

        // Playback
        const longStreamFormat = sc.getConfigValue('longStreamFormat');
        playbackConf.content[0].value = sc.getConfigValue('skipPreviewTracks');
        playbackConf.content[1].value = sc.getConfigValue('addPlayedToHistory');
        playbackConf.content[1].hidden = !accessToken;
        playbackConf.content[2].options = [
          {
            value: LongStreamFormat.Opus,
            label: sc.getI18n('SOUNDCLOUD_LSF_HLS_OPUS')
          },
          {
            value: LongStreamFormat.MP3,
            label: sc.getI18n('SOUNDCLOUD_LSF_HLS_MP3')
          }
        ];
        switch (longStreamFormat) {
          case LongStreamFormat.Opus:
            playbackConf.content[2].value = playbackConf.content[2].options[0];
            break;
          case LongStreamFormat.MP3:
            playbackConf.content[2].value = playbackConf.content[2].options[1];
            break;
        }
        // Soundcloud-testing
        playbackConf.content[3].value = sc.getConfigValue('logTranscodings');

        // Cache
        const cacheMaxEntries = sc.getConfigValue('cacheMaxEntries');
        const cacheTTL = sc.getConfigValue('cacheTTL');
        const cacheEntryCount = sc.getCache().getEntryCount();
        cacheUIConf.content[0].value = cacheMaxEntries;
        cacheUIConf.content[1].value = cacheTTL;
        cacheUIConf.description = cacheEntryCount > 0 ? sc.getI18n('SOUNDCLOUD_CACHE_STATS', cacheEntryCount, Math.round(sc.getCache().getMemoryUsageInKB()).toLocaleString()) : sc.getI18n('SOUNDCLOUD_CACHE_EMPTY');

        defer.resolve(uiconf);
      })
      .fail((error: any) => {
        sc.getLogger().error(`[soundcloud] getUIConfig(): Cannot populate SoundCloud configuration - ${error}`);
        defer.reject(Error());
      }
      );

    return defer.promise;
  }

  configSaveGeneralSettings(data: any) {
    const itemsPerPage = parseInt(data['itemsPerPage'], 10);
    const itemsPerSection = parseInt(data['itemsPerSection'], 10);
    const combinedSearchResults = parseInt(data['combinedSearchResults'], 10);
    if (!itemsPerPage) {
      sc.toast('error', sc.getI18n('SOUNDCLOUD_SETTINGS_ERR_ITEMS_PER_PAGE'));
      return;
    }
    if (!itemsPerSection) {
      sc.toast('error', sc.getI18n('SOUNDCLOUD_SETTINGS_ERR_ITEMS_PER_SECTION'));
      return;
    }
    if (!combinedSearchResults) {
      sc.toast('error', sc.getI18n('SOUNDCLOUD_SETTINGS_ERR_COMBINED_SEARCH_RESULTS'));
      return;
    }

    const oldAccessToken = sc.getConfigValue('accessToken');
    const newAccessToken = data['accessToken'].trim();
    const oldLocale = sc.getConfigValue('locale');
    const newLocale = data['locale'].value;
    const accessTokenChanged = oldAccessToken !== newAccessToken;
    const localeChanged = oldLocale !== newLocale;

    sc.setConfigValue('accessToken', newAccessToken);
    sc.setConfigValue('locale', newLocale);
    sc.setConfigValue('itemsPerPage', itemsPerPage);
    sc.setConfigValue('itemsPerSection', itemsPerSection);
    sc.setConfigValue('combinedSearchResults', combinedSearchResults);
    sc.setConfigValue('loadFullPlaylistAlbum', !!data['loadFullPlaylistAlbum']);

    if (accessTokenChanged || localeChanged) {
      sc.getCache().clear();
    }

    if (localeChanged) {
      Model.setLocale(newLocale);
    }

    if (accessTokenChanged) {
      Model.setAccessToken(newAccessToken);
      sc.refreshUIConfig();
    }

    sc.toast('success', sc.getI18n('SOUNDCLOUD_SETTINGS_SAVED'));
  }

  configSaveCacheSettings(data: any) {
    const cacheMaxEntries = parseInt(data['cacheMaxEntries'], 10);
    const cacheTTL = parseInt(data['cacheTTL'], 10);
    if (cacheMaxEntries < 1000) {
      sc.toast('error', sc.getI18n('SOUNDCLOUD_SETTINGS_ERR_CACHE_MAX_ENTRIES'));
      return;
    }
    if (cacheTTL < 600) {
      sc.toast('error', sc.getI18n('SOUNDCLOUD_SETTINGS_ERR_CACHE_TTL'));
      return;
    }

    sc.setConfigValue('cacheMaxEntries', cacheMaxEntries);
    sc.setConfigValue('cacheTTL', cacheTTL);

    sc.getCache().setMaxEntries(cacheMaxEntries);
    sc.getCache().setTTL(cacheTTL);

    sc.toast('success', sc.getI18n('SOUNDCLOUD_SETTINGS_SAVED'));
    sc.refreshUIConfig();
  }

  configSavePlaybackSettings(data: any) {
    sc.setConfigValue('skipPreviewTracks', !!data['skipPreviewTracks']);
    sc.setConfigValue('addPlayedToHistory', !!data['addPlayedToHistory']);

    // Soundcloud-testing
    sc.setConfigValue('logTranscodings', !!data['logTranscodings']);

    const longStreamFormat = data['longStreamFormat'].value;
    if (longStreamFormat === LongStreamFormat.Opus || longStreamFormat === LongStreamFormat.MP3) {
      sc.setConfigValue('longStreamFormat', longStreamFormat);
    }

    sc.toast('success', sc.getI18n('SOUNDCLOUD_SETTINGS_SAVED'));
  }

  configClearCache() {
    sc.getCache().clear();
    sc.toast('success', sc.getI18n('SOUNDCLOUD_CACHE_CLEARED'));
    sc.refreshUIConfig();
  }

  #configGetLocaleOptions() {
    const options = locales.map((data) => ({
      value: data.locale,
      label: data.name
    }));

    const configValue = sc.getConfigValue('locale');
    const selected = options.find((option) => option.value === configValue);

    return {
      options,
      selected
    };
  }

  onVolumioStart() {
    const configFile = this.#commandRouter.pluginManager.getConfigurationFile(this.#context, 'config.json');
    this.#config = new vconf();
    this.#config.loadFile(configFile);
    return libQ.resolve();
  }

  onStart() {
    sc.init(this.#context, this.#config);

    this.#browseController = new BrowseController();
    this.#searchController = new SearchController();
    this.#playController = new PlayController();

    const accessToken = sc.getConfigValue('accessToken');
    if (accessToken) {
      Model.setAccessToken(accessToken);
    }
    Model.setLocale(sc.getConfigValue('locale'));

    this.#addToBrowseSources();

    return libQ.resolve();
  }

  onStop() {
    this.#commandRouter.volumioRemoveToBrowseSources('SoundCloud');

    this.#browseController = null;
    this.#searchController = null;
    this.#playController = null;

    sc.reset();

    return libQ.resolve();
  }

  getConfigurationFiles() {
    return [ 'config.json' ];
  }

  #addToBrowseSources() {
    const source = {
      name: 'SoundCloud',
      uri: 'soundcloud',
      plugin_type: 'music_service',
      plugin_name: 'soundcloud',
      albumart: '/albumart?sourceicon=music_service/soundcloud/dist/assets/images/soundcloud.png'
    };
    this.#commandRouter.volumioAddToBrowseSources(source);
  }

  handleBrowseUri(uri: string) {
    if (!this.#browseController) {
      return libQ.reject('SoundCloud plugin is not started');
    }
    return jsPromiseToKew(this.#browseController.browseUri(uri));
  }

  explodeUri(uri: string) {
    if (!this.#browseController) {
      return libQ.reject('SoundCloud plugin is not started');
    }
    return jsPromiseToKew(this.#browseController.explodeUri(uri));
  }

  clearAddPlayTrack(track: any) {
    if (!this.#playController) {
      return libQ.reject('SoundCloud plugin is not started');
    }
    return jsPromiseToKew(this.#playController.clearAddPlayTrack(track));
  }

  stop() {
    if (!this.#playController) {
      return libQ.reject('SoundCloud plugin is not started');
    }
    return this.#playController.stop();
  }

  pause() {
    if (!this.#playController) {
      return libQ.reject('SoundCloud plugin is not started');
    }
    return this.#playController.pause();
  }

  resume() {
    if (!this.#playController) {
      return libQ.reject('SoundCloud plugin is not started');
    }
    return this.#playController.resume();
  }

  seek(position: number) {
    if (!this.#playController) {
      return libQ.reject('SoundCloud plugin is not started');
    }
    return this.#playController.seek(position);
  }

  next() {
    if (!this.#playController) {
      return libQ.reject('SoundCloud plugin is not started');
    }
    return this.#playController.next();
  }

  previous() {
    if (!this.#playController) {
      return libQ.reject('SoundCloud plugin is not started');
    }
    return this.#playController.previous();
  }

  search(query: SearchQuery) {
    if (!this.#searchController) {
      return libQ.reject('SoundCloud plugin is not started');
    }
    return jsPromiseToKew(this.#searchController.search(query));
  }

  goto(data: GotoParams) {
    if (!this.#playController) {
      return libQ.reject('SoundCloud plugin is not started');
    }

    const defer = libQ.defer();

    this.#playController.getGotoUri(data.type, data.uri).then((uri) => {
      if (uri) {
        if (!this.#browseController) {
          return libQ.reject('SoundCloud plugin is not started');
        }
        defer.resolve(this.#browseController.browseUri(uri));
      }
    });

    return defer.promise;
  }
}

export = ControllerSoundCloud;
