'use strict';

const libQ = require('kew');
const fs = require('fs-extra');
const { exec, execSync } = require('child_process');
const path = require('path');
const os = require('os');
const kernelVersion = os.release().match(/[0-9]+/g);
const overlay = (Number(kernelVersion[0]) < 4 || (Number(kernelVersion[0]) === 4 && Number(kernelVersion[1]) < 19)) ? 'lirc-rpi' : 'gpio-ir';
let gpioConfigurable = false;
let lircLegacy, device, header;

module.exports = IrController;

function IrController (context) {
  const self = this;

  self.context = context;
  self.commandRouter = self.context.coreCommand;
  self.logger = self.commandRouter.logger;
  self.configManager = self.context.configManager;
  self.pluginName = self.commandRouter.pluginManager.getPackageJson(__dirname).name;
  self.pluginType = self.commandRouter.pluginManager.getPackageJson(__dirname).volumio_info.plugin_type;
}

IrController.prototype.onVolumioStart = function () {
  const self = this;
  const configFile = self.commandRouter.pluginManager.getConfigurationFile(self.context, 'config.json');

  self.config = new (require('v-conf'))();
  self.config.loadFile(configFile);
  return libQ.resolve();
};

IrController.prototype.onStart = function () {
  const self = this;
  const defer = libQ.defer();

  self.commandRouter.loadI18nStrings();
  self.commandRouter.getSystemVersion()
    .then(infos => {
      device = infos.hardware;
    })
    .fin(() => {
      try {
        const lircVersion = execSync('/usr/bin/dpkg -s lirc', { encoding: 'utf8', uid: 1000, gid: 1000 }).match(/^Version: .+$/m).toString().match(/[0-9]+/g);
        lircLegacy = (Number(lircVersion[0]) === 0 && (Number(lircVersion[1]) < 9 || (Number(lircVersion[1]) === 9 && Number(lircVersion[2]) < 4)));
        self.prepareLirc()
          .then(() => {
            self.saveIROptions({ ir_profile: { value: self.config.get('ir_profile', 'JustBoom IR Remote') }, notify: false });
            if (device === 'pi') {
              if (!fs.existsSync('/sys/firmware/devicetree/base/lirc_rpi') && fs.readdirSync('/sys/firmware/devicetree/base').find(fn => fn.startsWith('ir-receiver')) === undefined) {
                if (overlay === 'gpio-ir') {
                  self.logger.info(self.pluginName + ': HAT did not load /proc/device-tree/ir_receiver!');
                } else {
                  self.logger.info(self.pluginName + ': HAT did not load /proc/device-tree/lirc_rpi!');
                }
                // determine header pincount by Raspberry Pi revision code (https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#raspberry-pi-revision-codes)
                exec('/usr/bin/awk \'/^Revision/ {sub("^1000", "", $3); print $3}\' /proc/cpuinfo', { uid: 1000, gid: 1000 }, (error, stdout, stderr) => {
                  if (error !== null) {
                    self.logger.info(self.pluginName + ': Raspberry Pi model cannot be determined: ' + error);
                  } else {
                    gpioConfigurable = true;
                    stdout = stdout.trim();
                    self.logger.info(self.pluginName + ': Raspberry Pi revision code: ' + stdout);
                    if (stdout === 'Beta' || parseInt(stdout, 16) < 4) {
                      // Model B beta, model B PCB rev. 1.0: original 26pin header (P1)
                      header = '26';
                    } else if (parseInt(stdout, 16) < 22) {
                      // Model B PCB rev. 2.0 and model A PCB rev. 2.0: altered 26pin header (P1) + 8pin header (P5)
                      header = '34';
                    } else {
                      const modelId = (stdout.length === 4) ? stdout : stdout.substr(-3, 2);
                      switch (modelId) {
                        // sort out the Compute Modules except CM4
                        case '0011': // CM1
                        case '0014': // CM1
                        case '06': // CM
                        case '0a': // CM3
                        case '10': // CM3+
                          gpioConfigurable = false;
                          break;
                        default:
                          // Models B+, A+, 2B, 3B, 3B+, 3A+, 4B, Zero, Zero W, Zero 2 W, Pi 400, CM4 IO Board, 5: 40pin header (P1)
                          header = '40';
                      }
                    }
                    if (gpioConfigurable) {
                      self.saveGpioOptions({
                        header40_gpio_in_pin: { value: self.config.get('gpio_in_pin', 25) },
                        header34_gpio_in_pin: { value: self.config.get('gpio_in_pin', 25) },
                        header26_gpio_in_pin: { value: self.config.get('gpio_in_pin', 25) },
                        gpio_pull: { value: self.config.get('gpio_pull', 'up') },
                        forceActiveState: self.config.get('forceActiveState', false),
                        activeState: { value: self.config.get('activeState', 1) },
                        notify: false
                      });
                    }
                  }
                });
              } else {
                if (overlay === 'gpio-ir') {
                  self.logger.info(self.pluginName + ': HAT already loaded /proc/device-tree/ir_receiver!');
                } else {
                  self.logger.info(self.pluginName + ': HAT already loaded /proc/device-tree/lirc_rpi!');
                }
              }
            }
            defer.resolve();
          })
          .fail(() => defer.reject());
      } catch (e) {
        self.logger.error(self.pluginName + ': ' + e);
        defer.reject();
      }
    });
  return defer.promise;
};

