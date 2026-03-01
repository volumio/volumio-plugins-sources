'use strict';

var libQ = require('kew');
var fs = require('fs');
var axios = require('axios');

var AXIOS_OPTS = { timeout: 20000, headers: { 'User-Agent': 'VolumioRadioBrowser/1.0' } };

module.exports = ControllerRadioBrowser;

function ControllerRadioBrowser(context) {
    var self = this;

    this.context = context;
    this.commandRouter = this.context.coreCommand;
    this.logger = this.context.logger;
}

ControllerRadioBrowser.prototype.onVolumioStart = function () {
    var self = this;
    var configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
    this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);

    return libQ.resolve();
}

ControllerRadioBrowser.prototype.onStart = function () {
    this.mpdPlugin = this.commandRouter.pluginManager.getPlugin('music_service', 'mpd');
    this.loadRadioI18nStrings();
    this.addToBrowseSources();
    return libQ.resolve();
};

ControllerRadioBrowser.prototype.onStop = function () {
    this.commandRouter.volumioRemoveToBrowseSources(this.getRadioI18nString('PLUGIN_NAME'));
    return libQ.resolve();
};

ControllerRadioBrowser.prototype.getUIConfig = function () {
    var defer = libQ.defer();
    var self = this;

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
        __dirname + '/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function (uiconf) {
            var findOption = function (optionVal, options) {
                for (var i = 0; i < options.length; i++) {
                    if (options[i].value === optionVal) return options[i];
                }
                return options[0];
            };
            var apiServer = self.config.get('apiServer') || 'de1';
            uiconf.sections[0].content[0].value = findOption(apiServer, uiconf.sections[0].content[0].options);
            uiconf.sections[0].content[1].value = self.config.get('customApiUrl') || '';
            defer.resolve(uiconf);
        })
        .fail(function () {
            defer.reject(new Error());
        });

    return defer.promise;
};

ControllerRadioBrowser.prototype.saveApiConfig = function (data) {
    var self = this;
    var apiServer = (data.apiServer && data.apiServer.value) ? data.apiServer.value : data.apiServer;
    var customApiUrl = (data.customApiUrl || '').trim();
    self.config.set('apiServer', apiServer || 'de1');
    self.config.set('customApiUrl', customApiUrl);
    self.commandRouter.pushToastMessage('success', 'Radio Browser', self.commandRouter.getI18nString('COMMON.SETTINGS_SAVED_SUCCESSFULLY') || 'Settings saved');
    return libQ.resolve();
};

ControllerRadioBrowser.prototype.getApiBaseUrl = function () {
    var self = this;
    var apiServer = self.config.get('apiServer') || 'de1';
    var customApiUrl = self.config.get('customApiUrl') || '';
    if (apiServer === 'custom' && customApiUrl) {
        return customApiUrl.replace(/\/$/, '');
    }
    return 'https://' + apiServer + '.api.radio-browser.info';
};

ControllerRadioBrowser.prototype.getConfigurationFiles = function () {
    return ['config.json'];
}

ControllerRadioBrowser.prototype.loadRadioI18nStrings = function () {
    var self = this;
    try {
        var lang = this.commandRouter.sharedVars.get('language_code');
        self.i18nStrings = JSON.parse(fs.readFileSync(__dirname + '/i18n/strings_' + lang + '.json', 'utf8'));
    } catch (e) {
        self.i18nStrings = JSON.parse(fs.readFileSync(__dirname + '/i18n/strings_en.json', 'utf8'));
    }
    self.i18nStringsDefaults = JSON.parse(fs.readFileSync(__dirname + '/i18n/strings_en.json', 'utf8'));
};

ControllerRadioBrowser.prototype.getRadioI18nString = function (key) {
    var self = this;
    if (self.i18nStrings && self.i18nStrings[key] !== undefined) return self.i18nStrings[key];
    if (self.i18nStringsDefaults && self.i18nStringsDefaults[key] !== undefined) return self.i18nStringsDefaults[key];
    return key;
};

