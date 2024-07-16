// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import vconf from 'v-conf';

import jellyfin from './lib/JellyfinContext';
import ServerPoller from './lib/connection/ServerPoller';
import { Jellyfin as JellyfinSdk } from '@jellyfin/sdk';
import pluginInfo from '../package.json';
import BrowseController from './lib/controller/browse';
import ConnectionManager, { JellyfinSdkInitInfo } from './lib/connection/ConnectionManager';
import SearchController, { SearchQuery } from './lib/controller/search/SearchController';
import PlayController from './lib/controller/play/PlayController';
import { ExplodedTrackInfo } from './lib/controller/browse/view-handlers/Explodable';
import { jsPromiseToKew, kewToJSPromise } from './lib/util';
import ServerHelper from './lib/util/ServerHelper';
import { SongView } from './lib/controller/browse/view-handlers/SongViewHandler';
import ViewHelper from './lib/controller/browse/view-handlers/ViewHelper';
import { AlbumView } from './lib/controller/browse/view-handlers/AlbumViewHandler';
import { RenderedPage } from './lib/controller/browse/view-handlers/ViewHandler';
import SongHelper from './lib/util/SongHelper';
import { PluginConfigKey } from './lib/util/PluginConfig';
import { NowPlayingPluginSupport } from 'now-playing-common';
import JellyfinNowPlayingMetadataProvider from './lib/util/JellyfinNowPlayingMetadataProvider';

interface GotoParams extends ExplodedTrackInfo {
  type: 'album' | 'artist';
}

type SetSongFavoriteResponse = {
  service: 'jellyfin',
  uri: string,
  favourite: boolean
} | { success: false } | undefined;

class ControllerJellyfin implements NowPlayingPluginSupport {
  #context: any;
  #config: any;
  #commandRouter: any;

  #serverPoller: ServerPoller | null;
  #connectionManager: ConnectionManager | null;
  #browseController: BrowseController | null;
  #searchController: SearchController | null;
  #playController: PlayController | null;

  #nowPlayingMetadataProvider: JellyfinNowPlayingMetadataProvider | null;

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
      const removeServerUIConf = uiconf.sections[1];
      const browseSettingsUIConf = uiconf.sections[2];
      const playAddUIConf = uiconf.sections[3];
      const searchSettingsUIConf = uiconf.sections[4];
      const myMediaLibraryUIConf = uiconf.sections[5];

      // Remove Server section
      const servers = ServerHelper.getServersFromConfig();
      servers.forEach((server, index) => {
        removeServerUIConf.content[0].options.push({
          value: index,
          label: `${server.username}@${server.url}`
        });
      });
      if (servers.length > 0) {
        removeServerUIConf.content[0].value = removeServerUIConf.content[0].options[0];
      }

      // Browse Settings section
      const itemsPerPage = jellyfin.getConfigValue('itemsPerPage');
      const showAllAlbumTracks = jellyfin.getConfigValue('showAllAlbumTracks');
      const showAllPlaylistTracks = jellyfin.getConfigValue('showAllPlaylistTracks');
      const rememberFilters = jellyfin.getConfigValue('rememberFilters');
      const markFavoriteTarget = jellyfin.getConfigValue('markFavoriteTarget');
      const markFavoriteTargetOptions = browseSettingsUIConf.content[4].options;
      browseSettingsUIConf.content[0].value = itemsPerPage;
      browseSettingsUIConf.content[1].value = showAllAlbumTracks;
      browseSettingsUIConf.content[2].value = showAllPlaylistTracks;
      browseSettingsUIConf.content[3].value = rememberFilters;
      browseSettingsUIConf.content[4].value = markFavoriteTargetOptions.find((option: any) => option.value === markFavoriteTarget);