IrController.prototype.onStop = function () {
  const self = this;
  const defer = libQ.defer();
  const lircService = lircLegacy ? 'lirc' : 'lircd';

  self.systemctl('stop ' + lircService + '.service')
    .fin(() => {
      if (device === 'pi') {
        let gpioPin = ' gpio_pin=' + self.config.get('gpio_in_pin');
        let activeState = (self.config.get('forceActiveState')) ? ' invert=' + self.config.get('activeState') : '';
        if (overlay === 'lirc-rpi') {
          gpioPin = ' gpio_in_pin=' + self.config.get('gpio_in_pin');
          activeState = (self.config.get('forceActiveState')) ? ' sense=' + self.config.get('activeState') : '';
        }
        const params = gpioPin + ' gpio_pull=' + self.config.get('gpio_pull') + activeState;
        self.dtoverlayIndex(params + '$')
          .then(i => {
            if (i !== -1) {
              self.dtoverlay('-r ' + i)
                .then(() => self.logger.info(self.pluginName + ': ' + overlay + ' overlay removed.'))
                .fail(e => self.logger.error(self.pluginName + ': Error removing ' + overlay + ' overlay: ' + e));
            }
          });
      }
      defer.resolve();
    });
  return defer.promise;
};

// Configuration Methods -----------------------------------------------------------------------------

IrController.prototype.getLabelForSelect = function (options, key) {
  for (let i = 0, n = options.length; i < n; i++) {
    if (options[i].value === key) {
      return options[i].label;
    }
  }
  return 'VALUE NOT FOUND BETWEEN SELECT OPTIONS!';
};

