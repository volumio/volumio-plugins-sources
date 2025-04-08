// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import vconf from 'v-conf';

import mixcloud from './lib/MixcloudContext';
import BrowseController from './lib/controller/browse';
import SearchController, { SearchQuery } from './lib/controller/search/SearchController';
import PlayController from './lib/controller/play/PlayController';
import { ExplodedTrackInfo } from './lib/controller/browse/view-handlers/ExplodableViewHandler';
import { jsPromiseToKew } from './lib/util';
import { RenderedPage } from './lib/controller/browse/view-handlers/ViewHandler';
import ViewHelper from './lib/controller/browse/view-handlers/ViewHelper';
import Model from './lib/model';
import { UserView } from './lib/controller/browse/view-handlers/UserViewHandler';

interface GotoParams extends ExplodedTrackInfo {
  type: 'album' | 'artist';
}

class ControllerMixcloud {
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

    const lang_code = this.#commandRouter.sharedVars.get('language_code');

    const configPrepTasks = [
      this.#commandRouter.i18nJson(`${__dirname}/i18n/strings_${lang_code}.json`,
        `${__dirname}/i18n/strings_en.json`,
        `${__dirname}/UIConfig.json`)
    ];

    libQ.all(configPrepTasks).then((configParams: [any, string]) => {
      const [ uiconf ] = configParams;
      const generalUIConf = uiconf.sections[0];
      const cacheUIConf = uiconf.sections[1];

      // General
      generalUIConf.content[0].value = mixcloud.getConfigValue('itemsPerPage');
      generalUIConf.content[1].value = mixcloud.getConfigValue('itemsPerSection');

      // Cache
      const cacheMaxEntries = mixcloud.getConfigValue('cacheMaxEntries');
      const cacheTTL = mixcloud.getConfigValue('cacheTTL');
      const cacheEntryCount = mixcloud.getCache().getEntryCount();
      cacheUIConf.content[0].value = cacheMaxEntries;
      cacheUIConf.content[1].value = cacheTTL;
      cacheUIConf.description = cacheEntryCount > 0 ? mixcloud.getI18n('MIXCLOUD_CACHE_STATS', cacheEntryCount, Math.round(mixcloud.getCache().getMemoryUsageInKB()).toLocaleString()) : mixcloud.getI18n('MIXCLOUD_CACHE_EMPTY');

      defer.resolve(uiconf);
    })
      .fail((error: any) => {
        mixcloud.getLogger().error(`[mixcloud] getUIConfig(): Cannot populate Mixcloud configuration - ${error}`);
        defer.reject(new Error());
      }
      );

    return defer.promise;
  }

  refreshUIConfig() {
    this.#commandRouter.getUIConfigOnPlugin('music_service', 'mixcloud', {}).then((config: any) => {
      this.#commandRouter.broadcastMessage('pushUiConfig', config);
    });
  }

  configSaveGeneralSettings(data: any) {
    const itemsPerPage = parseInt(data.itemsPerPage, 10);
    const itemsPerSection = parseInt(data.itemsPerSection, 10);
    if (!itemsPerPage) {
      mixcloud.toast('error', mixcloud.getI18n('MIXCLOUD_SETTINGS_ERR_ITEMS_PER_PAGE'));
      return;
    }
    if (!itemsPerSection) {
      mixcloud.toast('error', mixcloud.getI18n('MIXCLOUD_SETTINGS_ERR_ITEMS_PER_SECTION'));
      return;
    }

    mixcloud.setConfigValue('itemsPerPage', itemsPerPage);
    mixcloud.setConfigValue('itemsPerSection', itemsPerSection);

    mixcloud.toast('success', mixcloud.getI18n('MIXCLOUD_SETTINGS_SAVED'));
  }

  configSaveCacheSettings(data: any) {
    const cacheMaxEntries = parseInt(data.cacheMaxEntries, 10);
    const cacheTTL = parseInt(data.cacheTTL, 10);
    if (cacheMaxEntries < 1000) {
      mixcloud.toast('error', mixcloud.getI18n('MIXCLOUD_SETTINGS_ERR_CACHE_MAX_ENTRIES'));
      return;
    }
    if (cacheTTL < 600) {
      mixcloud.toast('error', mixcloud.getI18n('MIXCLOUD_SETTINGS_ERR_CACHE_TTL'));
      return;
    }

    mixcloud.setConfigValue('cacheMaxEntries', cacheMaxEntries);
    mixcloud.setConfigValue('cacheTTL', cacheTTL);

    mixcloud.getCache().setMaxEntries(cacheMaxEntries);
    mixcloud.getCache().setTTL(cacheTTL);

    mixcloud.toast('success', mixcloud.getI18n('MIXCLOUD_SETTINGS_SAVED'));
    this.refreshUIConfig();
  }

  configClearCache() {
    mixcloud.getCache().clear();
    Model.clearLibCache();
    mixcloud.toast('success', mixcloud.getI18n('MIXCLOUD_CACHE_CLEARED'));
    this.refreshUIConfig();
  }

  onVolumioStart() {
    const configFile = this.#commandRouter.pluginManager.getConfigurationFile(this.#context, 'config.json');
    this.#config = new vconf();
    this.#config.loadFile(configFile);
    return libQ.resolve();
  }

  onStart() {
    mixcloud.init(this.#context, this.#config);

    this.#browseController = new BrowseController();
    this.#searchController = new SearchController();
    this.#playController = new PlayController();

    this.#addToBrowseSources();

    return libQ.resolve();
  }

  onStop() {
    this.#commandRouter.volumioRemoveToBrowseSources('Mixcloud');

    this.#browseController = null;
    this.#searchController = null;
    this.#playController = null;

    Model.reset();
    mixcloud.reset();

    return libQ.resolve();
  }

  getConfigurationFiles() {
    return [ 'config.json' ];
  }

  #addToBrowseSources() {
    const data = {
      name: 'Mixcloud',
      uri: 'mixcloud',
      plugin_type: 'music_service',
      plugin_name: 'mixcloud',
      albumart: '/albumart?sourceicon=music_service/mixcloud/dist/assets/images/mixcloud.png'
    };
    this.#commandRouter.volumioAddToBrowseSources(data);
  }

  handleBrowseUri(uri: string) {
    if (!this.#browseController) {
      return libQ.reject('Mixcloud plugin is not started');
    }
    return jsPromiseToKew(this.#browseController.browseUri(uri));
  }

  explodeUri(uri: string) {
    if (!this.#browseController) {
      return libQ.reject('Mixcloud plugin is not started');
    }
    return jsPromiseToKew(this.#browseController.explodeUri(uri));
  }

  clearAddPlayTrack(track: any) {
    if (!this.#playController) {
      return libQ.reject('Mixcloud plugin is not started');
    }
    return jsPromiseToKew(this.#playController.clearAddPlayTrack(track));
  }

  stop() {
    if (!this.#playController) {
      return libQ.reject('Mixcloud plugin is not started');
    }
    return this.#playController.stop();
  }

  pause() {
    if (!this.#playController) {
      return libQ.reject('Mixcloud plugin is not started');
    }
    return this.#playController.pause();
  }

  resume() {
    if (!this.#playController) {
      return libQ.reject('Mixcloud plugin is not started');
    }
    return this.#playController.resume();
  }

  seek(position: number) {
    if (!this.#playController) {
      return libQ.reject('Mixcloud plugin is not started');
    }
    return this.#playController.seek(position);
  }

  next() {
    if (!this.#playController) {
      return libQ.reject('Mixcloud plugin is not started');
    }
    return this.#playController.next();
  }

  previous() {
    if (!this.#playController) {
      return libQ.reject('Mixcloud plugin is not started');
    }
    return this.#playController.previous();
  }

  search(query: SearchQuery) {
    if (!this.#searchController) {
      return libQ.reject('Mixcloud plugin is not started');
    }
    return jsPromiseToKew(this.#searchController.search(query));
  }

  goto(data: GotoParams) {
    return jsPromiseToKew((async (): Promise<RenderedPage> => {
      if (!this.#browseController) {
        throw Error('Mixcloud plugin is not started');
      }
      try {
        const views = ViewHelper.getViewsFromUri(data.uri);
        const trackView = views.pop();
        if (trackView && data.type === 'artist') {
          let username: string | null = null;
          if (trackView.name === 'cloudcast' && trackView.owner) {
            username = trackView.owner;
          }
          else if (trackView.name === 'liveStream' && trackView.username) {
            username = trackView.username;
          }
          if (username) {
            const userView: UserView = {
              name: 'user',
              username
            };
            return this.#browseController.browseUri(`mixcloud/${ViewHelper.constructUriSegmentFromView(userView)}`);
          }
        }

        return this.#browseController.browseUri('mixcloud');
      }
      catch (error: any) {
        throw Error(`Failed to fetch requested info: ${error.message}`);
      }
    })());
  }
}

export = ControllerMixcloud;
