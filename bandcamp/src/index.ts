// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import vconf from 'v-conf';

import bandcamp from './lib/BandcampContext';
import BrowseController from './lib/controller/browse';
import SearchController, { SearchQuery } from './lib/controller/search/SearchController';
import PlayController from './lib/controller/play/PlayController';
import { ExplodedTrackInfo } from './lib/controller/browse/view-handlers/ExplodableViewHandler';
import { jsPromiseToKew } from './lib/util';
import { RenderedPage } from './lib/controller/browse/view-handlers/ViewHandler';
import ViewHelper from './lib/controller/browse/view-handlers/ViewHelper';
import { AlbumView } from './lib/controller/browse/view-handlers/AlbumViewHandler';
import View from './lib/controller/browse/view-handlers/View';
import { BandView } from './lib/controller/browse/view-handlers/BandViewHandler';
import { ShowView } from './lib/controller/browse/view-handlers/ShowViewHandler';
import { ArticleView } from './lib/controller/browse/view-handlers/ArticleViewHandler';
import Model from './lib/model';

interface GotoParams extends ExplodedTrackInfo {
  type: 'album' | 'artist';
}

class ControllerBandcamp {
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
      const myBandcampUIConf = uiconf.sections[1];
      const cacheUIConf = uiconf.sections[2];

      // General
      generalUIConf.content[0].value = bandcamp.getConfigValue('itemsPerPage', 47);
      generalUIConf.content[1].value = bandcamp.getConfigValue('combinedSearchResults', 17);
      generalUIConf.content[2].value = bandcamp.getConfigValue('searchByItemType', true);
      generalUIConf.content[3].value = bandcamp.getConfigValue('prefetch', true);

      // My Bandcamp
      const myBandcampType = bandcamp.getConfigValue('myBandcampType', 'cookie');
      const myBandcampTypeLabel = myBandcampType === 'cookie' ? bandcamp.getI18n('BANDCAMP_COOKIE') : bandcamp.getI18n('BANDCAMP_USERNAME');
      myBandcampUIConf.content[0].value = {
        value: myBandcampType,
        label: myBandcampTypeLabel
      };
      myBandcampUIConf.content[1].value = bandcamp.getConfigValue('myCookie', '');
      myBandcampUIConf.content[2].value = bandcamp.getConfigValue('myUsername', '');

      // Cache
      const cacheMaxEntries = bandcamp.getConfigValue('cacheMaxEntries', 5000);
      const cacheTTL = bandcamp.getConfigValue('cacheTTL', 1800);
      const cacheEntryCount = bandcamp.getCache().getEntryCount();
      cacheUIConf.content[0].value = cacheMaxEntries;
      cacheUIConf.content[1].value = cacheTTL;
      cacheUIConf.description = cacheEntryCount > 0 ? bandcamp.getI18n('BANDCAMP_CACHE_STATS', cacheEntryCount, Math.round(bandcamp.getCache().getMemoryUsageInKB()).toLocaleString()) : bandcamp.getI18n('BANDCAMP_CACHE_EMPTY');

