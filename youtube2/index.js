'use strict';

const path = require('path');
global.yt2PluginLibRoot = path.resolve(__dirname) + '/lib';

const libQ = require('kew');
const yt2 = require(yt2PluginLibRoot + '/youtube2');
const BrowseController = require(yt2PluginLibRoot + '/controller/browse');
const SearchController = require(yt2PluginLibRoot + '/controller/search');
const PlayController = require(yt2PluginLibRoot + '/controller/play');
const UIConfigHelper = require(yt2PluginLibRoot + '/helper/uiconfig');

module.exports = ControllerYouTube2;

function ControllerYouTube2(context) {
	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
    this.configManager = this.context.configManager;
}

ControllerYouTube2.prototype.getUIConfig = function() {
    let self = this;
    let defer = libQ.defer();

    let lang_code = self.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
        __dirname + '/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
    .then( (uiconf) => {
        let dataRetrievalUIConf= uiconf.sections[0];
        let gapiStatusUIConf = uiconf.sections[1];
        let navUIConf = uiconf.sections[2];
        let playbackUIConf = uiconf.sections[3];
        let cacheUIConf = uiconf.sections[4];
        let addFrontPageSectionUIConf = uiconf.sections[5];

        // Remove addFrontPageSectionUIConf (will add it back after all current
        // front page sections)
        uiconf.sections.splice(5, 1);

        // Data Retrieval section
        let method = yt2.getConfigValue('dataRetrievalMethod', 'scraping');
        let credentials = yt2.getConfigValue('gapiCredentials', {}, true);
        let clientId = credentials.clientId ? credentials.clientId : '';
        let clientSecret = credentials.clientSecret ? credentials.clientSecret : '';
        let languageOptions = UIConfigHelper.getLanguageOptions();
        let regionOptions = UIConfigHelper.getRegionOptions();
        dataRetrievalUIConf.content[0].value = {
            value: method,
            label: method === 'gapi' ? yt2.getI18n('YOUTUBE2_METHOD_GAPI') : yt2.getI18n('YOUTUBE2_METHOD_SCRAPING')
        }
        dataRetrievalUIConf.content[1].value = clientId;
        dataRetrievalUIConf.content[2].value = clientSecret;
        dataRetrievalUIConf.content[3].value = languageOptions.selected;
        dataRetrievalUIConf.content[3].options = languageOptions.options;
        dataRetrievalUIConf.content[4].value = regionOptions.selected;
        dataRetrievalUIConf.content[4].options = regionOptions.options;

        // Google YouTube API Client Status section
        let removeAccessUIConf = false;
        if (yt2.getConfigValue('dataRetrievalMethod', 'scraping') !== 'gapi') {
            removeAccessUIConf = true;
        }
        else if (self.accessStatus === yt2.ACCESS_STATUS_PROCESSING) {
            gapiStatusUIConf.description =  yt2.getI18n('YOUTUBE2_ACCESS_DESC_PROCESSING');
        }
        else if (self.accessStatus === yt2.ACCESS_STATUS_ERROR) {
            gapiStatusUIConf.description =  yt2.getI18n('YOUTUBE2_ACCESS_DESC_ERROR');
        }
        else if (self.accessStatus === yt2.ACCESS_STATUS_GRANTED) {
            gapiStatusUIConf.description =  yt2.getI18n('YOUTUBE2_ACCESS_DESC_GRANTED');
        }
        else if (self.accessStatus === yt2.ACCESS_STATUS_PENDING_GRANT) {
            gapiStatusUIConf.description =  yt2.getI18n('YOUTUBE2_ACCESS_DESC_GRANT');
            gapiStatusUIConf.content = [
                {
                    id: 'verificationUrl',
                    type: 'text',
                    element: 'input',
                    label: yt2.getI18n('YOUTUBE2_VERIFICATION_URL'),
                    value: self.accessStatusData.grantAccessPageInfo.verification_url
                },
                {
                    id:'openVerificationUrl',
                    element: 'button',
                    label: yt2.getI18n('YOUTUBE2_GO_TO_VERIFICATION_URL'),
                    onClick: {
                        type: 'openUrl',
                        url: self.accessStatusData.grantAccessPageInfo.verification_url
                    }
                },
                {
                    id: 'code',
                    type: 'text',
                    element: 'input',
                    label: yt2.getI18n('YOUTUBE2_CODE'),
                    value: self.accessStatusData.grantAccessPageInfo.user_code
                },
            ];
        }
        else {
            removeAccessUIConf = true;
        }

        // Navigation section
        let itemsPerPage = yt2.getConfigValue('itemsPerPage', 47);
        let combinedSearchResults = yt2.getConfigValue('combinedSearchResults', 11);
        navUIConf.content[0].value = itemsPerPage;
        navUIConf.content[1].value = combinedSearchResults;

        // Playback section
        let autoplay = yt2.getConfigValue('autoplay', false);
        playbackUIConf.content[0].value = autoplay;

        // Cache section
        let cacheMaxEntries = yt2.getConfigValue('cacheMaxEntries', 5000);
        let cacheTTL = yt2.getConfigValue('cacheTTL', 1800);
        let cacheEntryCount = yt2.getCache().getEntryCount();
        cacheUIConf.content[0].value = cacheMaxEntries;
        cacheUIConf.content[1].value = cacheTTL;
        cacheUIConf.description = cacheEntryCount > 0 ? yt2.getI18n('YOUTUBE2_CACHE_STATS', cacheEntryCount, Math.round(yt2.getCache().getMemoryUsageInKB()).toLocaleString()) : yt2.getI18n('YOUTUBE2_CACHE_EMPTY');

        // Remove Google YouTube API Client Status section?
        if (removeAccessUIConf) {
            uiconf.sections.splice(1, 1);
        }

        // Add current front page sections
        let frontPageSections = yt2.getConfigValue('frontPageSections', [], true);
        let uiconfFrontPageSections = UIConfigHelper.constructFrontPageSections(frontPageSections);
        uiconf.sections.push(...uiconfFrontPageSections);

        // Add addFrontPageSectionUIConf back
        uiconf.sections.push(addFrontPageSectionUIConf);

        defer.resolve(uiconf);
    })
    .fail( (error) => {
            yt2.getLogger().error('[youtube2] getUIConfig(): Cannot populate YouTube2 configuration - ' + error);
            defer.reject(new Error());
        }
    );

    return defer.promise;
};

