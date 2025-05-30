"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const kew_1 = __importDefault(require("kew"));
const v_conf_1 = __importDefault(require("v-conf"));
const radio_1 = __importDefault(require("./lib/radio"));
class ControllerJpRadio {
    constructor(context) {
        this.config = null;
        this.serviceName = 'jp_radio';
        this.appRadio = null;
        this.context = context;
        this.commandRouter = context.coreCommand;
        this.logger = context.logger;
        this.configManager = context.configManager;
    }
    async restartPlugin() {
        try {
            await this.onStop();
            await this.onStart();
        }
        catch {
            this.commandRouter.pushToastMessage('error', 'Restart Failed', 'The plugin could not be restarted.');
        }
    }
    showRestartModal() {
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
    async saveServicePort(data) {
        const newPort = Number(data.servicePort);
        if (!isNaN(newPort) && this.config && this.config.get('servicePort') !== newPort) {
            this.config.set('servicePort', newPort);
            this.showRestartModal();
        }
    }
    async saveRadikoAccount(data) {
        if (!this.config)
            return;
        const updated = ['radikoUser', 'radikoPass'].some((key) => this.config.get(key) !== data[key]);
        if (updated) {
            this.config.set('radikoUser', data.radikoUser);
            this.config.set('radikoPass', data.radikoPass);
            this.showRestartModal();
        }
    }
    onVolumioStart() {
        const defer = kew_1.default.defer();
        try {
            const configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
            this.config = new v_conf_1.default();
            this.config.loadFile(configFile);
            defer.resolve();
        }
        catch (error) {
            defer.reject(error);
        }
        return defer.promise;
    }
    onStart() {
        const defer = kew_1.default.defer();
        if (!this.config) {
            this.logger.error('Config not initialized onStart');
            defer.reject(new Error('Config not initialized'));
            return defer.promise;
        }
        const radikoUser = this.config.get('radikoUser');
        const radikoPass = this.config.get('radikoPass');
        const servicePort = this.config.get('servicePort') || 9000;
        const account = radikoUser && radikoPass ? { mail: radikoUser, pass: radikoPass } : null;
        this.appRadio = new radio_1.default(servicePort, this.logger, account, this.commandRouter);
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
    async onStop() {
        try {
            if (this.appRadio)
                await this.appRadio.stop();
        }
        catch (err) {
            this.logger.error('JP_Radio::Error stopping appRadio', err);
        }
        this.commandRouter.volumioRemoveToBrowseSources('RADIKO');
    }
    getUIConfig() {
        const defer = kew_1.default.defer();
        const langCode = this.commandRouter.sharedVars.get('language_code') || 'en';
        this.commandRouter.i18nJson(`${__dirname}/i18n/strings_${langCode}.json`, `${__dirname}/i18n/strings_en.json`, `${__dirname}/UIConfig.json`)
            .then((uiconf) => {
            const servicePort = this.config.get('servicePort');
            const radikoUser = this.config.get('radikoUser');
            const radikoPass = this.config.get('radikoPass');
            if (uiconf.sections?.[0]?.content?.[0])
                uiconf.sections[0].content[0].value = servicePort;
            if (uiconf.sections?.[1]?.content?.[0])
                uiconf.sections[1].content[0].value = radikoUser;
            if (uiconf.sections?.[1]?.content?.[1])
                uiconf.sections[1].content[1].value = radikoPass;
            defer.resolve(uiconf);
        })
            .fail((error) => {
            this.logger.error('getUIConfig failed:', error);
            defer.reject(error);
        });
        return defer.promise;
    }
    getConfigurationFiles() {
        return ['config.json'];
    }
    addToBrowseSources() {
        this.commandRouter.volumioAddToBrowseSources({
            name: 'RADIKO',
            uri: 'radiko',
            plugin_type: 'music_service',
            plugin_name: this.serviceName,
            albumart: '/albumart?sourceicon=music_service/jp_radio/assets/images/app_radiko.svg'
        });
    }
    async handleBrowseUri(curUri) {
        const [baseUri] = curUri.split('?');
        if (baseUri === 'radiko') {
            if (!this.appRadio) {
                return {};
            }
            return await this.appRadio.radioStations();
        }
        return {};
    }
    clearAddPlayTrack(track) {
        this.logger.info(`[${new Date().toISOString()}] JP_Radio::clearAddPlayTrack`, track);
        return kew_1.default.resolve();
    }
    seek(timepos) {
        this.logger.info(`[${new Date().toISOString()}] JP_Radio::seek to ${timepos}`);
        return kew_1.default.resolve();
    }
    stop() {
        this.logger.info(`[${new Date().toISOString()}] JP_Radio::stop`);
    }
    pause() {
        this.logger.info(`[${new Date().toISOString()}] JP_Radio::pause`);
    }
    getState() {
        this.logger.info(`[${new Date().toISOString()}] JP_Radio::getState`);
    }
    parseState(sState) {
        this.logger.info(`[${new Date().toISOString()}] JP_Radio::parseState`);
    }
    pushState(state) {
        this.logger.info(`[${new Date().toISOString()}] JP_Radio::pushState`);
        return this.commandRouter.servicePushState(state, this.serviceName);
    }
    explodeUri(uri) {
        return kew_1.default.resolve();
    }
    search(query) {
        return kew_1.default.resolve();
    }
    goto(data) {
        return kew_1.default.resolve();
    }
}
module.exports = ControllerJpRadio;
//# sourceMappingURL=index.js.map