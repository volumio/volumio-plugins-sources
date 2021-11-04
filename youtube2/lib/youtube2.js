'use strict';

const libQ = require('kew');
const format = require('string-format');
const fs = require('fs-extra');
const Cache = require(__dirname + '/core/cache');
const GapiAuthManager = require(__dirname + '/core/gapi/auth');
const YouTubeService = require(__dirname + '/core/gapi/service');

class YouTube2Context {

    constructor() {
        this._singletons = {};
        this._data = {};
        this._listeners = {};

        // constants
        this.ACCESS_STATUS_NONE = 0;
        this.ACCESS_STATUS_GRANTED = 1;
        this.ACCESS_STATUS_PENDING_GRANT = 2;
        this.ACCESS_STATUS_PROCESSING = 4;
        this.ACCESS_STATUS_ERROR = -1;
    }

    set(key, value) {
        this._data[key] = value;
    }

    get(key, defaultValue = undefined) {
        return (this._data[key] != undefined) ? this._data[key] : defaultValue;
    }

    init(pluginContext, pluginConfig) {
        this._pluginContext = pluginContext;
        this._pluginConfig = pluginConfig;

        this._loadI18n();
        if (!this._i18CallbackRegistered) {
            this._pluginContext.coreCommand.sharedVars.registerCallback('language_code', this._onSystemLanguageChanged.bind(this));
            this._i18CallbackRegistered = true;
        }

        this.accessStatus = this.ACCESS_STATUS_NONE;
        this.service = new YouTubeService();

        let self = this;
        let authStorage = {
            set: (key, value) => {
                self._pluginConfig.set(`gapiAuth.${key}`, JSON.stringify(value));
            },
            get: key => self.getConfigValue(`gapiAuth.${key}`, null, true)
        }
        this.gapiAuthManager = new GapiAuthManager(this.getConfigValue('gapiCredentials', null, true), this.getLogger(), authStorage);
        this.gapiAuthManager.on('authStatusChanged', (status, data) => {
            this._handleAuthStatusChanged(status, data);
        })
        
        if (!this._credentialsCallbackRegistered) {
            this._pluginConfig.registerCallback('gapiCredentials', (newCredentials) => {
                this.gapiAuthManager.setCredentials(JSON.parse(newCredentials));
            });
            this._credentialsCallbackRegistered = true;
        }

        this._cache = new Cache(this.getConfigValue('cacheTTL', 1800), this.getConfigValue('cacheMaxEntries', 5000));
    }

    getGapiService() {
        if (this.accessStatus === this.ACCESS_STATUS_GRANTED) {
            return libQ.resolve(this.service);
        }
        else {
            return libQ.reject('Access not granted (check plugin settings)');
        }
    }

    getMpdPlugin() {
        let self = this;
        return self._getSingleton('mpdPlugin', () => self._pluginContext.coreCommand.pluginManager.getPlugin('music_service', 'mpd'));
    }

    getStateMachine() {
        return this._pluginContext.coreCommand.stateMachine;
    }

    on(event, callback) {
        if (this._listeners[event] == undefined) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
    }

    _handleAuthStatusChanged(status, data) {
        switch(status) {
            case GapiAuthManager.STATUS_ACCESS_GRANTED:
            case GapiAuthManager.STATUS_ACCESS_TOKEN_REFRESHED:
                this.service.setAccessToken(data.credentials, data.accessToken);
                if (this.accessStatus !== this.ACCESS_STATUS_GRANTED) {
                    this.accessStatus = this.ACCESS_STATUS_GRANTED;
                    this._fireAccessStatusChangedEvent(data);
                }
                break;
            case GapiAuthManager.STATUS_PREPARING_AUTH_FLOW:
            case GapiAuthManager.STATUS_FETCHING_GRANT_ACCESS_PAGE:
            case GapiAuthManager.STATUS_REFRESHING_ACCESS_TOKEN:
                if (this.accessStatus !== this.ACCESS_STATUS_PROCESSING) {
                    this.accessStatus = this.ACCESS_STATUS_PROCESSING;
                    this._fireAccessStatusChangedEvent();
                }
                break;
            case GapiAuthManager.STATUS_PENDING_USER_GRANT_ACCESS:
                this.accessStatus = this.ACCESS_STATUS_PENDING_GRANT;
                this._fireAccessStatusChangedEvent(data);
                break;
            case GapiAuthManager.STATUS_AUTH_ERROR:
                this.accessStatus = this.ACCESS_STATUS_ERROR;
                this._fireAccessStatusChangedEvent(data);
                break;
            default:
                this.accessStatus = this.ACCESS_STATUS_NONE;
                this._fireAccessStatusChangedEvent();
        }
    }

    _fireAccessStatusChangedEvent(data) {
        let self = this;

        if (self._listeners['accessStatusChanged']) {
            self._listeners['accessStatusChanged'].forEach( (callback) => {
                callback(self.accessStatus, data);
            });
        }
    }

    toast(type, message, title = "YouTube2") {
        this._pluginContext.coreCommand.pushToastMessage(type, title, message);
    }

    getLogger() {
        return this._pluginContext.logger;
    }

    getConfigValue(key, defaultValue = undefined, json = false) {
        if (this._pluginConfig.has(key)) {
            let val = this._pluginConfig.get(key);
            if (json) {
                try {
                    return JSON.parse(val);
                } catch (e) {
                    return defaultValue;
                }
            }
            else {
                return val;
            }
        }
        else {
            return defaultValue;
        }
    }

    getCache() {
        return this._cache;
    }

    reset() {
        this.gapiAuthManager.destroy();

        delete this._pluginContext;
        delete this._pluginConfig;
        
        this._singletons = {};
        this._data = {};
        this._listeners = {};

        this._cache.clear();
        this._cache.close();
        delete this._cache;
    }

    _getSingleton(key, getValue) {
        if (this._singletons[key] == undefined) {
            this._singletons[key] = getValue();
        }
        return this._singletons[key];
    }

    getI18n(key, ...formatValues) {
        let str;

        if (key.indexOf('.') > 0) {
            let mainKey = key.split('.')[0];
            let secKey = key.split('.')[1];
            if (this._i18n[mainKey][secKey] !== undefined) {
                str = this._i18n[mainKey][secKey];
            } else {
                str = this._i18nDefaults[mainKey][secKey];
            }

        } else {
            if (this._i18n[key] !== undefined) {
                str = this._i18n[key];
            } 
            else if (this._i18nDefaults[key] !== undefined) {
                str = this._i18nDefaults[key];
            }
            else {
                str = key;
            }
        }

        if (str && formatValues.length) {
            str = format(str, ...formatValues);
        }
        
        return str;
    }

    _loadI18n() {
        let self = this;

        if (self._pluginContext) {
            let i18nPath = __dirname + '/../i18n';
            
            try {
                self._i18nDefaults = fs.readJsonSync(i18nPath + '/strings_en.json');
            } catch (e) {
                self._i18nDefaults = {};
            }
            
            try {
                let language_code = self._pluginContext.coreCommand.sharedVars.get('language_code');
                self._i18n = fs.readJsonSync(i18nPath + '/strings_' + language_code + ".json");
            } catch(e) {
                self._i18n = self._i18nDefaults;
            }            
        }
    }

    _onSystemLanguageChanged() {
        this._loadI18n();
    }

}

module.exports = new YouTube2Context();