ControllerYouTube2.prototype.configSaveDataRetrieval = function(data) {
    this.config.set('language', data['language'].value);
    this.config.set('region', data['region'].value);

    let oldMethod = this.config.get('dataRetrievalMethod', 'scraping');
    let newMethod = data['method'].value;
    if (newMethod === 'gapi') {
        if (data['clientId'] == undefined || data['clientId'].trim() === '') {
            yt2.toast('error', yt2.getI18n('YOUTUBE2_PROVIDE_CLIENT_ID'));
            return;
        }
        if (data['clientSecret'] == undefined || data['clientSecret'].trim() === '') {
            yt2.toast('error', yt2.getI18n('YOUTUBE2_PROVIDE_CLIENT_SECRET'));
            return;
        }
        let credentials = {
            clientId: data['clientId'],
            clientSecret: data['clientSecret']
        };
        this.config.set('gapiCredentials', JSON.stringify(credentials));
    }
    this.config.set('dataRetrievalMethod', newMethod);

    yt2.toast('success', yt2.getI18n('YOUTUBE2_SETTINGS_SAVED'));

    if (oldMethod !== newMethod) {
        this.refreshUIConfig(true);
    }
}

ControllerYouTube2.prototype.configSaveNav = function(data) {
    let itemsPerPage = parseInt(data['itemsPerPage'], 10);
    let combinedSearchResults = parseInt(data['combinedSearchResults'], 10);
    if (!itemsPerPage) {
        yt2.toast('error', yt2.getI18n('YOUTUBE2_SETTINGS_ERR_ITEMS_PER_PAGE'));
        return;
    }
    if (!combinedSearchResults) {
        yt2.toast('error', yt2.getI18n('YOUTUBE2_SETTINGS_ERR_COMBINED_SEARCH_RESULTS'));
        return;
    }

    this.config.set('itemsPerPage', itemsPerPage);
    this.config.set('combinedSearchResults', combinedSearchResults);
    yt2.toast('success', yt2.getI18n('YOUTUBE2_SETTINGS_SAVED'));   
}

