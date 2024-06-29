"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _ControllerJellyfin_instances, _ControllerJellyfin_context, _ControllerJellyfin_config, _ControllerJellyfin_commandRouter, _ControllerJellyfin_serverPoller, _ControllerJellyfin_connectionManager, _ControllerJellyfin_browseController, _ControllerJellyfin_searchController, _ControllerJellyfin_playController, _ControllerJellyfin_nowPlayingMetadataProvider, _ControllerJellyfin_addToBrowseSources, _ControllerJellyfin_setSongFavorite;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const kew_1 = __importDefault(require("kew"));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const v_conf_1 = __importDefault(require("v-conf"));
const JellyfinContext_1 = __importDefault(require("./lib/JellyfinContext"));
const ServerPoller_1 = __importDefault(require("./lib/connection/ServerPoller"));
const sdk_1 = require("@jellyfin/sdk");
const package_json_1 = __importDefault(require("../package.json"));
const browse_1 = __importDefault(require("./lib/controller/browse"));
const ConnectionManager_1 = __importDefault(require("./lib/connection/ConnectionManager"));
const SearchController_1 = __importDefault(require("./lib/controller/search/SearchController"));
const PlayController_1 = __importDefault(require("./lib/controller/play/PlayController"));
const util_1 = require("./lib/util");
const ServerHelper_1 = __importDefault(require("./lib/util/ServerHelper"));
const ViewHelper_1 = __importDefault(require("./lib/controller/browse/view-handlers/ViewHelper"));
const SongHelper_1 = __importDefault(require("./lib/util/SongHelper"));
const JellyfinNowPlayingMetadataProvider_1 = __importDefault(require("./lib/util/JellyfinNowPlayingMetadataProvider"));
class ControllerJellyfin {
    constructor(context) {
        _ControllerJellyfin_instances.add(this);
        _ControllerJellyfin_context.set(this, void 0);
        _ControllerJellyfin_config.set(this, void 0);
        _ControllerJellyfin_commandRouter.set(this, void 0);
        _ControllerJellyfin_serverPoller.set(this, void 0);
        _ControllerJellyfin_connectionManager.set(this, void 0);
        _ControllerJellyfin_browseController.set(this, void 0);
        _ControllerJellyfin_searchController.set(this, void 0);
        _ControllerJellyfin_playController.set(this, void 0);
        _ControllerJellyfin_nowPlayingMetadataProvider.set(this, void 0);
        __classPrivateFieldSet(this, _ControllerJellyfin_context, context, "f");
        __classPrivateFieldSet(this, _ControllerJellyfin_commandRouter, context.coreCommand, "f");
    }
    getUIConfig() {
        const defer = kew_1.default.defer();
        const lang_code = __classPrivateFieldGet(this, _ControllerJellyfin_commandRouter, "f").sharedVars.get('language_code');
        const configPrepTasks = [
            __classPrivateFieldGet(this, _ControllerJellyfin_commandRouter, "f").i18nJson(`${__dirname}/i18n/strings_${lang_code}.json`, `${__dirname}/i18n/strings_en.json`, `${__dirname}/UIConfig.json`)
        ];
        kew_1.default.all(configPrepTasks).then((configParams) => {
            const [uiconf] = configParams;
            const removeServerUIConf = uiconf.sections[1];
            const browseSettingsUIConf = uiconf.sections[2];
            const playAddUIConf = uiconf.sections[3];
            const searchSettingsUIConf = uiconf.sections[4];
            const myMediaLibraryUIConf = uiconf.sections[5];
            // Remove Server section
            const servers = ServerHelper_1.default.getServersFromConfig();
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
            const itemsPerPage = JellyfinContext_1.default.getConfigValue('itemsPerPage');
            const showAllAlbumTracks = JellyfinContext_1.default.getConfigValue('showAllAlbumTracks');
            const showAllPlaylistTracks = JellyfinContext_1.default.getConfigValue('showAllPlaylistTracks');
            const rememberFilters = JellyfinContext_1.default.getConfigValue('rememberFilters');
            const markFavoriteTarget = JellyfinContext_1.default.getConfigValue('markFavoriteTarget');
            const markFavoriteTargetOptions = browseSettingsUIConf.content[4].options;
            browseSettingsUIConf.content[0].value = itemsPerPage;
            browseSettingsUIConf.content[1].value = showAllAlbumTracks;
            browseSettingsUIConf.content[2].value = showAllPlaylistTracks;
            browseSettingsUIConf.content[3].value = rememberFilters;
            browseSettingsUIConf.content[4].value = markFavoriteTargetOptions.find((option) => option.value === markFavoriteTarget);
            // Play / Add to Queue section
            const maxTracks = JellyfinContext_1.default.getConfigValue('maxTracks');
            const noMaxTracksSingleAlbum = JellyfinContext_1.default.getConfigValue('noMaxTracksSingleAlbum');
            const noMaxTracksSinglePlaylist = JellyfinContext_1.default.getConfigValue('noMaxTracksSinglePlaylist');
            const gaplessPlayback = JellyfinContext_1.default.getConfigValue('gaplessPlayback');
            playAddUIConf.content[0].value = maxTracks;
            playAddUIConf.content[1].value = noMaxTracksSingleAlbum;
            playAddUIConf.content[2].value = noMaxTracksSinglePlaylist;
            playAddUIConf.content[3].value = gaplessPlayback;
            // Search Settings section
            const searchAlbums = JellyfinContext_1.default.getConfigValue('searchAlbums');
            const searchAlbumsResultCount = JellyfinContext_1.default.getConfigValue('searchAlbumsResultCount');
            const searchArtists = JellyfinContext_1.default.getConfigValue('searchArtists');
            const searchArtistsResultCount = JellyfinContext_1.default.getConfigValue('searchArtistsResultCount');
            const searchSongs = JellyfinContext_1.default.getConfigValue('searchSongs');
            const searchSongsResultCount = JellyfinContext_1.default.getConfigValue('searchSongsResultCount');
            searchSettingsUIConf.content[0].value = searchAlbums;
            searchSettingsUIConf.content[1].value = searchAlbumsResultCount;
            searchSettingsUIConf.content[2].value = searchArtists;
            searchSettingsUIConf.content[3].value = searchArtistsResultCount;
            searchSettingsUIConf.content[4].value = searchSongs;
            searchSettingsUIConf.content[5].value = searchSongsResultCount;
            // My Media / Library
            const showLatestMusicSection = JellyfinContext_1.default.getConfigValue('showLatestMusicSection');
            const latestMusicSectionItems = JellyfinContext_1.default.getConfigValue('latestMusicSectionItems');
            const showRecentlyPlayedSection = JellyfinContext_1.default.getConfigValue('showRecentlyPlayedSection');
            const recentlyPlayedSectionItems = JellyfinContext_1.default.getConfigValue('recentlyPlayedSectionItems');
            const showFrequentlyPlayedSection = JellyfinContext_1.default.getConfigValue('showFrequentlyPlayedSection');
            const frequentlyPlayedSectionItems = JellyfinContext_1.default.getConfigValue('frequentlyPlayedSectionItems');
            const showFavoriteArtistsSection = JellyfinContext_1.default.getConfigValue('showFavoriteArtistsSection');
            const favoriteArtistsSectionItems = JellyfinContext_1.default.getConfigValue('favoriteArtistsSectionItems');
            const showFavoriteAlbumsSection = JellyfinContext_1.default.getConfigValue('showFavoriteAlbumsSection');
            const favoriteAlbumsSectionItems = JellyfinContext_1.default.getConfigValue('favoriteAlbumsSectionItems');
            const showFavoriteSongsSection = JellyfinContext_1.default.getConfigValue('showFavoriteSongsSection');
            const favoriteSongsSectionItems = JellyfinContext_1.default.getConfigValue('favoriteSongsSectionItems');
            const collectionInSectionItems = JellyfinContext_1.default.getConfigValue('collectionInSectionItems');
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
            .fail((error) => {
            JellyfinContext_1.default.getLogger().error(`[jellyfin] getUIConfig(): Cannot populate Jellyfin configuration - ${error}`);
            defer.reject(new Error());
        });
        return defer.promise;
    }
    refreshUIConfig() {
        __classPrivateFieldGet(this, _ControllerJellyfin_commandRouter, "f").getUIConfigOnPlugin('music_service', 'jellyfin', {}).then((config) => {
            __classPrivateFieldGet(this, _ControllerJellyfin_commandRouter, "f").broadcastMessage('pushUiConfig', config);
        });
    }
    configAddServer(data) {
        const host = data['host']?.trim() || '';
        if (host === '') {
            JellyfinContext_1.default.toast('error', JellyfinContext_1.default.getI18n('JELLYFIN_SPECIFY_HOST'));
            return;
        }
        let url;
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            url = (new URL(host)).toString();
        }
        catch (error) {
            JellyfinContext_1.default.toast('error', JellyfinContext_1.default.getI18n('JELLYFIN_INVALID_HOST'));
            return;
        }
        const username = data['username']?.trim() || '';
        const password = data['password'] || '';
        if (username === '') {
            JellyfinContext_1.default.toast('error', JellyfinContext_1.default.getI18n('JELLYFIN_SPECIFY_USERNAME'));
            return;
        }
        if (ServerHelper_1.default.hasServerConfig(username, host)) {
            JellyfinContext_1.default.toast('error', JellyfinContext_1.default.getI18n('JELLYFIN_SERVER_CONF_EXISTS', username, host));
            return;
        }
        const servers = ServerHelper_1.default.getServersFromConfig();
        servers.push({
            url: host,
            username: username,
            password: password
        });
        JellyfinContext_1.default.setConfigValue('servers', servers);
        JellyfinContext_1.default.toast('success', JellyfinContext_1.default.getI18n('JELLYFIN_SERVER_ADDED'));
        __classPrivateFieldGet(this, _ControllerJellyfin_serverPoller, "f")?.addTarget(host);
        this.refreshUIConfig();
    }
    async configRemoveServer(data) {
        const index = data['server_entry'].value;
        if (index !== '') {
            const servers = ServerHelper_1.default.getServersFromConfig();
            const removed = servers.splice(index, 1)[0];
            JellyfinContext_1.default.setConfigValue('servers', servers);
            JellyfinContext_1.default.toast('success', JellyfinContext_1.default.getI18n('JELLYFIN_SERVER_REMOVED'));
            const removedServer = __classPrivateFieldGet(this, _ControllerJellyfin_serverPoller, "f")?.findOnlineServer(removed.url);
            if (removedServer) {
                const connection = __classPrivateFieldGet(this, _ControllerJellyfin_connectionManager, "f")?.findConnection(removedServer, removed.username, true);
                if (connection) {
                    await __classPrivateFieldGet(this, _ControllerJellyfin_connectionManager, "f")?.logout(connection);
                }
                const hasOtherServerWithSameUrl = !!servers.find((server) => removedServer.connectionUrl === ServerHelper_1.default.getConnectionUrl(server.url));
                if (!hasOtherServerWithSameUrl) {
                    __classPrivateFieldGet(this, _ControllerJellyfin_serverPoller, "f")?.removeTarget(removedServer.url);
                }
            }
            this.refreshUIConfig();
        }
    }
    configSaveBrowseSettings(data) {
        const showKeys = [
            'showAllAlbumTracks',
            'showAllPlaylistTracks',
            'rememberFilters'
        ];
        showKeys.forEach((key) => {
            JellyfinContext_1.default.setConfigValue(key, data[key]);
        });
        JellyfinContext_1.default.setConfigValue('markFavoriteTarget', data['markFavoriteTarget'].value);
        const itemsPerPage = parseInt(data.itemsPerPage, 10);
        if (itemsPerPage) {
            JellyfinContext_1.default.setConfigValue('itemsPerPage', itemsPerPage);
            JellyfinContext_1.default.toast('success', JellyfinContext_1.default.getI18n('JELLYFIN_SETTINGS_SAVED'));
        }
        else {
            JellyfinContext_1.default.toast('error', JellyfinContext_1.default.getI18n('JELLYFIN_SETTINGS_ERR_ITEMS_PER_PAGE'));
        }
    }
    configSavePlayAddSettings(data) {
        const noMaxTrackKeys = [
            'noMaxTracksSingleAlbum',
            'noMaxTracksSinglePlaylist',
            'gaplessPlayback'
        ];
        noMaxTrackKeys.forEach((key) => {
            JellyfinContext_1.default.setConfigValue(key, data[key]);
        });
        const maxTracks = parseInt(data.maxTracks, 10);
        if (maxTracks) {
            JellyfinContext_1.default.setConfigValue('maxTracks', maxTracks);
            JellyfinContext_1.default.toast('success', JellyfinContext_1.default.getI18n('JELLYFIN_SETTINGS_SAVED'));
        }
        else {
            JellyfinContext_1.default.toast('error', JellyfinContext_1.default.getI18n('JELLYFIN_SETTINGS_ERR_MAX_TRACK'));
        }
    }
    configSaveSearchSettings(data) {
        const searchKeys = [
            'searchAlbums',
            'searchArtists',
            'searchSongs'
        ];
        searchKeys.forEach((key) => {
            JellyfinContext_1.default.setConfigValue(key, data[key]);
        });
        const resultCountKeys = [
            'searchAlbumsResultCount',
            'searchArtistsResultCount',
            'searchSongsResultCount'
        ];
        let hasInvalidResultCountValue = false;
        resultCountKeys.forEach((key) => {
            const value = parseInt(data[key], 10);
            if (value) {
                JellyfinContext_1.default.setConfigValue(key, value);
            }
            else {
                hasInvalidResultCountValue = true;
            }
        });
        if (hasInvalidResultCountValue) {
            JellyfinContext_1.default.toast('error', JellyfinContext_1.default.getI18n('JELLYFIN_SETTINGS_ERR_RESULT_COUNT'));
        }
        else {
            JellyfinContext_1.default.toast('success', JellyfinContext_1.default.getI18n('JELLYFIN_SETTINGS_SAVED'));
        }
    }
    configSaveMyMediaLibrarySettings(data) {
        const showKeys = [
            'showLatestMusicSection',
            'showRecentlyPlayedSection',
            'showFrequentlyPlayedSection',
            'showFavoriteArtistsSection',
            'showFavoriteAlbumsSection',
            'showFavoriteSongsSection'
        ];
        showKeys.forEach((key) => {
            JellyfinContext_1.default.setConfigValue(key, data[key]);
        });
        const itemsKeys = [
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
                JellyfinContext_1.default.setConfigValue(key, value);
            }
            else {
                hasInvalidItemsValue = true;
            }
        });
        if (hasInvalidItemsValue) {
            JellyfinContext_1.default.toast('error', JellyfinContext_1.default.getI18n('JELLYFIN_SETTINGS_ERR_NUM_ITEMS'));
        }
        else {
            JellyfinContext_1.default.toast('success', JellyfinContext_1.default.getI18n('JELLYFIN_SETTINGS_SAVED'));
        }
    }
    onVolumioStart() {
        const configFile = __classPrivateFieldGet(this, _ControllerJellyfin_commandRouter, "f").pluginManager.getConfigurationFile(__classPrivateFieldGet(this, _ControllerJellyfin_context, "f"), 'config.json');
        __classPrivateFieldSet(this, _ControllerJellyfin_config, new v_conf_1.default(), "f");
        __classPrivateFieldGet(this, _ControllerJellyfin_config, "f").loadFile(configFile);
        return kew_1.default.resolve();
    }
    onStart() {
        JellyfinContext_1.default.init(__classPrivateFieldGet(this, _ControllerJellyfin_context, "f"), __classPrivateFieldGet(this, _ControllerJellyfin_config, "f"));
        // Initialize Jellyfin SDK
        const deviceInfo = JellyfinContext_1.default.getDeviceInfo();
        const sdkInitInfo = {
            clientInfo: {
                name: 'Jellyfin plugin for Volumio',
                version: package_json_1.default.version
            },
            deviceInfo: {
                name: deviceInfo.name,
                id: deviceInfo.id
            }
        };
        const sdk = new sdk_1.Jellyfin(sdkInitInfo);
        __classPrivateFieldSet(this, _ControllerJellyfin_serverPoller, new ServerPoller_1.default(sdk), "f");
        const pollListener = () => {
            JellyfinContext_1.default.set('onlineServers', __classPrivateFieldGet(this, _ControllerJellyfin_serverPoller, "f")?.getOnlineServers());
        };
        __classPrivateFieldGet(this, _ControllerJellyfin_serverPoller, "f").on('serverOnline', pollListener.bind(this));
        __classPrivateFieldGet(this, _ControllerJellyfin_serverPoller, "f").on('serverLost', pollListener.bind(this));
        const servers = ServerHelper_1.default.getServersFromConfig();
        __classPrivateFieldGet(this, _ControllerJellyfin_serverPoller, "f").addTarget(servers.reduce((urls, s) => {
            urls.push(s.url);
            return urls;
        }, []));
        __classPrivateFieldSet(this, _ControllerJellyfin_connectionManager, new ConnectionManager_1.default(sdkInitInfo), "f");
        __classPrivateFieldSet(this, _ControllerJellyfin_browseController, new browse_1.default(__classPrivateFieldGet(this, _ControllerJellyfin_connectionManager, "f")), "f");
        __classPrivateFieldSet(this, _ControllerJellyfin_searchController, new SearchController_1.default(__classPrivateFieldGet(this, _ControllerJellyfin_connectionManager, "f")), "f");
        __classPrivateFieldSet(this, _ControllerJellyfin_playController, new PlayController_1.default(__classPrivateFieldGet(this, _ControllerJellyfin_connectionManager, "f")), "f");
        __classPrivateFieldSet(this, _ControllerJellyfin_nowPlayingMetadataProvider, new JellyfinNowPlayingMetadataProvider_1.default(__classPrivateFieldGet(this, _ControllerJellyfin_connectionManager, "f")), "f");
        __classPrivateFieldGet(this, _ControllerJellyfin_instances, "m", _ControllerJellyfin_addToBrowseSources).call(this);
        JellyfinContext_1.default.getLogger().info('[jellyfin] Initialized plugin with device info: ', deviceInfo);
        return kew_1.default.resolve();
    }
    onStop() {
        const defer = kew_1.default.defer();
        __classPrivateFieldGet(this, _ControllerJellyfin_serverPoller, "f")?.removeAllListeners();
        __classPrivateFieldGet(this, _ControllerJellyfin_serverPoller, "f")?.clearTargets();
        __classPrivateFieldSet(this, _ControllerJellyfin_serverPoller, null, "f");
        __classPrivateFieldGet(this, _ControllerJellyfin_commandRouter, "f").volumioRemoveToBrowseSources('Jellyfin');
        __classPrivateFieldSet(this, _ControllerJellyfin_browseController, null, "f");
        __classPrivateFieldSet(this, _ControllerJellyfin_searchController, null, "f");
        __classPrivateFieldGet(this, _ControllerJellyfin_playController, "f")?.dispose();
        __classPrivateFieldSet(this, _ControllerJellyfin_playController, null, "f");
        __classPrivateFieldSet(this, _ControllerJellyfin_nowPlayingMetadataProvider, null, "f");
        if (__classPrivateFieldGet(this, _ControllerJellyfin_connectionManager, "f")) {
            __classPrivateFieldGet(this, _ControllerJellyfin_connectionManager, "f")?.logoutAll().then(() => {
                JellyfinContext_1.default.reset();
                defer.resolve();
            });
        }
        else {
            defer.resolve();
        }
        return defer.promise;
    }
    getConfigurationFiles() {
        return ['config.json'];
    }
    handleBrowseUri(uri) {
        if (__classPrivateFieldGet(this, _ControllerJellyfin_browseController, "f")) {
            return (0, util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerJellyfin_browseController, "f").browseUri(uri));
        }
        return kew_1.default.reject('Jellyfin plugin is not started');
    }
    explodeUri(uri) {
        if (__classPrivateFieldGet(this, _ControllerJellyfin_browseController, "f")) {
            return (0, util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerJellyfin_browseController, "f").explodeUri(uri));
        }
        return kew_1.default.reject('Jellyfin plugin is not started');
    }
    clearAddPlayTrack(track) {
        return __classPrivateFieldGet(this, _ControllerJellyfin_playController, "f")?.clearAddPlayTrack(track);
    }
    stop() {
        return __classPrivateFieldGet(this, _ControllerJellyfin_playController, "f")?.stop();
    }
    pause() {
        return __classPrivateFieldGet(this, _ControllerJellyfin_playController, "f")?.pause();
    }
    resume() {
        return __classPrivateFieldGet(this, _ControllerJellyfin_playController, "f")?.resume();
    }
    seek(position) {
        return __classPrivateFieldGet(this, _ControllerJellyfin_playController, "f")?.seek(position);
    }
    next() {
        return __classPrivateFieldGet(this, _ControllerJellyfin_playController, "f")?.next();
    }
    previous() {
        return __classPrivateFieldGet(this, _ControllerJellyfin_playController, "f")?.previous();
    }
    prefetch(track) {
        if (!__classPrivateFieldGet(this, _ControllerJellyfin_playController, "f")) {
            return kew_1.default.reject('Jellyfin plugin is not started');
        }
        return (0, util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerJellyfin_playController, "f").prefetch(track));
    }
    search(query) {
        if (__classPrivateFieldGet(this, _ControllerJellyfin_searchController, "f")) {
            return (0, util_1.jsPromiseToKew)(__classPrivateFieldGet(this, _ControllerJellyfin_searchController, "f").search(query));
        }
        return kew_1.default.reject('Jellyfin plugin is not started');
    }
    goto(data) {
        return (0, util_1.jsPromiseToKew)((async () => {
            if (!__classPrivateFieldGet(this, _ControllerJellyfin_playController, "f") || !__classPrivateFieldGet(this, _ControllerJellyfin_browseController, "f")) {
                throw Error('Jellyfin plugin is not started');
            }
            try {
                const { song, connection } = await __classPrivateFieldGet(this, _ControllerJellyfin_playController, "f").getSongFromTrack(data);
                if (data.type === 'album') {
                    if (song.album?.id) {
                        const songView = {
                            name: 'songs',
                            albumId: song.album.id
                        };
                        return __classPrivateFieldGet(this, _ControllerJellyfin_browseController, "f").browseUri(`jellyfin/${connection.id}/${ViewHelper_1.default.constructUriSegmentFromView(songView)}`);
                    }
                    throw Error('Song is missing album info');
                }
                else if (data.type === 'artist') {
                    if (song.artists?.[0]?.id) {
                        const albumView = {
                            name: 'albums',
                            artistId: song.artists[0].id
                        };
                        return __classPrivateFieldGet(this, _ControllerJellyfin_browseController, "f").browseUri(`jellyfin/${connection.id}/${ViewHelper_1.default.constructUriSegmentFromView(albumView)}`);
                    }
                    throw Error('Song is missing artist info');
                }
                else {
                    throw Error(`Invalid type '${data.type}'`);
                }
            }
            catch (error) {
                throw Error(`Failed to fetch requested info: ${error.message}`);
            }
        })());
    }
    addToFavourites(data) {
        return __classPrivateFieldGet(this, _ControllerJellyfin_instances, "m", _ControllerJellyfin_setSongFavorite).call(this, data.uri, true);
    }
    removeFromFavourites(data) {
        return __classPrivateFieldGet(this, _ControllerJellyfin_instances, "m", _ControllerJellyfin_setSongFavorite).call(this, data.uri, false);
    }
    getNowPlayingMetadataProvider() {
        return __classPrivateFieldGet(this, _ControllerJellyfin_nowPlayingMetadataProvider, "f");
    }
}
_ControllerJellyfin_context = new WeakMap(), _ControllerJellyfin_config = new WeakMap(), _ControllerJellyfin_commandRouter = new WeakMap(), _ControllerJellyfin_serverPoller = new WeakMap(), _ControllerJellyfin_connectionManager = new WeakMap(), _ControllerJellyfin_browseController = new WeakMap(), _ControllerJellyfin_searchController = new WeakMap(), _ControllerJellyfin_playController = new WeakMap(), _ControllerJellyfin_nowPlayingMetadataProvider = new WeakMap(), _ControllerJellyfin_instances = new WeakSet(), _ControllerJellyfin_addToBrowseSources = function _ControllerJellyfin_addToBrowseSources() {
    const data = {
        name: 'Jellyfin',
        uri: 'jellyfin',
        plugin_type: 'music_service',
        plugin_name: 'jellyfin',
        albumart: '/albumart?sourceicon=music_service/jellyfin/dist/assets/images/jellyfin-mono.png'
    };
    __classPrivateFieldGet(this, _ControllerJellyfin_commandRouter, "f").volumioAddToBrowseSources(data);
}, _ControllerJellyfin_setSongFavorite = function _ControllerJellyfin_setSongFavorite(uri, favorite) {
    return (0, util_1.jsPromiseToKew)((async () => {
        if (!__classPrivateFieldGet(this, _ControllerJellyfin_connectionManager, "f")) {
            throw Error('Jellyfin plugin is not started');
        }
        // Unlike Jellyfin, you can only 'heart' songs in Volumio.
        // Note that adding items through 'Add to Playlist -> Favorites' is not the same as clicking the 'heart' icon - it goes through
        // Volumio's `playlistManager.addToPlaylist()` instead, and that method does not support custom plugin implementations.
        try {
            const setFavoriteResult = await SongHelper_1.default.setFavoriteByUri(uri, favorite, __classPrivateFieldGet(this, _ControllerJellyfin_connectionManager, "f"));
            if (setFavoriteResult.favorite) {
                JellyfinContext_1.default.getLogger().info(`[jellyfin] Marked favorite on server: ${setFavoriteResult.canonicalUri}`);
            }
            else {
                JellyfinContext_1.default.getLogger().info(`[jellyfin] Unmarked favorite on server: ${setFavoriteResult.canonicalUri}`);
            }
            const canonicalUri = setFavoriteResult.canonicalUri;
            // If removing from favorites (which, btw, you can only do in Favourites or player view when song is playing), Volumio will also
            // Call its own implementation. But if adding to favorites, then we need to do it ourselves (subject to `markFavoriteTarget` setting).
            if (favorite && JellyfinContext_1.default.getConfigValue('markFavoriteTarget') === 'all') {
                // Add to Volumio 'Favorites' playlist
                const playlistManager = JellyfinContext_1.default.getPlaylistManager();
                // Do better than Volumio's implementation by checking if song already added
                const favouritesPage = await (0, util_1.kewToJSPromise)(playlistManager.listFavourites());
                const alreadyAdded = favouritesPage.navigation?.lists?.[0]?.items.some((item) => item.uri === canonicalUri);
                if (!alreadyAdded) {
                    JellyfinContext_1.default.getLogger().info(`[jellyfin] Adding song to Volumio favorites: ${canonicalUri}`);
                    await (0, util_1.kewToJSPromise)(playlistManager.commonAddToPlaylist(playlistManager.favouritesPlaylistFolder, 'favourites', 'jellyfin', canonicalUri));
                }
                else {
                    JellyfinContext_1.default.getLogger().info(`[jellyfin] Volumio favorites already contains entry with song URI: ${canonicalUri}`);
                }
            }
            /**
             * ONLY return `{...favourite: boolean}` if current playing track points to the same (un)favorited song, otherwise
             * Volumio UI will blindly update the heart icon in the player view even if it is playing a different track*.
             * * This only works when `markFavoriteTarget` is `serverOnly' and a song is being favorited.  See:
             * 1. `checkFavourites()` in `playlistManager.commonAddToPlaylist()`; and
             * 2. `playlistManager.removeFromFavourites()`
             */
            if (JellyfinContext_1.default.getStateMachine().getState().uri === canonicalUri) {
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
        catch (error) {
            if (favorite) {
                JellyfinContext_1.default.getLogger().error('Failed to add song to favorites: ', error);
                JellyfinContext_1.default.toast('error', `Failed to add song to favorites: ${error.message}`);
            }
            else {
                JellyfinContext_1.default.getLogger().error('Failed to remove song from favorites: ', error);
                JellyfinContext_1.default.toast('error', `Failed to remove song from favorites: ${error.message}`);
            }
            return { success: false };
        }
    })());
};
module.exports = ControllerJellyfin;
//# sourceMappingURL=index.js.map