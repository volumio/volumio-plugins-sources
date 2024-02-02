import I18nSchema from '../i18n/strings_en.json';
import format from 'string-format';
import fs from 'fs-extra';
import winston from 'winston';

export type I18nKey = keyof typeof I18nSchema;

class JellyfinServerContext {

  #pluginContext?: any;

  #i18n: Record<string, string | Record<string, string>>;
  #i18nDefaults: Record<string, string | Record<string, string>>;
  #i18CallbackRegistered: boolean;

  constructor() {
    this.#i18n = {};
    this.#i18nDefaults = {};
    this.#i18CallbackRegistered = false;
  }

  init(pluginContext: any) {
    this.#pluginContext = pluginContext;

    this.#loadI18n();
    if (!this.#i18CallbackRegistered) {
      this.#pluginContext.coreCommand.sharedVars.registerCallback('language_code', this.#onSystemLanguageChanged.bind(this));
      this.#i18CallbackRegistered = true;
    }
  }

  toast(type: 'success' | 'info' | 'error' | 'warning', message: string, title = 'Jellyfin Server') {
    this.#pluginContext.coreCommand.pushToastMessage(type, title, message);
  }

  getLogger(): winston.Logger {
    return this.#pluginContext.logger;
  }

  getErrorMessage(message: string, error: any, stack = true): string {
    let result = message;
    if (typeof error == 'object') {
      if (error.message) {
        result += ` ${error.message}`;
      }
      if (stack && error.stack) {
        result += ` ${error.stack}`;
      }
    }
    else if (typeof error == 'string') {
      result += ` ${error}`;
    }
    return result.trim();
  }

  reset() {
    this.#pluginContext = null;
  }

  getI18n(key: I18nKey, ...formatValues: any[]): string {
    let str: string;
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

  getDeviceInfo() {
    return this.#pluginContext.coreCommand.executeOnPlugin('system_controller', 'volumiodiscovery', 'getThisDevice');
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

  get volumioCoreCommand(): any {
    return this.#pluginContext?.coreCommand || null;
  }
}

export default new JellyfinServerContext();