ControllerYouTube2.prototype.configSavePlayback = function(data) {
    this.config.set('autoplay', data['autoplay']);
    yt2.toast('success', yt2.getI18n('YOUTUBE2_SETTINGS_SAVED'));
}

ControllerYouTube2.prototype.configSaveCacheSettings = function(data) {
    let cacheMaxEntries = parseInt(data['cacheMaxEntries'], 10);
    let cacheTTL = parseInt(data['cacheTTL'], 10);
    if (cacheMaxEntries < 1000) {
        yt2.toast('error', yt2.getI18n('YOUTUBE2_SETTINGS_ERR_CACHE_MAX_ENTRIES'));
        return;
    }
    if (cacheTTL < 600) {
        yt2.toast('error', yt2.getI18n('YOUTUBE2_SETTINGS_ERR_CACHE_TTL'));
        return;
    }

    this.config.set('cacheMaxEntries', cacheMaxEntries);
    this.config.set('cacheTTL', cacheTTL);

    yt2.getCache().setMaxEntries(cacheMaxEntries);
    yt2.getCache().setTTL(cacheTTL);

    yt2.toast('success', yt2.getI18n('YOUTUBE2_SETTINGS_SAVED'));
    this.refreshUIConfig();
}

ControllerYouTube2.prototype.configClearCache = function() {
    yt2.getCache().clear();
    yt2.toast('success', yt2.getI18n('YOUTUBE2_CACHE_CLEARED'));
    this.refreshUIConfig();
}

ControllerYouTube2.prototype.configAddFrontPageSection = function(data) {
    if (data['keywords'] == undefined || data['keywords'].trim() === '') {
        yt2.toast('error', yt2.getI18n('YOUTUBE2_PROVIDE_KEYWORDS'));
        return;
    }
    let itemCount = parseInt(data['itemCount'], 10);
    if (!itemCount) {
        yt2.toast('error', yt2.getI18n('YOUTUBE2_SETTINGS_ERR_ITEM_COUNT'));
        return;
    }

    let newSection = {
        enabled: true,
        title: data['title'],
        sortOrder: data['sortOrder'],
        itemType: data['itemType'].value,
        keywords: data['keywords'].trim(),
        itemCount: itemCount
    };
    let sections = yt2.getConfigValue('frontPageSections', [], true);
    sections.push(newSection);
    UIConfigHelper.sortFrontPageSections(sections);
    this.config.set('frontPageSections', JSON.stringify(sections));

    yt2.toast('success', yt2.getI18n('YOUTUBE2_SECTION_ADDED'));
    this.refreshUIConfig(true);
}

ControllerYouTube2.prototype.configUpdateFrontPageSection = function(data) {
    if (data['keywords'] == undefined || data['keywords'].trim() === '') {
        yt2.toast('error', yt2.getI18n('YOUTUBE2_PROVIDE_KEYWORDS'));
        return;
    }
    let itemCount = parseInt(data['itemCount'], 10);
    if (!itemCount) {
        yt2.toast('error', yt2.getI18n('YOUTUBE2_SETTINGS_ERR_ITEM_COUNT'));
        return;
    }

    let updateSection = {
        enabled: data['enabled'],
        title: data['title'],
        sortOrder: data['sortOrder'],
        itemType: data['itemType'].value,
        keywords: data['keywords'].trim(),
        itemCount: itemCount
    };
    let sections = yt2.getConfigValue('frontPageSections', [], true);
    let index = parseInt(data['index'], 10);
    sections.splice(index, 1);
    sections.push(updateSection);
    UIConfigHelper.sortFrontPageSections(sections);
    this.config.set('frontPageSections', JSON.stringify(sections));

    yt2.toast('success', yt2.getI18n('YOUTUBE2_SECTION_UPDATED'));
    this.refreshUIConfig();
}