ControllerRadioBrowser.prototype.addToBrowseSources = function () {
    var data = {
        name: this.getRadioI18nString('PLUGIN_NAME'),
        uri: 'rbrowser',
        plugin_type: 'music_service',
        plugin_name: 'radio_browser',
        albumart: '/albumart?sourceicon=music_service/radio_browser/icon.png'
    };
    this.commandRouter.volumioAddToBrowseSources(data);
};
ControllerRadioBrowser.prototype.handleBrowseUri = function (curUri) {
    var self = this;
    // Volumio may pass URI with leading slash (e.g. "/rbrowser/topvote")
    curUri = (curUri || '').replace(/^\/+/, '');
    self.logger.info('[' + Date.now() + '] RadioBrowser handleBrowseUri: ' + curUri);

    try {
        // IMPORTANT: URI must not start with 'radio' - otherwise the Web Radio plugin (uri: 'radio') would be matched incorrectly
        if (curUri.startsWith('rbrowser') || curUri.startsWith('rb_')) {
            var baseUri = curUri.startsWith('rbrowser') ? 'rbrowser' : 'rb_';
            var segments = curUri.split('/');

            if (segments.length === 1 || (segments.length === 2 && segments[1] === '')) {
                return libQ.resolve(self._getRootCategories(baseUri));
            } else if (segments[1] === 'topvote' || segments[1] === 'topclick') {
                var endpoint = segments[1];
                var title = endpoint === 'topvote' ? 'Top Voted Stations' : 'Top Clicked Stations';
                // Do not use defer – return the Promise directly. A separate defer causes
                // "double reject" when Volumio rejects the promise via timeout.
                return self._getStationsList(endpoint, title, baseUri)
                    .fail(function () {
                        var msg = self.commandRouter.getI18nString('API_LOAD_FAILED') || 'API request failed. Please check API server in settings.';
                        self.commandRouter.pushToastMessage('error', 'Radio Browser', msg);
                        throw new Error('Failed to load ' + endpoint);
                    });
            } else {
                self.logger.info('RadioBrowser unhandled browse uri: ' + curUri);
                return libQ.resolve({
                    navigation: {
                        prev: { uri: baseUri },
                        lists: []
                    }
                });
            }
        } else {
            return libQ.reject(new Error('Invalid URI format for Radio Browser'));
        }
    } catch (e) {
        self.logger.error('handleBrowseUri error: ' + e);
        return libQ.reject(e);
    }
};

ControllerRadioBrowser.prototype._getRootCategories = function (baseUri) {
    baseUri = baseUri || 'rbrowser';
    var response = {
        navigation: {
            prev: { uri: '/' },
            lists: [
                {
                    title: 'Radio Browser Categories',
                    icon: 'fa fa-internet-explorer',
                    availableListViews: ['list', 'grid'],
                    items: [
                        {
                            service: 'radio_browser',
                            type: 'folder',
                            title: 'Top Voted',
                            artist: '',
                            album: '',
                            icon: 'fa fa-star',
                            uri: baseUri + '/topvote'
                        },
                        {
                            service: 'radio_browser',
                            type: 'folder',
                            title: 'Top Clicked',
                            artist: '',
                            album: '',
                            icon: 'fa fa-mouse-pointer',
                            uri: baseUri + '/topclick'
                        }
                    ]
                }
            ]
        }
    };
    return response;
}

ControllerRadioBrowser.prototype._getStationsList = function (endpoint, title, baseUri) {
    var self = this;
    var defer = libQ.defer();
    baseUri = baseUri || 'rbrowser';

    var baseUrl = self.getApiBaseUrl();
    var url = baseUrl + '/json/stations/' + endpoint + '/50';
    self.logger.info('RadioBrowser API request: ' + url);

    axios.get(url, AXIOS_OPTS)
        .then(function (res) {
            var items = self._mapStationsToVolumio(res.data, baseUri);
            self.logger.info('RadioBrowser API success: ' + items.length + ' stations');
            var response = {
                navigation: {
                    prev: { uri: baseUri },
                    lists: [{ title: title, availableListViews: ['list', 'grid'], items: items }]
                }
            };
            defer.resolve(response);
        })
        .catch(function (error) {
            var code = error && error.code ? error.code : '';
            var msg = (error && error.message) ? error.message : String(error);
            var httpStatus = (error && error.response) ? ' HTTP ' + error.response.status : '';
            self.logger.error('RadioBrowser API Error [' + url + ']: ' + code + ' ' + msg + httpStatus);
            defer.reject(new Error());
        });

    return defer.promise;
}


