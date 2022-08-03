'use strict';

const path = require('path');
global.jellyfinServerPluginLibRoot = path.resolve(__dirname) + '/lib';

const libQ = require('kew');
const { jsPromiseToKew } = require(jellyfinServerPluginLibRoot + '/util');
const js = require(jellyfinServerPluginLibRoot + '/js');
const system = require(jellyfinServerPluginLibRoot + '/system');

module.exports = ControllerJellyfinServer;

function ControllerJellyfinServer(context) {
  this.context = context;
  this.commandRouter = this.context.coreCommand;
  this.logger = this.context.logger;
  this.configManager = this.context.configManager;
  this.serverStatus = 'stopped';
}

ControllerJellyfinServer.prototype.getUIConfig = function () {
  let self = this;
  let defer = libQ.defer();

  let lang_code = self.commandRouter.sharedVars.get('language_code');

  self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
    __dirname + '/i18n/strings_en.json',
    __dirname + '/UIConfig.json')
    .then((uiconf) => {
      return jsPromiseToKew(system.getServiceStatus()).then((status) => [uiconf, status])
    })
    .then(([uiconf, status]) => {
      return jsPromiseToKew(system.getConfig()).then((config) => [uiconf, status, config])
    })
    .then(([uiconf, status, config]) => {
      const infoSectionConf = uiconf.sections[0];

      // Info section
      switch (status) {
        case 'active':
          infoSectionConf.description = js.getI18n('JELLYFIN_SERVER_INFO_DESC_ACTIVE');
          break;
        case 'activating':
          infoSectionConf.description = js.getI18n('JELLYFIN_SERVER_INFO_DESC_ACTIVATING');
          break;
        default:
          infoSectionConf.description = js.getI18n('JELLYFIN_SERVER_INFO_DESC_INACTIVE');
      }

      if (status !== 'active') {
        const viewReadme = infoSectionConf.content[2];
        infoSectionConf.content = [viewReadme];
      }
      else {
        const thisDevice = js.getDeviceInfo();
        const networkConfig = config?.NetworkConfiguration || {};
        const requireHttps = networkConfig.RequireHttps || false;
        const host = requireHttps ? 
          'https://' + thisDevice.host.substring(7) : thisDevice.host
        const port = requireHttps ? 
          (networkConfig.PublicHttpsPort || '8920')
          :
          (networkConfig.PublicPort || '8096');
        const url = `${host}:${port}`;
        infoSectionConf.content[0].value = url;
        infoSectionConf.content[1].onClick.url = url;
      }

      defer.resolve(uiconf);
    })
    .fail((error) => {
      js.getLogger().error('[jellyfin-server] getUIConfig(): Cannot populate Jellyfin Server configuration - ' + error);
      defer.reject(new Error());
    }
    );

  return defer.promise;
}

ControllerJellyfinServer.prototype.onVolumioStart = function () {
  const configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
  this.config = new (require('v-conf'))();
  this.config.loadFile(configFile);

  return libQ.resolve();
}

ControllerJellyfinServer.prototype.onStart = function () {
  const defer = libQ.defer();

  js.init(this.context, this.config);

  js.toast('info', js.getI18n('JELLYFIN_SERVER_STARTING'));
  system.startService()
    .then(() => {
      js.toast('success', js.getI18n('JELLYFIN_SERVER_STARTED'));
      this.serverStatus = 'started';
      defer.resolve();
    })
    .catch((e) => {
      js.toast('error', js.getI18n('JELLYFIN_SERVER_ERR_START', js.getErrorMessage('', e, false)));
      defer.reject(e);
    });

  return defer.promise;
}

ControllerJellyfinServer.prototype.onStop = function () {
  if (this.serverStatus === 'stopped') {
    return libQ.resolve();
  }

  const defer = libQ.defer();

  js.toast('info', js.getI18n('JELLYFIN_SERVER_STOPPING'));
  system.stopService()
    .then(() => {
      js.toast('success', js.getI18n('JELLYFIN_SERVER_STOPPED'));
      this.serverStatus = 'stopped';
      defer.resolve();
    })
    .catch((e) => {
      js.toast('error', js.getI18n('JELLYFIN_SERVER_ERR_STOP', js.getErrorMessage('', e, false)));
      defer.reject(e);
    });

  return defer.promise;
}
