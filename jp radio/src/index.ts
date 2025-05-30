import libQ from 'kew';
import VConf from 'v-conf';
import JpRadio from './lib/radio';
import { BrowseResult } from './lib/models/BrowseResultModel';

export = ControllerJpRadio;

class ControllerJpRadio {
  private context: any;
  private commandRouter: any;
  private logger: any;
  private configManager: any;
  private config: InstanceType<typeof VConf> | null = null;
  private readonly serviceName = 'jp_radio';
  private appRadio: JpRadio | null = null;

  constructor(context: any) {
    this.context = context;
    this.commandRouter = context.coreCommand;
    this.logger = context.logger;
    this.configManager = context.configManager;
  }

  async restartPlugin(): Promise<void> {
    try {
      await this.onStop();
      await this.onStart();
    } catch {
      this.commandRouter.pushToastMessage('error', 'Restart Failed', 'The plugin could not be restarted.');
    }
  }

  private showRestartModal(): void {
    const message = {
      title: 'Plugin Restart Required',
      message: 'Changes have been made that require the JP Radio plugin to be restarted. Please click the restart button below.',
      size: 'lg',
      buttons: [
        {
          name: this.commandRouter.getI18nString('COMMON.RESTART'),
          class: 'btn btn-info',
          emit: 'callMethod',
          payload: {
            endpoint: 'music_service/jp_radio',
            method: 'restartPlugin',
            data: {}
          }
        },
        {
          name: this.commandRouter.getI18nString('COMMON.CANCEL'),
          class: 'btn btn-info',
          emit: 'closeModals',
          payload: ''
        }
      ]
    };
    this.commandRouter.broadcastMessage('openModal', message);
  }

  async saveServicePort(data: { servicePort: string }): Promise<void> {
    const newPort = Number(data.servicePort);
    if (!isNaN(newPort) && this.config && this.config.get('servicePort') !== newPort) {
      this.config.set('servicePort', newPort);
      this.showRestartModal();
    }
  }

  async saveRadikoAccount(data: { radikoUser: string; radikoPass: string }): Promise<void> {
    if (!this.config) return;
    const updated = ['radikoUser', 'radikoPass'].some(
      (key) => this.config!.get(key) !== (data as any)[key]
    );
    if (updated) {
      this.config.set('radikoUser', data.radikoUser);
      this.config.set('radikoPass', data.radikoPass);
      this.showRestartModal();
    }
  }

  onVolumioStart(): Promise<void> {
    const defer = libQ.defer();
    try {
      const configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
      this.config = new VConf();
      this.config.loadFile(configFile);
      defer.resolve();
    } catch (error) {
      defer.reject(error);
    }
    return defer.promise;
  }
  
  onStart(): Promise<void> {
    const defer = libQ.defer();

    if (!this.config) {
      this.logger.error('Config not initialized onStart');
      defer.reject(new Error('Config not initialized'));
      return defer.promise;
    }

    const radikoUser = this.config.get('radikoUser');
    const radikoPass = this.config.get('radikoPass');
    const servicePort = this.config.get('servicePort') || 9000;
    const account = radikoUser && radikoPass ? { mail: radikoUser, pass: radikoPass } : null;

    this.appRadio = new JpRadio(servicePort, this.logger, account, this.commandRouter);

    this.appRadio.start()
      .then(() => {
        this.addToBrowseSources();
        defer.resolve();
      })
      .catch((err) => {
        this.logger.error('JP_Radio::Failed to start appRadio', err);
        defer.reject(err);
      });

    return defer.promise;
  }

  async onStop(): Promise<void> {
    try {
      if (this.appRadio) await this.appRadio.stop();
    } catch (err) {
      this.logger.error('JP_Radio::Error stopping appRadio', err);
    }
    this.commandRouter.volumioRemoveToBrowseSources('RADIKO');
  }

  getUIConfig(): Promise<any> {
    const defer = libQ.defer();
    const langCode = this.commandRouter.sharedVars.get('language_code') || 'en';

    this.commandRouter.i18nJson(
      `${__dirname}/i18n/strings_${langCode}.json`,
      `${__dirname}/i18n/strings_en.json`,
      `${__dirname}/UIConfig.json`
    )
    .then((uiconf: any) => {
      const servicePort = this.config.get('servicePort');
      const radikoUser = this.config.get('radikoUser');
      const radikoPass = this.config.get('radikoPass');

      if (uiconf.sections?.[0]?.content?.[0]) uiconf.sections[0].content[0].value = servicePort;
      if (uiconf.sections?.[1]?.content?.[0]) uiconf.sections[1].content[0].value = radikoUser;
      if (uiconf.sections?.[1]?.content?.[1]) uiconf.sections[1].content[1].value = radikoPass;

      defer.resolve(uiconf);
    })
    .fail((error: any) => {
      this.logger.error('getUIConfig failed:', error);
      defer.reject(error);
    });

    return defer.promise;
  }

  
  getConfigurationFiles(): string[] {
    return ['config.json'];
  }

  addToBrowseSources(): void {
    this.commandRouter.volumioAddToBrowseSources({
      name: 'RADIKO',
      uri: 'radiko',
      plugin_type: 'music_service',
      plugin_name: this.serviceName,
      albumart: '/albumart?sourceicon=music_service/jp_radio/assets/images/app_radiko.svg'
    });
  }

  async handleBrowseUri(curUri: string): Promise<BrowseResult | {}> {
    const [baseUri] = curUri.split('?');

    if (baseUri === 'radiko') {
      if (!this.appRadio) {
        return {};
      }
      return await this.appRadio.radioStations();
    }

    return {};
  }

  clearAddPlayTrack(track: any): Promise<any> {
    this.logger.info(`[${new Date().toISOString()}] JP_Radio::clearAddPlayTrack`, track);
    return libQ.resolve();
  }

  seek(timepos: number): Promise<any> {
    this.logger.info(`[${new Date().toISOString()}] JP_Radio::seek to ${timepos}`);
    return libQ.resolve();
  }

  stop(): void {
    this.logger.info(`[${new Date().toISOString()}] JP_Radio::stop`);
  }

  pause(): void {
    this.logger.info(`[${new Date().toISOString()}] JP_Radio::pause`);
  }

  getState(): void {
    this.logger.info(`[${new Date().toISOString()}] JP_Radio::getState`);
  }

  parseState(sState: any): void {
    this.logger.info(`[${new Date().toISOString()}] JP_Radio::parseState`);
  }

  pushState(state: any): any {
    this.logger.info(`[${new Date().toISOString()}] JP_Radio::pushState`);
    return this.commandRouter.servicePushState(state, this.serviceName);
  }

  explodeUri(uri: string): Promise<any> {
    return libQ.resolve();
  }

  search(query: any): Promise<any> {
    return libQ.resolve();
  }

  goto(data: any): Promise<any> {
    return libQ.resolve();
  }
}