ControllerYouTube2.prototype.configRemoveFrontPageSection = function(index) {
    let sections = yt2.getConfigValue('frontPageSections', [], true);
    sections.splice(index, 1);
    this.config.set('frontPageSections', JSON.stringify(sections));

    yt2.toast('success', yt2.getI18n('YOUTUBE2_SECTION_REMOVED'));
    this.refreshUIConfig(true);
}

ControllerYouTube2.prototype.refreshUIConfig = function(sectionsChanged) {
    let self = this;
    
    if (sectionsChanged) { // section added or removed
        // 'pushUiConfig' does not work properly when sections are added or removed
        // (some fields will display the wrong values). Reload UI instead.
        self.commandRouter.reloadUi();
    }
    else {
        self.commandRouter.getUIConfigOnPlugin('music_service', 'youtube2', {}).then( (config) => {
            self.commandRouter.broadcastMessage('pushUiConfig', config);
        });
    }
}

ControllerYouTube2.prototype.onVolumioStart = function() {
	let configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
	this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);

    return libQ.resolve();
}

ControllerYouTube2.prototype.onStart = function() {
    let self = this;

    yt2.init(self.context, self.config);
    if (!self.accessStatusListener) {
        self.accessStatusListener = (status, data) => {
            self.accessStatus = status;
            self.accessStatusData = data;
            self.refreshUIConfig();
        }

        yt2.on('accessStatusChanged', self.accessStatusListener);
    }
    
    self.browseController = new BrowseController();
    self.playController = new PlayController();
    self.searchController = new SearchController();

    self.addToBrowseSources();

    return libQ.resolve();
};

ControllerYouTube2.prototype.onStop = function() {

    this.commandRouter.volumioRemoveToBrowseSources('YouTube2');

    this.browseController = null;
    this.playController = null;
    this.searchController = null;

    yt2.reset();

    return libQ.resolve();
};

ControllerYouTube2.prototype.getConfigurationFiles = function() {
    return ['config.json'];
}

ControllerYouTube2.prototype.addToBrowseSources = function () {
	let data = {
        name: 'YouTube2',
        uri: 'youtube2',
        plugin_type: 'music_service',
        plugin_name: 'youtube2',
        albumart: '/albumart?sourceicon=music_service/youtube2/assets/images/youtube.svg'
    };
	this.commandRouter.volumioAddToBrowseSources(data);
};

ControllerYouTube2.prototype.handleBrowseUri = function(uri) {
    return this.browseController.browseUri(uri);
}

ControllerYouTube2.prototype.explodeUri = function (uri) {
    return this.browseController.explodeUri(uri);
};

ControllerYouTube2.prototype.clearAddPlayTrack = function(track) {  
    return this.playController.clearAddPlayTrack(track);
}

ControllerYouTube2.prototype.stop = function () {
    return this.playController.stop();
};

ControllerYouTube2.prototype.pause = function () {
    return this.playController.pause();
};
  
ControllerYouTube2.prototype.resume = function () {
    return this.playController.resume();
}
  
ControllerYouTube2.prototype.seek = function (position) {
    return this.playController.seek(position);
}

ControllerYouTube2.prototype.search = function(query) {
    return this.searchController.search(query);
}

/*ControllerYouTube2.prototype.prefetch = function (trackBlock) {
    return this.playController.prefetch(trackBlock);
};*/
