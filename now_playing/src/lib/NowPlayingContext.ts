import I18nSchema from '../i18n/strings_en.json';
import format from 'string-format';
import fs from 'fs-extra';
import winston from 'winston';
import { PluginConfigKey, PluginConfigValue } from './config/PluginConfig';
import { PLUGIN_CONFIG_SCHEMA } from './config/PluginConfig';
import { CommonSettingsCategory, CommonSettingsOf } from 'now-playing-common';
import { assignObjectEmptyProps } from './utils/Misc';

interface DeviceInfo {
  name: string;
  id: string;
  host: string;
}

const DUMMY_DEVICE_INFO: DeviceInfo = {
  name: 'Volumio',
  id: '1234567890',
  host: 'http://127.0.0.1'
};

export type I18nKey = keyof typeof I18nSchema;

class NowPlayingContext {

  #data: Record<string, any>;
  #pluginContext?: any;
  #pluginConfig?: any;

  #i18n: Record<string, string | Record<string, string>>;
  #i18nDefaults: Record<string, string | Record<string, string>>;
  #i18CallbackRegistered: boolean;

  constructor() {
    this.#data = {};
    this.#i18n = {};
    this.#i18nDefaults = {};
    this.#i18CallbackRegistered = false;
  }

  set<T>(key: string, value: T) {
    this.#data[key] = value;
  }

  get<T>(key: string): T | null;
  get<T>(key: string, defaultValue: T): T;
  get<T>(key: string, defaultValue?: T): T | null {
    return (this.#data[key] !== undefined) ? this.#data[key] : (defaultValue || null);
  }

  delete(key: string) {
    delete this.#data[key];
  }

  init(pluginContext: any, pluginConfig: any) {
    this.#pluginContext = pluginContext;
    this.#pluginConfig = pluginConfig;

    this.#loadI18n();
    if (!this.#i18CallbackRegistered) {
      this.#pluginContext.coreCommand.sharedVars.registerCallback('language_code', this.#onSystemLanguageChanged.bind(this));
      this.#i18CallbackRegistered = true;
    }
  }

  toast(type: 'success' | 'info' | 'error' | 'warning', message: string, title = 'Now Playing') {
    this.#pluginContext.coreCommand.pushToastMessage(type, title, message);
  }

  broadcastMessage(msg: string, value?: any) {
    return this.#pluginContext.coreCommand.broadcastMessage(msg, value);
  }

  refreshUIConfig() {
    this.#pluginContext.coreCommand.getUIConfigOnPlugin('user_interface', 'now_playing', {}).then((config: any) => {
      this.#pluginContext.coreCommand.broadcastMessage('pushUiConfig', config);
    });
  }

  getLogger(): winston.Logger {
    return this.#pluginContext.logger;
  }

  getDeviceInfo(): DeviceInfo {
    if (!this.get<DeviceInfo | null>('deviceInfo', null)) {
      const deviceInfo = this.#pluginContext.coreCommand.executeOnPlugin('system_controller', 'volumiodiscovery', 'getThisDevice');
      this.set('deviceInfo', deviceInfo);
    }
    const deviceInfo = this.get<DeviceInfo | null>('deviceInfo', null);
    if (!deviceInfo) {
      this.getLogger().warn('[now-playing] Failed to get device info!');
      return DUMMY_DEVICE_INFO;
    }
    return deviceInfo;
  }

  getLanguageCode(): string {
    return this.#pluginContext.coreCommand.sharedVars.get('language_code');
  }

  getPluginSetting(type: string, plugin: string, setting: string): any {
    return this.#pluginContext.coreCommand.executeOnPlugin(type, plugin, 'getConfigParam', setting);
  }

  getMusicServicePlugin(name: string): any {
    return this.#pluginContext.coreCommand.pluginManager.getPlugin('music_service', name) || null;
  }

  getErrorMessage(message: string, error: any, stack = true): string {
    let result = message;
    if (typeof error == 'object') {
      if (stack && error.stack) {
        result += ` ${error.stack}`;
      }
      else if (error.message) {
        result += ` ${error.message}`;
      }
    }
    else if (typeof error == 'string') {
      result += ` ${error}`;
    }
    return result.trim();
  }

  hasConfigKey<T extends PluginConfigKey>(key: T): boolean {
    return this.#pluginConfig.has(key);
  }

  getConfigValue<T extends PluginConfigKey>(key: T, raw: true): any;
  getConfigValue<T extends CommonSettingsCategory>(key: T, raw?: false | undefined): CommonSettingsOf<T>;
  getConfigValue<T extends PluginConfigKey>(key: T, raw?: false | undefined): PluginConfigValue<T>;
  getConfigValue<T extends PluginConfigKey>(key: T, raw = false): any {
    if (raw) {
      return this.#pluginConfig.has(key) ? this.#pluginConfig.get(key) : undefined;
    }
    const schema = PLUGIN_CONFIG_SCHEMA[key];
    if (this.#pluginConfig.has(key)) {
      const val = this.#pluginConfig.get(key);
      if (schema.json) {
        try {
          const parseVal = JSON.parse(val);
          const merged = assignObjectEmptyProps({}, parseVal, schema.defaultValue);
          return merged;
        }
        catch (e) {
          return schema.defaultValue;
        }
      }
      else {
        return val;
      }
    }
    else {
      return schema.defaultValue;
    }
  }

  deleteConfigValue(key: string) {
    this.#pluginConfig.delete(key);
  }

  setConfigValue<T extends PluginConfigKey>(key: T, value: PluginConfigValue<T>) {
    const schema = PLUGIN_CONFIG_SCHEMA[key];
    this.#pluginConfig.set(key, schema.json ? JSON.stringify(value) : value);
  }

  getConfigFilePath(): string {
    return this.#pluginConfig.filePath;
  }

  reset() {
    this.#pluginContext = null;
    this.#pluginConfig = null;

    this.#data = {};
  }

  getI18n(key: I18nKey, ...formatValues: any[]): string {
    let str;
    if (key.indexOf('.') > 0) {
      const mainKey = key.split('.')[0];
      const secKey = key.split('.')[1];
      str = (this.#i18n[mainKey] as Record<string, string>)?.[secKey] ||
        (this.#i18nDefaults[mainKey] as Record<string, string>)?.[secKey] ||
        key;
    }
    else {
      str = (this.#i18n[key] || this.#i18nDefaults[key] || key) as string;
    }

    if (str && formatValues.length) {
      str = format(str, ...formatValues);
    }

    return str;
  }

  #loadI18n() {
    if (this.#pluginContext) {
      const i18nPath = `${__dirname}/../i18n`;

      try {
        this.#i18nDefaults = fs.readJsonSync(`${i18nPath}/strings_en.json`);
      }
      catch (e) {
        this.#i18nDefaults = {};
      }

      try {
        const language_code = this.#pluginContext.coreCommand.sharedVars.get('language_code');
        this.#i18n = fs.readJsonSync(`${i18nPath}/strings_${language_code}.json`);
      }
      catch (e) {
        this.#i18n = this.#i18nDefaults;
      }
    }
  }

  #onSystemLanguageChanged() {
    this.#loadI18n();
  }
}

export default new NowPlayingContext();