IrController.prototype.getUIConfig = function () {
  const self = this;
  const defer = libQ.defer();
  const langCode = this.commandRouter.sharedVars.get('language_code');

  fs.readdir(path.join(__dirname, 'configurations'), { withFileTypes: true }, (error, items) => {
    if (error !== null) {
      items = [];
      self.logger.error(self.pluginName + ': Factory profile folder not accessible: ' + error);
    }
    const dirs = items
      .filter(item => item.isDirectory())
      .map(dir => dir.name);
    fs.readdir(path.join('data', 'INTERNAL', self.pluginName, 'configurations'), { withFileTypes: true }, (error, items) => {
      if (error !== null) {
        self.logger.error(self.pluginName + ': Custom profile folder not accessible: ' + error);
      } else {
        items
          .filter(item => item.isDirectory())
          .forEach(customDir => {
            if (dirs.every(dir => dir !== customDir.name)) {
              dirs.push(customDir.name);
            }
          });
      }
      dirs.sort(Intl.Collator().compare);
      self.commandRouter.i18nJson(path.join(__dirname, 'i18n', 'strings_' + langCode + '.json'),
        path.join(__dirname, 'i18n', 'strings_en.json'),
        path.join(__dirname, 'UIConfig.json'))
        .then(uiconf => {
          const activeProfile = self.config.get('ir_profile', 'JustBoom IR Remote');
          uiconf.sections[0].content[0].value.value = activeProfile;
          uiconf.sections[0].content[0].value.label = activeProfile;
          for (let i = 0, n = dirs.length; i < n; i++) {
            self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[0].options', { value: dirs[i], label: dirs[i] });
          }
          if (gpioConfigurable) {
            uiconf.sections[1].hidden = false;
            switch (header) {
              case '40':
                uiconf.sections[1].content[0].hidden = false;
                uiconf.sections[1].content[0].value.value = self.config.get('gpio_in_pin', 25);
                uiconf.sections[1].content[0].value.label = self.config.get('gpio_in_pin', 25);
                uiconf.sections[1].content[1].hidden = true;
                uiconf.sections[1].content[2].hidden = true;
                break;
              case '34':
                uiconf.sections[1].content[0].hidden = true;
                uiconf.sections[1].content[1].hidden = false;
                uiconf.sections[1].content[1].value.value = self.config.get('gpio_in_pin', 25);
                uiconf.sections[1].content[1].value.label = self.config.get('gpio_in_pin', 25);
                uiconf.sections[1].content[2].hidden = true;
                break;
              case '26':
                uiconf.sections[1].content[0].hidden = true;
                uiconf.sections[1].content[1].hidden = true;
                uiconf.sections[1].content[2].hidden = false;
                uiconf.sections[1].content[2].value.value = self.config.get('gpio_in_pin', 25);
                uiconf.sections[1].content[2].value.label = self.config.get('gpio_in_pin', 25);
                break;
            }
            uiconf.sections[1].content[4].value.value = self.config.get('gpio_pull', 'up');
            uiconf.sections[1].content[4].value.label = self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[1].content[4].options'), self.config.get('gpio_pull', 'up'));
            uiconf.sections[1].content[5].value = self.config.get('forceActiveState', false);
            uiconf.sections[1].content[6].value.value = self.config.get('activeState', 1);
            uiconf.sections[1].content[6].value.label = self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[1].content[6].options'), self.config.get('activeState', 1));
          } else {
            uiconf.sections[1].hidden = true;
          }
          defer.resolve(uiconf);
        })
        .fail(e => {
          self.logger.error(self.pluginName + ': Could not fetch UI configuration: ' + e);
          defer.reject(new Error());
        });
    });
  });
  return defer.promise;
};

IrController.prototype.updateUIConfig = function () {
  const self = this;

  self.commandRouter.getUIConfigOnPlugin(self.pluginType, self.pluginName, {})
    .then(uiconf => self.commandRouter.broadcastMessage('pushUiConfig', uiconf));
  self.commandRouter.broadcastMessage('pushUiConfig');
};

IrController.prototype.getConfigurationFiles = function () {
  return ['config.json'];
};

IrController.prototype.getI18nFile = function (langCode) {
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

IrController.prototype.saveIROptions = function (data) {
  const self = this;

  if (self.config.get('ir_profile') !== data.ir_profile.value || data.notify === false) {
    let profilePath = path.join(__dirname, 'configurations', data.ir_profile.value);
    try {
      if (fs.readdirSync(path.join('data', 'INTERNAL', self.pluginName, 'configurations'), { withFileTypes: true })
        .some(item => item.isDirectory() && item.name === data.ir_profile.value)) {
        profilePath = path.join('data', 'INTERNAL', self.pluginName, 'configurations', data.ir_profile.value);
      }
    } catch (e) {
      self.logger.error(self.pluginName + ': Custom profile folder not accessible: ' + e);
    }
    try {
      let c = 0;
      fs.readdirSync(profilePath, { withFileTypes: true })
        .filter(item => item.isFile() && (item.name === 'lircrc' || item.name === 'lircd.conf'))
        .forEach(profileFile => {
          fs.writeFileSync(path.join('etc', 'lirc', profileFile.name), fs.readFileSync(path.join(profilePath, profileFile.name), 'utf8'), 'utf8');
          c++;
        });
      if (c === 2) {
        self.logger.info(self.pluginName + ': LIRC correctly updated.');
        if (data.notify !== false) {
          self.commandRouter.pushToastMessage('success', self.commandRouter.getI18nString('IRCONTROLLER.PLUGIN_NAME'), self.commandRouter.getI18nString('COMMON.SETTINGS_SAVED_SUCCESSFULLY'));
        }
        self.config.set('ir_profile', data.ir_profile.value);
        setTimeout(() => self.restartLirc(data.notify), 1000);
      } else {
        throw new Error('Missing "lircrc" and / or "lircd.conf" files.');
      }
    } catch (e) {
      if (data.notify !== false) {
        self.updateUIConfig();
      }
      self.logger.error(self.pluginName + ': Error copying configurations: ' + e);
      self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('IRCONTROLLER.PLUGIN_NAME'), self.commandRouter.getI18nString('COMMON.SETTINGS_SAVE_ERROR'));
    }
  } else if (data.notify !== false) {
    self.commandRouter.pushToastMessage('info', self.commandRouter.getI18nString('IRCONTROLLER.PLUGIN_NAME'), self.commandRouter.getI18nString('IRCONTROLLER.NO_CHANGES'));
  }
};

