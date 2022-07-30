'use strict';

const path = require('path');
global.jellyfinServerPluginLibRoot = path.resolve(__dirname) + '/lib';

const libQ = require('kew');
const { resolveOnShieldCreated } = require('./lib/mss');
const js = require(jellyfinServerPluginLibRoot + '/js');
const server = require(jellyfinServerPluginLibRoot + '/server');

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
      const serverInfoDefer = libQ.defer();
      js.toast('info', js.getI18n('JELLYFIN_SERVER_LOADING_INFO'));
      server.inspect().then((result) => {
        serverInfoDefer.resolve({
          uiconf,
          serverInfo: result
        });
      });
      return serverInfoDefer.promise;
    })
    .then(({uiconf, serverInfo}) => {
      const infoSectionConf = uiconf.sections[0];

      // Info section
      if (serverInfo.error || !serverInfo.data.State.Running) {
        infoSectionConf.label = js.getI18n('JELLYFIN_SERVER_ERR');
        infoSectionConf.description = serverInfo.error ? 
            js.getI18n('JELLYFIN_SERVER_ERR_FETCH_INFO', serverInfo.message) :
            js.getI18n('JELLYFIN_SERVER_ERR_NOT_RUNNING');
        infoSectionConf.content = [];
      }
      else {
        const thisDevice = js.getDeviceInfo();
        const url = `${thisDevice.host}:8096`;
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

  const doStart = () => {
  js.toast('info', js.getI18n('JELLYFIN_SERVER_STARTING'));
  server.start()
    .then(() => {
      js.toast('success', js.getI18n('JELLYFIN_SERVER_STARTED'));
      this.serverStatus = 'started';
      defer.resolve();
    })
    .catch((e) => {
      js.toast('error', js.getI18n('JELLYFIN_SERVER_ERR_START', js.getErrorMessage('', e, false)));
      defer.reject(e);
    });
  }

  if (this.commandRouter.getPluginEnabled('system_hardware', 'music_services_shield')) {
    js.getLogger().warn('[jellyfin-server] Music Services Shield plugin detected and enabled. Going to start server when shield is created.');
    resolveOnShieldCreated().then((result) => {
      if (result.status === 'created') {
        js.getLogger().warn('[jellyfin-server] Music Services Shield created. Going to start server now.');
      }
      else if (result.status === 'timeout') {
        js.getLogger().warn('[jellyfin-server] Timeout while waiting for Music Services Shield to be created, but going to start server anyway...');
      }
      doStart();
    })
    .catch((e) => {
      js.toast('error', js.getI18n('JELLYFIN_SERVER_ERR_START', js.getErrorMessage('', e, false)));
      defer.reject(e);
    });
  }
  else {
    doStart();
  }

  return defer.promise;
}

ControllerJellyfinServer.prototype.onStop = function () {
  if (this.serverStatus === 'stopped') {
    return libQ.resolve();
  }

  const defer = libQ.defer();

  js.toast('info', js.getI18n('JELLYFIN_SERVER_STOPPING'));
  server.stop()
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

ControllerJellyfinServer.prototype.viewStats = function () {
  const self = this;
  js.toast('info', js.getI18n('JELLYFIN_SERVER_FETCHING_STATS'));
  server.summary().then((result) => {
    if (result.error) {
      js.toast('error', js.getI18n('JELLYFIN_SERVER_ERR_FETCH_STATS', result.message));
      return;
    }
    const {version, status, mem, cpu, size} = result.data;
    const contents = `
    <ul>
      <li>${js.getI18n('JELLYFIN_SERVER_STAT_VERSION')}: ${version}</li>
      <li>${js.getI18n('JELLYFIN_SERVER_STAT_STATUS')}: ${status}</li>
      <li>${js.getI18n('JELLYFIN_SERVER_STAT_CPU')}: ${cpu}</li>
      <li>${js.getI18n('JELLYFIN_SERVER_STAT_MEM')}: ${mem}</li>
      <li>${js.getI18n('JELLYFIN_SERVER_STAT_SIZE')}</li>
      <ul>
        <li>${js.getI18n('JELLYFIN_SERVER_STAT_BASE')}: ${size.base}</li>
        <li>${js.getI18n('JELLYFIN_SERVER_STAT_CONFIG')}: ${size.config}</li>
        <li>${js.getI18n('JELLYFIN_SERVER_STAT_CACHE')}: ${size.cache}</li>
      </ul>
    </ul>
    `;
    const modalData = {
      title: js.getI18n('JELLYFIN_SERVER_STATS'),
      message: contents,
      size: 'lg',
      buttons: [{
         name: 'Close',
         class: 'btn btn-warning',
         emit: 'closeModals',
         payload: ''
      },]
   }
   self.commandRouter.broadcastMessage("openModal", modalData);
  });
}