      // Play / Add to Queue section
      const maxTracks = jellyfin.getConfigValue('maxTracks');
      const noMaxTracksSingleAlbum = jellyfin.getConfigValue('noMaxTracksSingleAlbum');
      const noMaxTracksSinglePlaylist = jellyfin.getConfigValue('noMaxTracksSinglePlaylist');
      const gaplessPlayback = jellyfin.getConfigValue('gaplessPlayback');
      playAddUIConf.content[0].value = maxTracks;
      playAddUIConf.content[1].value = noMaxTracksSingleAlbum;
      playAddUIConf.content[2].value = noMaxTracksSinglePlaylist;
      playAddUIConf.content[3].value = gaplessPlayback;

      // Search Settings section
      const searchAlbums = jellyfin.getConfigValue('searchAlbums');
      const searchAlbumsResultCount = jellyfin.getConfigValue('searchAlbumsResultCount');
      const searchArtists = jellyfin.getConfigValue('searchArtists');
      const searchArtistsResultCount = jellyfin.getConfigValue('searchArtistsResultCount');
      const searchSongs = jellyfin.getConfigValue('searchSongs');
      const searchSongsResultCount = jellyfin.getConfigValue('searchSongsResultCount');
      searchSettingsUIConf.content[0].value = searchAlbums;
      searchSettingsUIConf.content[1].value = searchAlbumsResultCount;
      searchSettingsUIConf.content[2].value = searchArtists;
      searchSettingsUIConf.content[3].value = searchArtistsResultCount;
      searchSettingsUIConf.content[4].value = searchSongs;
      searchSettingsUIConf.content[5].value = searchSongsResultCount;

      // My Media / Library
      const showLatestMusicSection = jellyfin.getConfigValue('showLatestMusicSection');
      const latestMusicSectionItems = jellyfin.getConfigValue('latestMusicSectionItems');
      const showRecentlyPlayedSection = jellyfin.getConfigValue('showRecentlyPlayedSection');
      const recentlyPlayedSectionItems = jellyfin.getConfigValue('recentlyPlayedSectionItems');
      const showFrequentlyPlayedSection = jellyfin.getConfigValue('showFrequentlyPlayedSection');
      const frequentlyPlayedSectionItems = jellyfin.getConfigValue('frequentlyPlayedSectionItems');
      const showFavoriteArtistsSection = jellyfin.getConfigValue('showFavoriteArtistsSection');
      const favoriteArtistsSectionItems = jellyfin.getConfigValue('favoriteArtistsSectionItems');
      const showFavoriteAlbumsSection = jellyfin.getConfigValue('showFavoriteAlbumsSection');
      const favoriteAlbumsSectionItems = jellyfin.getConfigValue('favoriteAlbumsSectionItems');
      const showFavoriteSongsSection = jellyfin.getConfigValue('showFavoriteSongsSection');
      const favoriteSongsSectionItems = jellyfin.getConfigValue('favoriteSongsSectionItems');
      const collectionInSectionItems = jellyfin.getConfigValue('collectionInSectionItems');
      myMediaLibraryUIConf.content[0].value = showLatestMusicSection;
      myMediaLibraryUIConf.content[1].value = latestMusicSectionItems;
      myMediaLibraryUIConf.content[2].value = showRecentlyPlayedSection;
      myMediaLibraryUIConf.content[3].value = recentlyPlayedSectionItems;
      myMediaLibraryUIConf.content[4].value = showFrequentlyPlayedSection;
      myMediaLibraryUIConf.content[5].value = frequentlyPlayedSectionItems;
      myMediaLibraryUIConf.content[6].value = showFavoriteArtistsSection;
      myMediaLibraryUIConf.content[7].value = favoriteArtistsSectionItems;
      myMediaLibraryUIConf.content[8].value = showFavoriteAlbumsSection;
      myMediaLibraryUIConf.content[9].value = favoriteAlbumsSectionItems;
      myMediaLibraryUIConf.content[10].value = showFavoriteSongsSection;
      myMediaLibraryUIConf.content[11].value = favoriteSongsSectionItems;
      myMediaLibraryUIConf.content[12].value = collectionInSectionItems;