IrController.prototype.saveGpioOptions = function (data) {
  const self = this;
  let gpioInPin;

  switch (header) {
    case '40':
      gpioInPin = data.header40_gpio_in_pin.value;
      break;
    case '34':
      gpioInPin = data.header34_gpio_in_pin.value;
      break;
    case '26':
      gpioInPin = data.header26_gpio_in_pin.value;
      break;
  }
  if (self.config.get('gpio_in_pin') !== gpioInPin || self.config.get('gpio_pull') !== data.gpio_pull.value || self.config.get('forceActiveState') !== data.forceActiveState || self.config.get('activeState') !== data.activeState.value || data.notify === false) {
    self.manageIrOverlays(gpioInPin, data)
      .then(() => {
        self.config.set('gpio_in_pin', gpioInPin);
        self.config.set('gpio_pull', data.gpio_pull.value);
        self.config.set('forceActiveState', data.forceActiveState);
        self.config.set('activeState', data.activeState.value);
        if (data.notify !== false) {
          self.commandRouter.pushToastMessage('success', self.commandRouter.getI18nString('IRCONTROLLER.PLUGIN_NAME'), self.commandRouter.getI18nString('COMMON.SETTINGS_SAVED_SUCCESSFULLY'));
        }
        self.restartLirc(data.notify);
      })
      .fail(uiNeedsUpdate => {
        if (uiNeedsUpdate) {
          self.updateUIConfig();
        }
      });
  } else if (data.notify !== false) {
    self.commandRouter.pushToastMessage('info', self.commandRouter.getI18nString('IRCONTROLLER.PLUGIN_NAME'), self.commandRouter.getI18nString('IRCONTROLLER.NO_CHANGES'));
  }
};

// Plugin Methods ------------------------------------------------------------------------------------