ControllerRadioBrowser.prototype._mapStationsToVolumio = function (stations, baseUri) {
    baseUri = baseUri || 'rbrowser';
    var items = [];
    if (!stations || !stations.length) return items;
    for (var i = 0; i < stations.length; i++) {
        var station = stations[i];
        if (station && station.url && station.name) {
            var bitrateStr = (station.bitrate && station.bitrate > 0) ? station.bitrate + ' kbps' : '';
            var codecStr = station.codec || '';
            var bitrateCodec = [bitrateStr, codecStr].filter(Boolean).join(' ');
            var album = station.tags || '';
            if (bitrateCodec) album = album ? album + ' · ' + bitrateCodec : bitrateCodec;
            items.push({
                service: 'radio_browser',
                type: 'webradio',
                title: station.name,
                artist: station.country || '',
                album: album,
                albumart: station.favicon || undefined,
                icon: station.favicon ? undefined : 'fa fa-microphone',
                uri: baseUri + '/station/' + station.stationuuid
            });
        }
    }
    return items;
};

ControllerRadioBrowser.prototype.search = function (query) {
    var self = this;
    var defer = libQ.defer();

    var searchVal = query.value.trim();
    if (searchVal.length < 2) {
        defer.resolve([]);
        return defer.promise;
    }

    var baseUrl = self.getApiBaseUrl();
    var url = baseUrl + '/json/stations/search?name=' + encodeURIComponent(searchVal) + '&limit=50';

    axios.get(url, AXIOS_OPTS)
        .then(function (res) {
            var items = self._mapStationsToVolumio(res.data);

            if (items.length > 0) {
                var list = {
                    title: 'Radio Browser',
                    icon: 'fa fa-internet-explorer',
                    availableListViews: ['list', 'grid'],
                    items: items
                };
                defer.resolve(list);
            } else {
                defer.resolve(null);
            }
        })
        .catch(function (error) {
            self.logger.error('RadioBrowser Search API Error: ' + error);
            defer.resolve(null); // Resolve empty so Volumio search doesn't break
        });

    return defer.promise;
};

ControllerRadioBrowser.prototype.explodeUri = function (uri) {
    var self = this;
    var defer = libQ.defer();

    // uri format: rbrowser/station/{stationuuid} or rb_/station/{stationuuid}
    var segments = uri.split('/');
    if (segments.length === 3 && segments[1] === 'station') {
        var uuid = segments[2];
        var baseUrl = self.getApiBaseUrl();
        var url = baseUrl + '/json/stations/byuuid?uuids=' + uuid;

        axios.get(url, AXIOS_OPTS)
            .then(function (res) {
                if (res.data && res.data.length > 0) {
                    var station = res.data[0];
                    // IMPORTANT: record click!
                    axios.post(baseUrl + '/json/clicks/' + station.stationuuid, null, AXIOS_OPTS).catch(function () { });

                    defer.resolve({
                        uri: station.url_resolved || station.url,
                        service: 'mpd',  // MPD plays the stream directly
                        name: station.name,
                        title: station.name,
                        type: 'track',
                        albumart: station.favicon || '',
                        samplerate: (station.bitrate ? station.bitrate + ' kbps' : ''),
                        bitdepth: '16 bit',
                        trackType: station.codec || 'webradio',
                        channels: 2,
                        duration: 0
                    });
                } else {
                    defer.reject(new Error('Station not found'));
                }
            })
            .catch(function (err) {
                self.logger.error('RadioBrowser Explore API Error: ' + err);
                defer.reject(new Error('API error'));
            });
    } else {
        defer.reject(new Error('Invalid URI'));
    }

    return defer.promise;
};

ControllerRadioBrowser.prototype.clearAddPlayTracks = function (tracks) {
    var self = this;
    if (!tracks || tracks.length === 0) return libQ.resolve();

    var track = Array.isArray(tracks) ? tracks[0] : tracks;
    if (!track.uri) return libQ.resolve();

    return self.explodeUri(track.uri)
        .then(function (exploded) {
            if (!exploded || !exploded.uri) return libQ.resolve();
            var streamUrl = exploded.uri;
            return self.mpdPlugin.sendMpdCommand('stop', [])
                .then(function () { return self.mpdPlugin.sendMpdCommand('clear', []); })
                .then(function () { return self.mpdPlugin.sendMpdCommand('add "' + streamUrl + '"', []); })
                .then(function () {
                    self.commandRouter.stateMachine.setConsumeUpdateService('mpd');
                    return self.mpdPlugin.sendMpdCommand('play', []);
                });
        })
        .fail(function (err) {
            self.logger.error('RadioBrowser clearAddPlayTracks: ' + err);
            return libQ.reject(err);
        });
};
