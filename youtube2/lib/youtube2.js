'use strict';

const format = require('string-format');
const fs = require('fs-extra');

class YouTube2Context {

  constructor() {
    this._singletons = {};
    this._data = {};
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
  }

  toast(type, message, title = "YouTube2") {
    this._pluginContext.coreCommand.pushToastMessage(type, title, message);
  }

  refreshUIConfig() {
    this._pluginContext.coreCommand.getUIConfigOnPlugin('music_service', 'youtube2', {}).then((config) => {
      this._pluginContext.coreCommand.broadcastMessage('pushUiConfig', config);
    });
  }
  
  getLogger() {
    return this._pluginContext.logger;
  }

  getErrorMessage(message, error, stack = true) {
    let result = message;
    if (typeof error == 'object') {
      if (error.message) {
        result += ' ' + error.message;
      }
      if (stack && error.stack) {
        result += ' ' + error.stack;
      }
    }
    else if (typeof error == 'string') {
      result += ' ' + error;
    }
    return result.trim();
  }

  getDeviceInfo() {
    return this._pluginContext.coreCommand.getId();
  }

  getConfigValue(key, defaultValue = undefined, json = false) {
    if (this._pluginConfig.has(key)) {
      const val = this._pluginConfig.get(key);
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

  setConfigValue(key, value, json = false) {
    this._pluginConfig.set(key, json ? JSON.stringify(value) : value);
  }

  getMpdPlugin() {
    return this._getSingleton('mpdPlugin', () => this._pluginContext.coreCommand.pluginManager.getPlugin('music_service', 'mpd'));
  }

  getStateMachine() {
    return this._pluginContext.coreCommand.stateMachine;
  }

  reset() {
    delete this._pluginContext;
    delete this._pluginConfig;

    this._singletons = {};
    this._data = {};
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
      const mainKey = key.split('.')[0];
      const secKey = key.split('.')[1];
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
    if (this._pluginContext) {
      const i18nPath = __dirname + '/../i18n';

      try {
        this._i18nDefaults = fs.readJsonSync(i18nPath + '/strings_en.json');
      } catch (e) {
        this._i18nDefaults = {};
      }

      try {
        const langCode = this._pluginContext.coreCommand.sharedVars.get('language_code');
        this._i18n = fs.readJsonSync(i18nPath + '/strings_' + langCode + ".json");
      } catch (e) {
        this._i18n = this._i18nDefaults;
      }
    }
  }

  _onSystemLanguageChanged() {
    this._loadI18n();
  }

}

module.exports = new YouTube2Context();
