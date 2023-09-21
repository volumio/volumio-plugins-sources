'use strict';

const libQ = require('kew');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { Gpio } = require('onoff');
let hwShutdown = false;
let shutdownCtrl, initShutdown;

module.exports = remotepi;

function remotepi (context) {
  const self = this;

  self.context = context;
  self.commandRouter = self.context.coreCommand;
  self.logger = self.context.logger;
  self.configManager = self.context.configManager;
  self.pluginName = self.commandRouter.pluginManager.getPackageJson(__dirname).name;
}

remotepi.prototype.onVolumioStart = function () {
  const self = this;
  const configFile = self.commandRouter.pluginManager.getConfigurationFile(self.context, 'config.json');

  self.config = new (require('v-conf'))();
  self.config.loadFile(configFile);
  return libQ.resolve();
};

remotepi.prototype.onVolumioShutdown = function () {
  const self = this;
  /* global Atomics, SharedArrayBuffer */
  const msleep = n => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);

  try {
    if (!hwShutdown) {
      self.logger.info(self.pluginName + ': Shutdown initiated by UI');
      // Execute shutdown signal sequence on GPIO15
      initShutdown.writeSync(1);
      msleep(125);
      initShutdown.writeSync(0);
      msleep(200);
      initShutdown.writeSync(1);
      msleep(400);
      initShutdown.writeSync(0);
    } else {
      self.logger.info(self.pluginName + ': Shutdown initiated by hardware knob or IR remote control');
    }
    try {
      // Reconfigure GPIO14 as output with initial "high" level allowing the RemotePi
      // to recognize when the shutdown process on the RasPi has been finished
      shutdownCtrl.unwatchAll();
      shutdownCtrl.setEdge('none');
      shutdownCtrl.setDirection('high');
      msleep(4000);
    } catch (e) {
      self.logger.error(self.pluginName + ': Reconfiguring GPIO 14 for shutdown failed: ' + e);
      self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('REMOTEPI.PLUGIN_NAME'), self.commandRouter.getI18nString('REMOTEPI.ERR_RECONF14') + ': ' + e);
    }
  } catch (e) {
    self.logger.error(self.pluginName + ': Wrting the shutdown signal sequence to GPIO 15 failed: ' + e);
  }
  return libQ.resolve();
};

remotepi.prototype.onStart = function () {
  const self = this;

  self.commandRouter.loadI18nStrings();
  try {
    const defaultConfig = fs.readJsonSync(path.join(__dirname, 'config.json'));
    for (const configItem in defaultConfig) {
      if (!self.config.has(configItem)) {
        self.config.set(configItem, defaultConfig[configItem].value);
      }
    }
  } catch (e) {
    self.logger.error(self.pluginName + ': Failed to read default configuration from ' + path.join(__dirname, 'config.json: ') + e);
  }
  try {
    // As the RemotePi signals a shutdown event (hardware knob or IR receiver) to the RasPi by
    // setting the level on the pin of GPIO14 to "high" configure GPIO14 as input and watch it
    shutdownCtrl = new Gpio(14, 'in', 'rising');
    shutdownCtrl.watch((err, value) => {
      if (err) {
        self.logger.error(self.pluginName + ': Error watching GPIO 14: ' + err);
      } else if (value === 1) {
        hwShutdown = true;
        return self.commandRouter.shutdown();
      }
    });
  } catch (e) {
    self.logger.error(self.pluginName + ': Configuring GPIO 14 failed: ' + e);
    self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('REMOTEPI.PLUGIN_NAME'), self.commandRouter.getI18nString('REMOTEPI.ERR_CONF14') + ': ' + e);
    return libQ.reject();
  }
  try {
    initShutdown = new Gpio(15, 'out');
  } catch (e) {
    shutdownCtrl.unexport();
    self.logger.error(self.pluginName + ': Configuring GPIO 15 failed: ' + e);
    self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('REMOTEPI.PLUGIN_NAME'), self.commandRouter.getI18nString('REMOTEPI.ERR_CONF15') + ': ' + e);
    return libQ.reject();
  }
  self.modBootConfig(self.config.get('gpio_configuration') ? self.config.get('enable_gpio17') : '');
  return libQ.resolve();
};

remotepi.prototype.onStop = function () {
  const self = this;

  self.modBootConfig('');
  try {
    shutdownCtrl.unexport();
    initShutdown.unexport();
  } catch (e) {
    self.logger.error(self.pluginName + ': Freeing GPIO resources failed: ' + e);
  }
  return libQ.resolve();
};

// Configuration Methods -----------------------------------------------------------------------------

remotepi.prototype.getUIConfig = function () {
  const self = this;
  const defer = libQ.defer();
  const langCode = self.commandRouter.sharedVars.get('language_code');

  self.commandRouter.i18nJson(path.join(__dirname, 'i18n', 'strings_' + langCode + '.json'),
    path.join(__dirname, 'i18n', 'strings_en.json'),
    path.join(__dirname, 'UIConfig.json'))
    .then(uiconf => {
      uiconf.sections[0].content[0].value = self.config.get('gpio_configuration');
      uiconf.sections[0].content[1].value = self.config.get('enable_gpio17');
      defer.resolve(uiconf);
    })
    .fail(e => {
      self.logger.error(self.pluginName + ': Could not fetch UI configuration: ' + e);
      defer.reject(new Error());
    });
  return defer.promise;
};

remotepi.prototype.getConfigurationFiles = function () {
  return ['config.json'];
};

