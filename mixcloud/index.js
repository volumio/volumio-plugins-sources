'use strict';

const path = require('path');
global.mixcloudPluginLibRoot = path.resolve(__dirname) + '/lib';

const libQ = require('kew');
const mixcloud = require(mixcloudPluginLibRoot + '/mixcloud');
const SearchController = require(mixcloudPluginLibRoot + '/controller/search');
const BrowseController = require(mixcloudPluginLibRoot + '/controller/browse');
const PlayController = require(mixcloudPluginLibRoot + '/controller/play');
const ViewHelper = require(mixcloudPluginLibRoot + '/helper/view');

module.exports = ControllerMixcloud;

function ControllerMixcloud(context) {
	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
    this.configManager = this.context.configManager;
}

ControllerMixcloud.prototype.getUIConfig = function() {
    let self = this;
    let defer = libQ.defer();

    let lang_code = self.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
        __dirname + '/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
    .then( uiconf => {
        let generalUIConf = uiconf.sections[0];
        let cacheUIConf = uiconf.sections[1];

        // General   
        generalUIConf.content[0].value = mixcloud.getConfigValue('itemsPerPage', 47);
        generalUIConf.content[1].value = mixcloud.getConfigValue('itemsPerSection', 11);

        // Cache
        let cacheMaxEntries = mixcloud.getConfigValue('cacheMaxEntries', 5000);
        let cacheTTL = mixcloud.getConfigValue('cacheTTL', 1800);
        let cacheEntryCount = mixcloud.getCache().getEntryCount();
        cacheUIConf.content[0].value = cacheMaxEntries;
        cacheUIConf.content[1].value = cacheTTL;
        cacheUIConf.description = cacheEntryCount > 0 ? mixcloud.getI18n('MIXCLOUD_CACHE_STATS', cacheEntryCount, Math.round(mixcloud.getCache().getMemoryUsageInKB()).toLocaleString()) : mixcloud.getI18n('MIXCLOUD_CACHE_EMPTY');

        defer.resolve(uiconf);
    })
    .fail( error => {
            mixcloud.getLogger().error('[mixcloud] getUIConfig(): Cannot populate Mixcloud configuration - ' + error);
            defer.reject(new Error());
        }
    );

    return defer.promise;
};

ControllerMixcloud.prototype.configSaveGeneralSettings = function(data) {
    let itemsPerPage = parseInt(data['itemsPerPage'], 10);
    let itemsPerSection = parseInt(data['itemsPerSection'], 10);
    if (!itemsPerPage) {
        mixcloud.toast('error', mixcloud.getI18n('MIXCLOUD_SETTINGS_ERR_ITEMS_PER_PAGE'));
        return;
    }
    if (!itemsPerSection) {
        mixcloud.toast('error', mixcloud.getI18n('MIXCLOUD_SETTINGS_ERR_ITEMS_PER_SECTION'));
        return;
    }

    this.config.set('itemsPerPage', itemsPerPage);
    this.config.set('itemsPerSection', itemsPerSection);
    
    mixcloud.toast('success', mixcloud.getI18n('MIXCLOUD_SETTINGS_SAVED'));   
}

ControllerMixcloud.prototype.configSaveCacheSettings = function(data) {
    let cacheMaxEntries = parseInt(data['cacheMaxEntries'], 10);
    let cacheTTL = parseInt(data['cacheTTL'], 10);
    if (cacheMaxEntries < 1000) {
        mixcloud.toast('error', mixcloud.getI18n('MIXCLOUD_SETTINGS_ERR_CACHE_MAX_ENTRIES'));
        return;
    }
    if (cacheTTL < 600) {
        mixcloud.toast('error', mixcloud.getI18n('MIXCLOUD_SETTINGS_ERR_CACHE_TTL'));
        return;
    }

    this.config.set('cacheMaxEntries', cacheMaxEntries);
    this.config.set('cacheTTL', cacheTTL);

    mixcloud.getCache().setMaxEntries(cacheMaxEntries);
    mixcloud.getCache().setTTL(cacheTTL);

    mixcloud.toast('success', mixcloud.getI18n('MIXCLOUD_SETTINGS_SAVED'));
    this.refreshUIConfig();
}

ControllerMixcloud.prototype.configClearCache = function() {
    mixcloud.getCache().clear();
    mixcloud.toast('success', mixcloud.getI18n('MIXCLOUD_CACHE_CLEARED'));
    this.refreshUIConfig();
}


ControllerMixcloud.prototype.refreshUIConfig = function() {
    let self = this;
    
    self.commandRouter.getUIConfigOnPlugin('music_service', 'mixcloud', {}).then( config => {
        self.commandRouter.broadcastMessage('pushUiConfig', config);
    });
}

ControllerMixcloud.prototype.onVolumioStart = function() {
	let configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
	this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);

    return libQ.resolve();
}

ControllerMixcloud.prototype.onStart = function() {
    mixcloud.init(this.context, this.config);

    this.browseController = new BrowseController();
    this.searchController = new SearchController();
    this.playController = new PlayController();

    this.addToBrowseSources();

    return libQ.resolve();
};

ControllerMixcloud.prototype.onStop = function() {
    this.commandRouter.volumioRemoveToBrowseSources('Mixcloud');

    this.browseController = null;
    this.searchController = null;
    this.playController = null;

    mixcloud.reset();

	return libQ.resolve();
};

ControllerMixcloud.prototype.getConfigurationFiles = function() {
    return ['config.json'];
}

ControllerMixcloud.prototype.addToBrowseSources = function () {
	let data = {
        name: 'Mixcloud',
        uri: 'mixcloud',
        plugin_type: 'music_service',
        plugin_name: 'mixcloud',
        albumart: '/albumart?sourceicon=music_service/mixcloud/assets/images/mixcloud.png'
    };
	this.commandRouter.volumioAddToBrowseSources(data);
};

ControllerMixcloud.prototype.handleBrowseUri = function(uri) {
    return this.browseController.browseUri(uri);
}

ControllerMixcloud.prototype.explodeUri = function (uri) {
    return this.browseController.explodeUri(uri);
};

ControllerMixcloud.prototype.clearAddPlayTrack = function(track) {  
    return this.playController.clearAddPlayTrack(track);
}

ControllerMixcloud.prototype.stop = function () {
    return this.playController.stop();
};

ControllerMixcloud.prototype.pause = function () {
    return this.playController.pause();
};
  
ControllerMixcloud.prototype.resume = function () {
    return this.playController.resume();
}

ControllerMixcloud.prototype.next = function () {
    return this.playController.next();
}

ControllerMixcloud.prototype.previous = function () {
    return this.playController.previous();
}
  
ControllerMixcloud.prototype.seek = function (position) {
    return this.playController.seek(position);
}

ControllerMixcloud.prototype.goto = function(data) {
    let views = ViewHelper.getViewsFromUri(data.uri);
    let trackView = views.pop();
    if (!trackView && trackView.name !== 'cloudcast') {
        return this.browseController.browseUri('mixcloud');
    }
    if (data.type === 'artist' && trackView.owner) {
        return this.browseController.browseUri('mixcloud/user@username=' + decodeURIComponent(trackView.owner));
    }
    else {
        return this.browseController.browseUri('mixcloud');
    }
}
ControllerMixcloud.prototype.search = function(query) {
    return this.searchController.search(query);
}