      defer.resolve(uiconf);
    })
      .fail((error: any) => {
        bandcamp.getLogger().error(`[bandcamp] getUIConfig(): Cannot populate Bandcamp configuration - ${error}`);
        defer.reject(new Error());
      }
      );

    return defer.promise;
  }

  refreshUIConfig() {
    this.#commandRouter.getUIConfigOnPlugin('music_service', 'bandcamp', {}).then((config: any) => {
      this.#commandRouter.broadcastMessage('pushUiConfig', config);
    });
  }

  configSaveGeneralSettings(data: any) {
    const itemsPerPage = parseInt(data['itemsPerPage'], 10);
    const combinedSearchResults = parseInt(data['combinedSearchResults'], 10);
    if (!itemsPerPage) {
      bandcamp.toast('error', bandcamp.getI18n('BANDCAMP_SETTINGS_ERR_ITEMS_PER_PAGE'));
      return;
    }
    if (!combinedSearchResults) {
      bandcamp.toast('error', bandcamp.getI18n('BANDCAMP_SETTINGS_ERR_COMBINED_SEARCH_RESULTS'));
      return;
    }

    bandcamp.setConfigValue('itemsPerPage', itemsPerPage);
    bandcamp.setConfigValue('combinedSearchResults', combinedSearchResults);
    bandcamp.setConfigValue('searchByItemType', data.searchByItemType);
    bandcamp.setConfigValue('prefetch', data.prefetch);

    bandcamp.toast('success', bandcamp.getI18n('BANDCAMP_SETTINGS_SAVED'));
  }

  configSaveMyBandcampSettings(data: any) {
    const oldType = bandcamp.getConfigValue('myBandcampType', 'cookie');
    const oldMyCookie = bandcamp.getConfigValue('myCookie', '');
    const type = data.myBandcampType.value;
    const myCookie = data.myCookie.trim();
    bandcamp.setConfigValue('myBandcampType', type);
    bandcamp.setConfigValue('myUsername', data.myUsername.trim());
    bandcamp.setConfigValue('myCookie', myCookie);

    if (type === 'cookie') {
      Model.setCookie(myCookie);
    }
    else {
      Model.setCookie();
    }

    if (oldType !== type || (type === 'cookie' && oldMyCookie !== myCookie)) {
      bandcamp.getCache().clear();
    }

    bandcamp.toast('success', bandcamp.getI18n('BANDCAMP_SETTINGS_SAVED'));
  }

  configSaveCacheSettings(data: any) {
    const cacheMaxEntries = parseInt(data['cacheMaxEntries'], 10);
    const cacheTTL = parseInt(data['cacheTTL'], 10);
    if (cacheMaxEntries < 1000) {
      bandcamp.toast('error', bandcamp.getI18n('BANDCAMP_SETTINGS_ERR_CACHE_MAX_ENTRIES'));
      return;
    }
    if (cacheTTL < 600) {
      bandcamp.toast('error', bandcamp.getI18n('BANDCAMP_SETTINGS_ERR_CACHE_TTL'));
      return;
    }

    bandcamp.setConfigValue('cacheMaxEntries', cacheMaxEntries);
    bandcamp.setConfigValue('cacheTTL', cacheTTL);

    bandcamp.getCache().setMaxEntries(cacheMaxEntries);
    bandcamp.getCache().setTTL(cacheTTL);

    bandcamp.toast('success', bandcamp.getI18n('BANDCAMP_SETTINGS_SAVED'));
    this.refreshUIConfig();
  }

  configClearCache() {
    bandcamp.getCache().clear();
    Model.clearLibCache();
    bandcamp.toast('success', bandcamp.getI18n('BANDCAMP_CACHE_CLEARED'));
    this.refreshUIConfig();
  }

  onVolumioStart() {
    const configFile = this.#commandRouter.pluginManager.getConfigurationFile(this.#context, 'config.json');
    this.#config = new vconf();
    this.#config.loadFile(configFile);
    return libQ.resolve();
  }

  onStart() {
    bandcamp.init(this.#context, this.#config);

    const myBandcampType = bandcamp.getConfigValue('myBandcampType', 'cookie');
    if (myBandcampType === 'cookie') {
      const myCookie = bandcamp.getConfigValue('myCookie', '');
      if (myCookie) {
        Model.setCookie(myCookie);
      }
    }

    this.#browseController = new BrowseController();
    this.#searchController = new SearchController();
    this.#playController = new PlayController();

    this.#addToBrowseSources();

    return libQ.resolve();
  }

  onStop() {
    this.#commandRouter.volumioRemoveToBrowseSources('Bandcamp Discover');

    this.#browseController = null;
    this.#searchController = null;
    this.#playController?.dispose();
    this.#playController = null;

    Model.reset();
    bandcamp.reset();

    return libQ.resolve();
  }

  getConfigurationFiles() {
    return [ 'config.json' ];
  }

  #addToBrowseSources() {
    const data = {
      name: 'Bandcamp Discover',
      uri: 'bandcamp',
      plugin_type: 'music_service',
      plugin_name: 'bandcamp',
      albumart: '/albumart?sourceicon=music_service/bandcamp/dist/assets/images/bandcamp.png'
    };
    this.#commandRouter.volumioAddToBrowseSources(data);
  }

  handleBrowseUri(uri: string) {
    if (!this.#browseController) {
      return libQ.reject('Bandcamp Discover plugin is not started');
    }
    return jsPromiseToKew(this.#browseController.browseUri(uri));
  }

  explodeUri(uri: string) {
    if (!this.#browseController) {
      return libQ.reject('Bandcamp Discover plugin is not started');
    }
    return jsPromiseToKew(this.#browseController.explodeUri(uri));
  }

  clearAddPlayTrack(track: any) {
    if (!this.#playController) {
      return libQ.reject('Bandcamp Discover plugin is not started');
    }
    return jsPromiseToKew(this.#playController.clearAddPlayTrack(track));
  }

  stop() {
    if (!this.#playController) {
      return libQ.reject('Bandcamp Discover plugin is not started');
    }
    return this.#playController.stop();
  }

  pause() {
    if (!this.#playController) {
      return libQ.reject('Bandcamp Discover plugin is not started');
    }
    return this.#playController.pause();
  }

  resume() {
    if (!this.#playController) {
      return libQ.reject('Bandcamp Discover plugin is not started');
    }
    return this.#playController.resume();
  }

  seek(position: number) {
    if (!this.#playController) {
      return libQ.reject('Bandcamp Discover plugin is not started');
    }
    return this.#playController.seek(position);
  }

  next() {
    if (!this.#playController) {
      return libQ.reject('Bandcamp Discover plugin is not started');
    }
    return this.#playController.next();
  }

  previous() {
    if (!this.#playController) {
      return libQ.reject('Bandcamp Discover plugin is not started');
    }
    return this.#playController.previous();
  }

  prefetch(track: any) {
    if (!this.#playController) {
      return libQ.reject('Bandcamp Discover plugin is not started');
    }
    return jsPromiseToKew(this.#playController.prefetch(track));
  }

  search(query: SearchQuery) {
    if (!this.#searchController) {
      return libQ.reject('Bandcamp Discover plugin is not started');
    }
    return jsPromiseToKew(this.#searchController.search(query));
  }

  goto(data: GotoParams) {
    return jsPromiseToKew((async (): Promise<RenderedPage> => {
      if (!this.#browseController) {
        throw Error('Bandcamp Discover plugin is not started');
      }
      try {
        const views = ViewHelper.getViewsFromUri(data.uri);
        const trackView = views[1];
        if (!trackView) {
          return this.#browseController.browseUri('bandcamp');
        }
        let gotoView: View | null;
        if (data.type === 'album' && trackView.albumUrl) {
          gotoView = {
            name: 'album',
            albumUrl: trackView.albumUrl
          } as AlbumView;
        }
        else if (data.type === 'artist' && trackView.artistUrl) {
          gotoView = {
            name: 'band',
            bandUrl: trackView.artistUrl
          } as BandView;
        }
        else if (trackView.name === 'show' && trackView.showUrl) {
          gotoView = {
            name: 'show',
            showUrl: trackView.showUrl
          } as ShowView;
        }
        else if (trackView.name === 'article' && trackView.articleUrl) {
          gotoView = {
            name: 'article',
            articleUrl: trackView.articleUrl
          } as ArticleView;
        }
        else {
          gotoView = null;
        }

        if (gotoView) {
          return this.#browseController.browseUri(`bandcamp/${ViewHelper.constructUriSegmentFromView(gotoView)}`);
        }

        return this.#browseController.browseUri('bandcamp');

      }
      catch (error: any) {
        throw Error(`Failed to fetch requested info: ${error.message}`);
      }
    })());
  }

  saveDefaultDiscoverParams(data: any) {
    bandcamp.setConfigValue('defaultDiscoverParams', data, true);
    bandcamp.toast('success', bandcamp.getI18n('BANDCAMP_SETTINGS_SAVED'));
  }

  saveDefaultArticleCategory(data: any) {
    bandcamp.setConfigValue('defaultArticleCategory', data, true);
    bandcamp.toast('success', bandcamp.getI18n('BANDCAMP_SETTINGS_SAVED'));
  }
}

export = ControllerBandcamp;