IrController.prototype.prepareLirc = function () {
  const self = this;
  const defer = libQ.defer();
  const fn = lircLegacy ? '/etc/lirc/hardware.conf' : '/etc/lirc/lirc_options.conf';

  exec('/usr/bin/sudo /bin/chmod -R a+rwX /etc/lirc/*', { uid: 1000, gid: 1000 }, (error, stdout, stderr) => {
    if (error !== null) {
      self.logger.error(self.pluginName + ': Error setting file permissions on /etc/lirc/*: ' + error);
      self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('IRCONTROLLER.PLUGIN_NAME'), self.commandRouter.getI18nString('IRCONTROLLER.GENERIC_FAILED') + error);
      defer.reject();
    } else {
      self.logger.info(self.pluginName + ': File permissions successfully set on /etc/lirc/*.');
      fs.readFile(fn, 'utf8', (err, data) => {
        if (err) {
          self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('IRCONTROLLER.PLUGIN_NAME'), self.commandRouter.getI18nString('IRCONTROLLER.ERR_READ' + fn + ': ') + err);
          self.logger.error(self.pluginName + ': Error reading ' + fn + ': ' + err);
          defer.reject();
        } else {
          if (lircLegacy) {
            data = data.replace(new RegExp('^#? *LIRCD_ARGS=".*"$', 'm'), 'LIRCD_ARGS="--uinput"')
              .replace(new RegExp('^#? *DRIVER=".*"$', 'm'), 'DRIVER="default"')
              .replace(new RegExp('^#? *DEVICE=".*"$', 'm'), 'DEVICE="/dev/lirc0"');
            switch (device) {
              case 'odroidc1':
              case 'odroidc2':
              case 'odroidc4':
              case 'odroidn2':
                data = data.replace(new RegExp('^#? *MODULES=".*"$', 'm'), 'MODULES="meson-ir"');
                break;
              case 'pi':
                data = data.replace(new RegExp('^#? *MODULES=".*"$', 'm'), 'MODULES=' + ((overlay === 'gpio-ir') ? '"gpio_ir_recv"' : '"lirc_rpi"'));
            }
          } else {
            data = data.replace(new RegExp('^#? *driver *=.*$', 'm'), 'driver          = default')
              .replace(new RegExp('^#? *device *=.*$', 'm'), 'device          = /dev/lirc0');
            switch (device) {
              case 'odroidc1':
              case 'odroidc2':
              case 'odroidc4':
              case 'odroidn2':
                data = data.replace(new RegExp('^#? *\\[modinit]$', 'm'), '[modinit]')
                  .replace(new RegExp('^#? *code *=.*$', 'm'), 'code = /sbin/modprobe meson-ir');
                break;
            }
          }
          fs.writeFile(fn, data, 'utf8', err => {
            if (err) {
              self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('IRCONTROLLER.PLUGIN_NAME'), self.commandRouter.getI18nString('IRCONTROLLER.ERR_WRITE' + fn + ': ') + err);
              self.logger.error(self.pluginName + ': Error writing ' + fn + ': ' + err);
              defer.reject();
            } else {
              defer.resolve();
            }
          });
        }
      });
    }
  });
  return defer.promise;
};

IrController.prototype.restartLirc = function (notify) {
  const self = this;

  if (lircLegacy) {
    self.systemctl('stop lirc.service')
      .then(() => {
        setTimeout(() => {
          self.systemctl('start lirc.service')
            .then(() => {
              if (notify !== false) {
                self.commandRouter.pushToastMessage('success', self.commandRouter.getI18nString('IRCONTROLLER.PLUGIN_NAME'), self.commandRouter.getI18nString('COMMON.CONFIGURATION_UPDATE_DESCRIPTION'));
              }
            });
        }, 1000);
      });
  } else {
    self.systemctl('restart lircd.service')
      .then(() => {
        self.systemctl('restart irexec.service')
          .then(() => {
            if (notify !== false) {
              self.commandRouter.pushToastMessage('success', self.commandRouter.getI18nString('IRCONTROLLER.PLUGIN_NAME'), self.commandRouter.getI18nString('COMMON.CONFIGURATION_UPDATE_DESCRIPTION'));
            }
          });
      });
  }
};

IrController.prototype.dtoverlay = function (options) {
  const defer = libQ.defer();

  exec('/usr/bin/sudo /usr/bin/dtoverlay ' + options, { uid: 1000, gid: 1000 }, (error, stdout, stderr) => {
    if (error !== null || stderr !== '') {
      defer.reject(error);
    } else {
      defer.resolve();
    }
  });
  return defer.promise;
};

IrController.prototype.dtoverlayIndex = function (params) {
  const defer = libQ.defer();
  const self = this;
  let i = -1;

  exec('/usr/bin/dtoverlay -l', { uid: 1000, gid: 1000 }, (error, stdout, stderr) => {
    if (error !== null) {
      self.logger.error(self.pluginName + ': ' + error);
      defer.reject();
    } else {
      i = stdout.search(new RegExp('[0-9]+:  ' + overlay + ' ' + params, 'gm'));
      if (i !== -1) {
        i = stdout.slice(i, stdout.indexOf(':', i));
      }
      defer.resolve(i);
    }
  });
  return defer.promise;
};

