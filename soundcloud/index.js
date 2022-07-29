'use strict';

const path = require('path');
global.scPluginLibRoot = path.resolve(__dirname) + '/lib';

const libQ = require('kew');
const sc = require(scPluginLibRoot + '/soundcloud');
const BrowseController = require(scPluginLibRoot + '/controller/browse');
const SearchController = require(scPluginLibRoot + '/controller/search');
const PlayController = require(scPluginLibRoot + '/controller/play');

module.exports = ControllerSoundCloud;

function ControllerSoundCloud(context) {
	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
    this.configManager = this.context.configManager;
}

ControllerSoundCloud.prototype.getUIConfig = function() {
    let self = this;
    let defer = libQ.defer();

    let lang_code = self.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
        __dirname + '/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
    .then( (uiconf) => {
        let generalUIConf = uiconf.sections[0];
        let cacheUIConf = uiconf.sections[1];

        // General   
        let localeOptions = self.configGetLocaleOptions();
        generalUIConf.content[0].value = localeOptions.selected;
        generalUIConf.content[0].options = localeOptions.options;    
        generalUIConf.content[1].value = sc.getConfigValue('itemsPerPage', 47);
        generalUIConf.content[2].value = sc.getConfigValue('itemsPerSection', 11);
        generalUIConf.content[3].value = sc.getConfigValue('combinedSearchResults', 11);
        generalUIConf.content[4].value = sc.getConfigValue('loadFullPlaylistAlbum', false);
        generalUIConf.content[5].value = sc.getConfigValue('skipPreviewTracks', false);

        // Cache
        let cacheMaxEntries = sc.getConfigValue('cacheMaxEntries', 5000);
        let cacheTTL = sc.getConfigValue('cacheTTL', 1800);
        let cacheEntryCount = sc.getCache().getEntryCount();
        cacheUIConf.content[0].value = cacheMaxEntries;
        cacheUIConf.content[1].value = cacheTTL;
        cacheUIConf.description = cacheEntryCount > 0 ? sc.getI18n('SOUNDCLOUD_CACHE_STATS', cacheEntryCount, Math.round(sc.getCache().getMemoryUsageInKB()).toLocaleString()) : sc.getI18n('SOUNDCLOUD_CACHE_EMPTY');

        defer.resolve(uiconf);
    })
    .fail( (error) => {
            sc.getLogger().error('[soundcloud] getUIConfig(): Cannot populate SoundCloud configuration - ' + error);
            defer.reject(new Error());
        }
    );

    return defer.promise;
};

ControllerSoundCloud.prototype.configSaveGeneralSettings = function(data) {
    let itemsPerPage = parseInt(data['itemsPerPage'], 10);
    let itemsPerSection = parseInt(data['itemsPerSection'], 10);
    let combinedSearchResults = parseInt(data['combinedSearchResults'], 10);
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

    this.config.set('locale', data['locale'].value);
    this.config.set('itemsPerPage', itemsPerPage);
    this.config.set('itemsPerSection', itemsPerSection);
    this.config.set('combinedSearchResults', combinedSearchResults);
    this.config.set('loadFullPlaylistAlbum', data['loadFullPlaylistAlbum']);
    this.config.set('skipPreviewTracks', data['skipPreviewTracks']);
    
    sc.toast('success', sc.getI18n('SOUNDCLOUD_SETTINGS_SAVED'));   
}

ControllerSoundCloud.prototype.configSaveCacheSettings = function(data) {
    let cacheMaxEntries = parseInt(data['cacheMaxEntries'], 10);
    let cacheTTL = parseInt(data['cacheTTL'], 10);
    if (cacheMaxEntries < 1000) {
        sc.toast('error', sc.getI18n('SOUNDCLOUD_SETTINGS_ERR_CACHE_MAX_ENTRIES'));
        return;
    }
    if (cacheTTL < 600) {
        sc.toast('error', sc.getI18n('SOUNDCLOUD_SETTINGS_ERR_CACHE_TTL'));
        return;
    }

    this.config.set('cacheMaxEntries', cacheMaxEntries);
    this.config.set('cacheTTL', cacheTTL);

    sc.getCache().setMaxEntries(cacheMaxEntries);
    sc.getCache().setTTL(cacheTTL);

    sc.toast('success', sc.getI18n('SOUNDCLOUD_SETTINGS_SAVED'));
    this.refreshUIConfig();
}