      defer.resolve(uiconf);
    })
      .fail((error: any) => {
        jellyfin.getLogger().error(`[jellyfin] getUIConfig(): Cannot populate Jellyfin configuration - ${error}`);
        defer.reject(new Error());
      });

    return defer.promise;
  }

  refreshUIConfig() {
    this.#commandRouter.getUIConfigOnPlugin('music_service', 'jellyfin', {}).then((config: any) => {
      this.#commandRouter.broadcastMessage('pushUiConfig', config);
    });
  }

  configAddServer(data: any) {
    const host = data['host']?.trim() || '';
    if (host === '') {
      jellyfin.toast('error', jellyfin.getI18n('JELLYFIN_SPECIFY_HOST'));
      return;
    }

    let url;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      url = (new URL(host)).toString();
    }
    catch (error) {
      jellyfin.toast('error', jellyfin.getI18n('JELLYFIN_INVALID_HOST'));
      return;
    }

    const username = data['username']?.trim() || '';
    const password = data['password'] || '';

    if (username === '') {
      jellyfin.toast('error', jellyfin.getI18n('JELLYFIN_SPECIFY_USERNAME'));
      return;
    }

    if (ServerHelper.hasServerConfig(username, host)) {
      jellyfin.toast('error', jellyfin.getI18n('JELLYFIN_SERVER_CONF_EXISTS', username, host));
      return;
    }

    const servers = ServerHelper.getServersFromConfig();
    servers.push({
      url: host,
      username: username,
      password: password
    });
    jellyfin.setConfigValue('servers', servers);
    jellyfin.toast('success', jellyfin.getI18n('JELLYFIN_SERVER_ADDED'));

    this.#serverPoller?.addTarget(host);
    this.refreshUIConfig();
  }

  async configRemoveServer(data: any) {
    const index = data['server_entry'].value;
    if (index !== '') {
      const servers = ServerHelper.getServersFromConfig();
      const removed = servers.splice(index, 1)[0];
      jellyfin.setConfigValue('servers', servers);
      jellyfin.toast('success', jellyfin.getI18n('JELLYFIN_SERVER_REMOVED'));

      const removedServer = this.#serverPoller?.findOnlineServer(removed.url);
      if (removedServer) {
        const connection = this.#connectionManager?.findConnection(removedServer, removed.username, true);
        if (connection) {
          await this.#connectionManager?.logout(connection);
        }

        const hasOtherServerWithSameUrl = !!servers.find((server) =>
          removedServer.connectionUrl === ServerHelper.getConnectionUrl(server.url));

        if (!hasOtherServerWithSameUrl) {
          this.#serverPoller?.removeTarget(removedServer.url);
        }
      }

      this.refreshUIConfig();
    }
  }

  configSaveBrowseSettings(data: any) {
    const showKeys: PluginConfigKey[] = [
      'showAllAlbumTracks',
      'showAllPlaylistTracks',
      'rememberFilters'
    ];
    showKeys.forEach((key) => {
      jellyfin.setConfigValue(key, data[key]);
    });

    jellyfin.setConfigValue('markFavoriteTarget', data['markFavoriteTarget'].value);

    const itemsPerPage = parseInt(data.itemsPerPage, 10);
    if (itemsPerPage) {
      jellyfin.setConfigValue('itemsPerPage', itemsPerPage);
      jellyfin.toast('success', jellyfin.getI18n('JELLYFIN_SETTINGS_SAVED'));
    }
    else {
      jellyfin.toast('error', jellyfin.getI18n('JELLYFIN_SETTINGS_ERR_ITEMS_PER_PAGE'));
    }
  }

  configSavePlayAddSettings(data: any) {
    const noMaxTrackKeys: PluginConfigKey[] = [
      'noMaxTracksSingleAlbum',
      'noMaxTracksSinglePlaylist',
      'gaplessPlayback'
    ];
    noMaxTrackKeys.forEach((key) => {
      jellyfin.setConfigValue(key, data[key]);
    });
    const maxTracks = parseInt(data.maxTracks, 10);
    if (maxTracks) {
      jellyfin.setConfigValue('maxTracks', maxTracks);
      jellyfin.toast('success', jellyfin.getI18n('JELLYFIN_SETTINGS_SAVED'));
    }
    else {
      jellyfin.toast('error', jellyfin.getI18n('JELLYFIN_SETTINGS_ERR_MAX_TRACK'));
    }
  }

  configSaveSearchSettings(data: any) {
    const searchKeys: PluginConfigKey[] = [
      'searchAlbums',
      'searchArtists',
      'searchSongs'
    ];
    searchKeys.forEach((key) => {
      jellyfin.setConfigValue(key, data[key]);
    });

    const resultCountKeys: PluginConfigKey[] = [
      'searchAlbumsResultCount',
      'searchArtistsResultCount',
      'searchSongsResultCount'
    ];
    let hasInvalidResultCountValue = false;
    resultCountKeys.forEach((key) => {
      const value = parseInt(data[key], 10);
      if (value) {
        jellyfin.setConfigValue(key, value);
      }
      else {
        hasInvalidResultCountValue = true;
      }
    });

    if (hasInvalidResultCountValue) {
      jellyfin.toast('error', jellyfin.getI18n('JELLYFIN_SETTINGS_ERR_RESULT_COUNT'));
    }
    else {
      jellyfin.toast('success', jellyfin.getI18n('JELLYFIN_SETTINGS_SAVED'));
    }
  }

  configSaveMyMediaLibrarySettings(data: any) {
    const showKeys: PluginConfigKey[] = [
      'showLatestMusicSection',
      'showRecentlyPlayedSection',
      'showFrequentlyPlayedSection',
      'showFavoriteArtistsSection',
      'showFavoriteAlbumsSection',
      'showFavoriteSongsSection'
    ];
    showKeys.forEach((key) => {
      jellyfin.setConfigValue(key, data[key]);
    });

    const itemsKeys: PluginConfigKey[] = [
      'latestMusicSectionItems',
      'recentlyPlayedSectionItems',
      'frequentlyPlayedSectionItems',
      'favoriteArtistsSectionItems',
      'favoriteAlbumsSectionItems',
      'favoriteSongsSectionItems',
      'collectionInSectionItems'
    ];
    let hasInvalidItemsValue = false;
    itemsKeys.forEach((key) => {
      const value = parseInt(data[key], 10);
      if (value) {
        jellyfin.setConfigValue(key, value);
      }
      else {
        hasInvalidItemsValue = true;
      }
    });

    if (hasInvalidItemsValue) {
      jellyfin.toast('error', jellyfin.getI18n('JELLYFIN_SETTINGS_ERR_NUM_ITEMS'));
    }
    else {
      jellyfin.toast('success', jellyfin.getI18n('JELLYFIN_SETTINGS_SAVED'));
    }
  }

  onVolumioStart() {
    const configFile = this.#commandRouter.pluginManager.getConfigurationFile(this.#context, 'config.json');
    this.#config = new vconf();
    this.#config.loadFile(configFile);
    return libQ.resolve();
  }

  onStart() {
    jellyfin.init(this.#context, this.#config);

    // Initialize Jellyfin SDK
    const deviceInfo = jellyfin.getDeviceInfo();
    const sdkInitInfo: JellyfinSdkInitInfo = {
      clientInfo: {
        name: 'Jellyfin plugin for Volumio',
        version: pluginInfo.version
      },
      deviceInfo: {
        name: deviceInfo.name,
        id: deviceInfo.id
      }
    };
    const sdk = new JellyfinSdk(sdkInitInfo);

    this.#serverPoller = new ServerPoller(sdk);
    const pollListener = () => {
      jellyfin.set('onlineServers', this.#serverPoller?.getOnlineServers());
    };
    this.#serverPoller.on('serverOnline', pollListener.bind(this));
    this.#serverPoller.on('serverLost', pollListener.bind(this));
    const servers = ServerHelper.getServersFromConfig();
    this.#serverPoller.addTarget(servers.reduce<string[]>((urls, s) => {
      urls.push(s.url);
      return urls;
    }, []));

    this.#connectionManager = new ConnectionManager(sdkInitInfo);

    this.#browseController = new BrowseController(this.#connectionManager);
    this.#searchController = new SearchController(this.#connectionManager);
    this.#playController = new PlayController(this.#connectionManager);

    this.#nowPlayingMetadataProvider = new JellyfinNowPlayingMetadataProvider(this.#connectionManager);

    this.#addToBrowseSources();

    jellyfin.getLogger().info('[jellyfin] Initialized plugin with device info: ', deviceInfo);

    return libQ.resolve();
  }

  onStop() {
    const defer = libQ.defer();

    this.#serverPoller?.removeAllListeners();
    this.#serverPoller?.clearTargets();
    this.#serverPoller = null;

    this.#commandRouter.volumioRemoveToBrowseSources('Jellyfin');

    this.#browseController = null;
    this.#searchController = null;
    this.#playController?.dispose();
    this.#playController = null;

    this.#nowPlayingMetadataProvider = null;

    if (this.#connectionManager) {
      this.#connectionManager?.logoutAll().then(() => {
        jellyfin.reset();
        defer.resolve();
      });
    }
    else {
      defer.resolve();
    }

    return defer.promise;
  }

  getConfigurationFiles() {
    return [ 'config.json' ];
  }

  #addToBrowseSources() {
    const data = {
      name: 'Jellyfin',
      uri: 'jellyfin',
      plugin_type: 'music_service',
      plugin_name: 'jellyfin',
      albumart: '/albumart?sourceicon=music_service/jellyfin/dist/assets/images/jellyfin-mono.png'
    };
    this.#commandRouter.volumioAddToBrowseSources(data);
  }

  handleBrowseUri(uri: string) {
    if (this.#browseController) {
      return jsPromiseToKew(this.#browseController.browseUri(uri));
    }
    return libQ.reject('Jellyfin plugin is not started');
  }

  explodeUri(uri: string) {
    if (this.#browseController) {
      return jsPromiseToKew(this.#browseController.explodeUri(uri));
    }
    return libQ.reject('Jellyfin plugin is not started');
  }

  clearAddPlayTrack(track: any) {
    return this.#playController?.clearAddPlayTrack(track);
  }

  stop() {
    return this.#playController?.stop();
  }

  pause() {
    return this.#playController?.pause();
  }

  resume() {
    return this.#playController?.resume();
  }

  seek(position: number) {
    return this.#playController?.seek(position);
  }

  next() {
    return this.#playController?.next();
  }

  previous() {
    return this.#playController?.previous();
  }

  prefetch(track: any) {
    if (!this.#playController) {
      return libQ.reject('Jellyfin plugin is not started');
    }
    return jsPromiseToKew(this.#playController.prefetch(track));
  }

  search(query: SearchQuery) {
    if (this.#searchController) {
      return jsPromiseToKew(this.#searchController.search(query));
    }
    return libQ.reject('Jellyfin plugin is not started');
  }

  goto(data: GotoParams) {
    return jsPromiseToKew((async (): Promise<RenderedPage> => {
      if (!this.#playController || !this.#browseController) {
        throw Error('Jellyfin plugin is not started');
      }

      try {
        const { song, connection } = await this.#playController.getSongFromTrack(data);
        if (data.type === 'album') {
          if (song.album?.id) {
            const songView: SongView = {
              name: 'songs',
              albumId: song.album.id
            };
            return this.#browseController.browseUri(`jellyfin/${connection.id}/${ViewHelper.constructUriSegmentFromView(songView)}`);
          }
          throw Error('Song is missing album info');
        }
        else if (data.type === 'artist') {
          if (song.artists?.[0]?.id) {
            const albumView: AlbumView = {
              name: 'albums',
              artistId: song.artists[0].id
            };
            return this.#browseController.browseUri(`jellyfin/${connection.id}/${ViewHelper.constructUriSegmentFromView(albumView)}`);
          }
          throw Error('Song is missing artist info');
        }
        else {
          throw Error(`Invalid type '${data.type}'`);
        }
      }
      catch (error: any) {
        throw Error(`Failed to fetch requested info: ${error.message}`);
      }
    })());
  }

  addToFavourites(data: { uri: string, service: string }) {
    return this.#setSongFavorite(data.uri, true);
  }

  removeFromFavourites(data: {uri: string, service: string}) {
    return this.#setSongFavorite(data.uri, false);
  }

  #setSongFavorite(uri: string, favorite: boolean) {
    return jsPromiseToKew((async (): Promise<SetSongFavoriteResponse> => {
      if (!this.#connectionManager) {
        throw Error('Jellyfin plugin is not started');
      }
      // Unlike Jellyfin, you can only 'heart' songs in Volumio.
      // Note that adding items through 'Add to Playlist -> Favorites' is not the same as clicking the 'heart' icon - it goes through
      // Volumio's `playlistManager.addToPlaylist()` instead, and that method does not support custom plugin implementations.
      try {
        const setFavoriteResult = await SongHelper.setFavoriteByUri(uri, favorite, this.#connectionManager);
        if (setFavoriteResult.favorite) {
          jellyfin.getLogger().info(`[jellyfin] Marked favorite on server: ${setFavoriteResult.canonicalUri}`);
        }
        else {
          jellyfin.getLogger().info(`[jellyfin] Unmarked favorite on server: ${setFavoriteResult.canonicalUri}`);
        }

        const canonicalUri = setFavoriteResult.canonicalUri;

        // If removing from favorites (which, btw, you can only do in Favourites or player view when song is playing), Volumio will also
        // Call its own implementation. But if adding to favorites, then we need to do it ourselves (subject to `markFavoriteTarget` setting).
        if (favorite && jellyfin.getConfigValue('markFavoriteTarget') === 'all') {
          // Add to Volumio 'Favorites' playlist
          const playlistManager = jellyfin.getPlaylistManager();
          // Do better than Volumio's implementation by checking if song already added
          const favouritesPage = await kewToJSPromise(playlistManager.listFavourites()) as RenderedPage;
          const alreadyAdded = favouritesPage.navigation?.lists?.[0]?.items.some((item) => item.uri === canonicalUri);
          if (!alreadyAdded) {
            jellyfin.getLogger().info(`[jellyfin] Adding song to Volumio favorites: ${canonicalUri}`);
            await kewToJSPromise(playlistManager.commonAddToPlaylist(
              playlistManager.favouritesPlaylistFolder, 'favourites', 'jellyfin', canonicalUri));
          }
          else {
            jellyfin.getLogger().info(`[jellyfin] Volumio favorites already contains entry with song URI: ${canonicalUri}`);
          }
        }

        /**
         * ONLY return `{...favourite: boolean}` if current playing track points to the same (un)favorited song, otherwise
         * Volumio UI will blindly update the heart icon in the player view even if it is playing a different track*.
         * * This only works when `markFavoriteTarget` is `serverOnly' and a song is being favorited.  See:
         * 1. `checkFavourites()` in `playlistManager.commonAddToPlaylist()`; and
         * 2. `playlistManager.removeFromFavourites()`
         */
        if (jellyfin.getStateMachine().getState().uri === canonicalUri) {
          // Return full response in the hope that one day Volumio UI will actually compare the uri with the one currently played
          // Before refreshing the heart icon in player view.
          return {
            service: 'jellyfin',
            uri: canonicalUri || '',
            favourite: setFavoriteResult.favorite
          };
        }

        return undefined;
      }
      catch (error: any) {
        if (favorite) {
          jellyfin.getLogger().error('Failed to add song to favorites: ', error);
          jellyfin.toast('error', `Failed to add song to favorites: ${error.message}`);
        }
        else {
          jellyfin.getLogger().error('Failed to remove song from favorites: ', error);
          jellyfin.toast('error', `Failed to remove song from favorites: ${error.message}`);
        }
        return { success: false };
      }
    })());
  }

  getNowPlayingMetadataProvider() {
    return this.#nowPlayingMetadataProvider;
  }
}

export = ControllerJellyfin;
