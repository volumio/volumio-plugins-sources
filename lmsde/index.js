'use strict';

const path = require('path');
global.LMSDEPluginLibRoot = path.resolve(__dirname) + '/lib';

const libQ = require('kew');
const { resolveOnShieldCreated } = require('./lib/mss');
const js = require(LMSDEPluginLibRoot + '/lmsde');
const server = require(LMSDEPluginLibRoot + '/server');

module.exports = ControllerLMS;

function ControllerLMS(context) {
  this.context = context;
  this.commandRouter = this.context.coreCommand;
  this.logger = this.context.logger;
  this.configManager = this.context.configManager;
  this.serverStatus = 'stopped';
}

ControllerLMS.prototype.getUIConfig = function () {
  let self = this;
  let defer = libQ.defer();

  let lang_code = self.commandRouter.sharedVars.get('language_code');

  self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
    __dirname + '/i18n/strings_en.json',
    __dirname + '/UIConfig.json')
    .then((uiconf) => {
      const serverInfoDefer = libQ.defer();
      js.toast('info', js.getI18n('LMSDE_LOADING_INFO'));
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
        infoSectionConf.label = js.getI18n('LMSDE_ERR');
        infoSectionConf.description = serverInfo.error ? 
            js.getI18n('LMSDE_ERR_FETCH_INFO', serverInfo.message) :
            js.getI18n('LMSDE_ERR_NOT_RUNNING');
        infoSectionConf.content = [];
      }
      else {
        const thisDevice = js.getDeviceInfo();
        const url = `${thisDevice.host}:9000`;
        infoSectionConf.content[0].value = url;
        infoSectionConf.content[1].onClick.url = url;

      }

      defer.resolve(uiconf);
    })
    .fail((error) => {
      js.getLogger().error('[lmsde] getUIConfig(): Cannot populate Logitech Media Server - Docker Edition configuration - ' + error);
      defer.reject(new Error());
    }
    );

  return defer.promise;
}

ControllerLMS.prototype.onVolumioStart = function () {
  const configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
  this.config = new (require('v-conf'))();
  this.config.loadFile(configFile);

  return libQ.resolve();
}

ControllerLMS.prototype.onStart = function () {
  const defer = libQ.defer();

  js.init(this.context, this.config);

  const doStart = () => {
    js.toast('info', js.getI18n('LMSDE_STARTING'));
    server.start()
      .then(() => {
        js.toast('success', js.getI18n('LMSDE_STARTED'));
        this.serverStatus = 'started';
        defer.resolve();
      })
      .catch((e) => {
        js.toast('error', js.getI18n('LMSDE_ERR_START', js.getErrorMessage('', e, false)));
        defer.reject(e);
      });
  }

  if (this.commandRouter.getPluginEnabled('system_hardware', 'music_services_shield')) {
    js.getLogger().warn('[lmsde] Music Services Shield plugin detected and enabled. Going to start LMS when shield is created.');
    resolveOnShieldCreated().then((result) => {
      if (result.status === 'created') {
        js.getLogger().warn('[lmsde] Music Services Shield created. Going to start LMS now.');
      }
      else if (result.status === 'timeout') {
        js.getLogger().warn('[lmsde] Timeout while waiting for Music Services Shield to be created, but going to start LMS anyway...');
      }
      doStart();
    })
    .catch((e) => {
      js.toast('error', js.getI18n('LMSDE_ERR_START', js.getErrorMessage('', e, false)));
      defer.reject(e);
    });
  }
  else {
    doStart();
  }

  return defer.promise;
}

ControllerLMS.prototype.onStop = function () {
  if (this.serverStatus === 'stopped') {
    return libQ.resolve();
  }

  const defer = libQ.defer();

  js.toast('info', js.getI18n('LMSDE_STOPPING'));
  server.stop()
    .then(() => {
      js.toast('success', js.getI18n('LMSDE_STOPPED'));
      this.serverStatus = 'stopped';
      defer.resolve();
    })
    .catch((e) => {
      js.toast('error', js.getI18n('LMSDE_ERR_STOP', js.getErrorMessage('', e, false)));
      defer.reject(e);
    });

  return defer.promise;
}

ControllerLMS.prototype.viewStats = function () {
  const self = this;
  js.toast('info', js.getI18n('LMSDE_FETCHING_STATS'));
  server.summary().then((result) => {
    if (result.error) {
      js.toast('error', js.getI18n('LMSDE_ERR_FETCH_STATS', result.message));
      return;
    }
    const {version, status, mem, cpu, size} = result.data;
    const contents = `
    <ul>
      <li>${js.getI18n('LMSDE_STAT_VERSION')}: ${version}</li>
      <li>${js.getI18n('LMSDE_STAT_STATUS')}: ${status}</li>
      <li>${js.getI18n('LMSDE_STAT_CPU')}: ${cpu}</li>
      <li>${js.getI18n('LMSDE_STAT_MEM')}: ${mem}</li>
      <li>${js.getI18n('LMSDE_STAT_SIZE')}</li>
      <ul>
        <li>${js.getI18n('LMSDE_STAT_BASE')}: ${size.base}</li>
        <li>${js.getI18n('LMSDE_STAT_CONFIG')}: ${size.config}</li>
        <li>${js.getI18n('LMSDE_STAT_PLAYLIST')}: ${size.playlist}</li>
      </ul>
    </ul>
    `;
    const modalData = {
      title: js.getI18n('LMSDE_STATS'),
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