IrController.prototype.manageIrOverlays = function (gpioInPin, data) {
  const defer = libQ.defer();
  const self = this;
  let gpioPinOld = ' gpio_pin=' + self.config.get('gpio_in_pin', '25');
  let gpioPinNew = ' gpio_pin=' + gpioInPin;
  let activeStateOld = (self.config.get('forceActiveState', false)) ? ' invert=' + self.config.get('activeState', 1) : '';
  let activeStateNew = (data.forceActiveState) ? ' invert=' + data.activeState.value : '';
  let paramsOld = gpioPinOld + ' gpio_pull=' + self.config.get('gpio_pull', 'up') + activeStateOld;
  let paramsNew = gpioPinNew + ' gpio_pull=' + data.gpio_pull.value + activeStateNew;

  if (overlay === 'lirc-rpi') {
    gpioPinOld = ' gpio_in_pin=' + self.config.get('gpio_in_pin', '25');
    gpioPinNew = ' gpio_in_pin=' + gpioInPin;
    activeStateOld = (self.config.get('forceActiveState', false)) ? ' sense=' + self.config.get('activeState', 1) : '';
    activeStateNew = (data.forceActiveState) ? ' sense=' + data.activeState.value : '';
    paramsOld = gpioPinOld + ' gpio_in_pull=' + self.config.get('gpio_pull', 'up') + activeStateOld;
    paramsNew = gpioPinNew + ' gpio_in_pull=' + data.gpio_pull.value + activeStateNew;
  }
  self.dtoverlayIndex(paramsOld + '$')
    .then(i => {
      self.dtoverlay('-r ' + i)
        .then(() => self.logger.info(self.pluginName + ': Overlay ' + overlay + paramsOld + ' removed.'))
        .fail(e => {
          if (i !== -1) {
            self.logger.error(self.pluginName + ': Error removing overlay: ' + e);
            self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('IRCONTROLLER.PLUGIN_NAME'), self.commandRouter.getI18nString('IRCONTROLLER.ERR_REMOVE_OVERLAY') + e);
          }
        })
        .done(() => {
          self.dtoverlayIndex(paramsNew + '$')
            .then(i => {
              if (i === -1) {
                self.dtoverlayIndex(gpioPinNew)
                  .then(i => {
                    if (i === -1) {
                      self.dtoverlay(overlay + paramsNew)
                        .then(() => {
                          self.logger.info(self.pluginName + ': Overlay ' + overlay + paramsNew + ' loaded.');
                          defer.resolve();
                        })
                        .fail(e => {
                          self.logger.error(self.pluginName + ': Error loading overlay: ' + e);
                          self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('IRCONTROLLER.PLUGIN_NAME'), self.commandRouter.getI18nString('IRCONTROLLER.ERR_LOAD_OVERLAY') + e);
                          if (data.notify === false) {
                            defer.reject(false);
                          } else {
                            self.dtoverlay(overlay + paramsOld);
                            defer.reject(true);
                          }
                        });
                    } else {
                      self.logger.error(self.pluginName + ': GPIO ' + gpioInPin + ' is already occupied.');
                      self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('IRCONTROLLER.PLUGIN_NAME'), self.commandRouter.getI18nString('IRCONTROLLER.ERR_GPIO_OCCUPIED'));
                      if (data.notify === false) {
                        defer.reject(false);
                      } else {
                        self.dtoverlay(overlay + paramsOld);
                        defer.reject(true);
                      }
                    }
                  });
              } else {
                self.logger.info(self.pluginName + ': Overlay ' + overlay + paramsNew + ' is already loaded.');
                defer.resolve();
              }
            });
        });
    });
  return defer.promise;
};

IrController.prototype.systemctl = function (systemctlCmd) {
  const self = this;
  const defer = libQ.defer();

  exec('/usr/bin/sudo /bin/systemctl ' + systemctlCmd, { uid: 1000, gid: 1000 }, (error, stdout, stderr) => {
    if (error !== null) {
      self.logger.error(self.pluginName + ': Failed to ' + systemctlCmd + ': ' + error);
      self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('IRCONTROLLER.PLUGIN_NAME'), self.commandRouter.getI18nString('IRCONTROLLER.GENERIC_FAILED') + systemctlCmd + ': ' + error);
      defer.reject(error);
    } else {
      self.logger.info(self.pluginName + ': systemctl ' + systemctlCmd + ' succeeded.');
      defer.resolve();
    }
  });
  return defer.promise;
};