remotepi.prototype.getI18nFile = function (langCode) {
  const self = this;
  const langFile = 'strings_' + langCode + '.json';

  try {
    // check for i18n file fitting the system language
    if (fs.readdirSync(path.join(__dirname, 'i18n'), { withFileTypes: true })
      .some(item => item.isFile() && item.name === langFile)) {
      return path.join(__dirname, 'i18n', langFile);
    }
    throw new Error('i18n file complementing the system language not found.');
  } catch (e) {
    self.logger.error(self.pluginName + ': Fetching language file: ' + e);
    // return default i18n file
    return path.join(__dirname, 'i18n', 'strings_en.json');
  }
};

remotepi.prototype.saveConf = function (data) {
  const self = this;
  const responseData = {
    title: self.commandRouter.getI18nString('REMOTEPI.PLUGIN_NAME'),
    message: self.commandRouter.getI18nString('REMOTEPI.REBOOT_MSG'),
    size: 'lg',
    buttons: [
      {
        name: self.commandRouter.getI18nString('COMMON.RESTART'),
        class: 'btn btn-default',
        emit: 'reboot',
        payload: ''
      },
      {
        name: self.commandRouter.getI18nString('COMMON.CONTINUE'),
        class: 'btn btn-info',
        emit: 'closeModals',
        payload: ''
      }
    ]
  };

  if (self.config.get('gpio_configuration') !== data.gpio_configuration || self.config.get('enable_gpio17') !== data.gpio17) {
    self.config.set('gpio_configuration', data.gpio_configuration);
    self.config.set('enable_gpio17', data.gpio17);
    self.modBootConfig(data.gpio_configuration ? data.gpio17 : '');
    self.commandRouter.broadcastMessage('openModal', responseData);
  } else {
    self.commandRouter.pushToastMessage('info', self.commandRouter.getI18nString('REMOTEPI.PLUGIN_NAME'), self.commandRouter.getI18nString('REMOTEPI.NO_CHANGES'));
  }
};

// Plugin Methods ------------------------------------------------------------------------------------

remotepi.prototype.modBootConfig = function (gpio17) {
  const self = this;
  const kernelVersion = os.release().match(/[0-9]+/g);
  const configTxtBanner = '#### RemotePi lirc setting below: do not alter ####' + os.EOL;
  const searchexp = configTxtBanner + 'dtoverlay=.*';
  let bootstring = gpio17 ? 'dtoverlay=gpio-ir,gpio_pin=17' : 'dtoverlay=gpio-ir,gpio_pin=18';
  let configFile = '/boot/userconfig.txt';

  if (Number(kernelVersion[0]) < 4 || (Number(kernelVersion[0]) === 4 && Number(kernelVersion[1]) < 19)) {
    bootstring = bootstring.replace('gpio-ir,gpio_pin', 'lirc-rpi,gpio_in_pin');
  }
  try {
    if (fs.statSync(configFile).isFile()) {
      // if /boot/userconfig.txt exists, remove rempotepi related banner and bootstring from /boot/config.txt
      try {
        const configTxt = fs.readFileSync('/boot/config.txt', 'utf8');
        const newConfigTxt = configTxt.replace(new RegExp(os.EOL + searchexp + os.EOL + '*'), '');
        if (newConfigTxt !== configTxt) {
          try {
            fs.writeFileSync('/boot/config.txt', newConfigTxt, 'utf8');
          } catch (e) {
            self.logger.error(self.pluginName + ': Error writing ' + configFile + ': ' + e);
            self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('REMOTEPI.PLUGIN_NAME'), self.commandRouter.getI18nString('REMOTEPI.ERR_WRITE') + configFile + ': ' + e);
          }
        }
      } catch (e) {
        self.logger.error(self.pluginName + ': Error reading ' + configFile + ': ' + e);
        self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('REMOTEPI.PLUGIN_NAME'), self.commandRouter.getI18nString('REMOTEPI.ERR_READ') + configFile + ': ' + e);
      }
    } else {
      self.logger.info(self.pluginName + ': Using /boot/config.txt instead of /boot/userconfig.txt. Reason: /boot/userconfig.txt is not a file.');
      throw new Error();
    }
  } catch (e) {
    configFile = '/boot/config.txt';
  } finally {
    try {
      const configTxt = fs.readFileSync(configFile, 'utf8');
      let newConfigTxt = configTxt;
      if (gpio17 === '') {
        newConfigTxt = configTxt.replace(new RegExp(os.EOL + '*' + searchexp), '');
      } else if (configTxt.search(bootstring) === -1) {
        newConfigTxt = configTxt.replace(new RegExp(searchexp), configTxtBanner + bootstring);
        if (newConfigTxt === configTxt) {
          newConfigTxt = configTxt + os.EOL + os.EOL + configTxtBanner + bootstring;
        }
      }
      if (newConfigTxt !== configTxt) {
        try {
          fs.writeFileSync(configFile, newConfigTxt, 'utf8');
        } catch (e) {
          self.logger.error(self.pluginName + ': Error writing ' + configFile + ': ' + e);
          self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('REMOTEPI.PLUGIN_NAME'), self.commandRouter.getI18nString('REMOTEPI.ERR_WRITE') + configFile + ': ' + e);
        }
      }
    } catch (e) {
      self.logger.error(self.pluginName + ': Error reading ' + configFile + ': ' + e);
      self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('REMOTEPI.PLUGIN_NAME'), self.commandRouter.getI18nString('REMOTEPI.ERR_READ') + configFile + ': ' + e);
    }
  }
};