ControllerSoundCloud.prototype.configClearCache = function() {
    sc.getCache().clear();
    sc.toast('success', sc.getI18n('SOUNDCLOUD_CACHE_CLEARED'));
    this.refreshUIConfig();
}

ControllerSoundCloud.prototype.refreshUIConfig = function() {
    let self = this;
    self.commandRouter.getUIConfigOnPlugin('music_service', 'soundcloud', {}).then( (config) => {
        self.commandRouter.broadcastMessage('pushUiConfig', config);
    });
}

ControllerSoundCloud.prototype.configGetLocaleOptions = function() {
    if (!this.localeOptions) {
        let raw = require(scPluginLibRoot + '/../assets/locales.json');
        let options = [];
        raw.forEach( (item) => {
            options.push({
                value: item.locale,
                label: item.name
            });
        });
        this.localeOptions = options;
    }

    let configValue = sc.getConfigValue('locale', 'en');
    let selected = this.localeOptions.find( option => option.value === configValue );

    return {
        options: this.localeOptions,
        selected: selected
    };
}

ControllerSoundCloud.prototype.onVolumioStart = function() {
	let configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
	this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);

    return libQ.resolve();
}

ControllerSoundCloud.prototype.onStart = function() {
    let self = this;

    sc.init(self.context, self.config);
 
    self.browseController = new BrowseController();
    self.playController = new PlayController();
    self.searchController = new SearchController();

    self.addToBrowseSources();

    return libQ.resolve();
};

ControllerSoundCloud.prototype.onStop = function() {

    this.commandRouter.volumioRemoveToBrowseSources('SoundCloud');

    this.browseController = null;
    this.playController = null;
    this.searchController = null;

    sc.reset();

    return libQ.resolve();
};

ControllerSoundCloud.prototype.getConfigurationFiles = function() {
    return ['config.json'];
}

ControllerSoundCloud.prototype.addToBrowseSources = function () {
	let data = {
        name: 'SoundCloud',
        uri: 'soundcloud',
        plugin_type: 'music_service',
        plugin_name: 'soundcloud',
        albumart: '/albumart?sourceicon=music_service/soundcloud/assets/images/soundcloud.png'
    };
	this.commandRouter.volumioAddToBrowseSources(data);
};

ControllerSoundCloud.prototype.handleBrowseUri = function(uri) {
    return this.browseController.browseUri(uri);
}

ControllerSoundCloud.prototype.explodeUri = function (uri) {
    return this.browseController.explodeUri(uri);
};

ControllerSoundCloud.prototype.clearAddPlayTrack = function(track) {  
    return this.playController.clearAddPlayTrack(track);
}

ControllerSoundCloud.prototype.stop = function () {
    return this.playController.stop();
};

ControllerSoundCloud.prototype.pause = function () {
    return this.playController.pause();
};
  
ControllerSoundCloud.prototype.resume = function () {
    return this.playController.resume();
}
  
ControllerSoundCloud.prototype.seek = function (position) {
    return this.playController.seek(position);
}

ControllerSoundCloud.prototype.next = function () {
    return this.playController.next();
}

ControllerSoundCloud.prototype.previous = function () {
    return this.playController.previous();
}

ControllerSoundCloud.prototype.search = function(query) {
    return this.searchController.search(query);
}

ControllerSoundCloud.prototype.goto = function(data) {
    return this.browseController.goto(data);
}
