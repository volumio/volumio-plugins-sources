'use strict';

let libQ = require('kew');
let fs = require('fs-extra');
let config = new (require('v-conf'))();

module.exports = AutoStart;

function AutoStart(context) {
    // This fixed variable will let us refer to 'this' object at deeper scopes
    const self = this;

    this.context = context;
    this.commandRouter = this.context.coreCommand;
    this.logger = this.context.logger;
    this.configManager = this.context.configManager;
}

AutoStart.prototype.onVolumioStart = function () {

    this.logger.info('AutoStart - onVolumioStart -  read config.json');

    const configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
    this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);

    return libQ.resolve();
}

AutoStart.prototype.onStart = function () {
    const self = this;
    const defer = libQ.defer();

    this.logger.info('AutoStart - onStart');

    const playFromLastPosition = this.config.get('playFromLastPosition') || false;
    const lastPosition = this.config.get('lastPosition') || -1;
    const autostartDelay = this.config.get('autostartDelay') || 20000;

    setTimeout(function () {

            self.logger.info('AutoStart - Plugin is starting');

            let queue = self.commandRouter.volumioGetQueue();
            if (queue && queue.length > 0) {

                self.logger.info('AutoStart - start playing');

                if (playFromLastPosition === true && lastPosition !== -1) {

                    self.logger.info('AutoStart - start playing from position ' + lastPosition);
                    self.commandRouter.volumioPlay(lastPosition);

                } else {

                    self.logger.info('AutoStart - start playing with no specific position');
                    self.commandRouter.volumioPlay(0);
                }
            }
        },
        autostartDelay);

    // Once the Plugin has successfull started resolve the promise
    defer.resolve();

    return defer.promise;
};

AutoStart.prototype.onStop = function () {
    const self = this;

    this.logger.info('AutoStart - onStop');

    if (this.config.get('playFromLastPosition') === true) {

        const state = this.commandRouter.volumioGetState();

        if (state && state.position) {

            this.logger.info('AutoStart - save lastPosition');
            this.config.set('lastPosition', state.position);
            // force dump to disk or config will not be saved before shutdown
            this.config.save();
        }
    }

    return libQ.resolve();
};

// Configuration Methods -----------------------------------------------------------------------------

AutoStart.prototype.getUIConfig = function () {
    const self = this;
    const defer = libQ.defer();

    this.logger.info('AutoStart - getUIConfig');

    const lang_code = this.commandRouter.sharedVars.get('language_code');

    this.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
        __dirname + '/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function (uiconf) {

            uiconf.sections[0].content[0].value = self.config.get('playFromLastPosition');
            uiconf.sections[0].content[1].value = self.config.get('autostartDelay');

            defer.resolve(uiconf);
        })
        .fail(function () {
            self.logger.error('AutoStart - Failed to parse UI Configuration page: ' + error);
            defer.reject(new Error());
        });

    return defer.promise;
};

AutoStart.prototype.saveOptions = function (data) {
    const self = this;

    this.logger.info('AutoStart - saving settings');

    const playFromLastPosition = data['playFromLastPosition'] || false;
    const autostartDelay = data['autostartDelay'] || 20000;
    this.config.set('playFromLastPosition', playFromLastPosition);
    this.config.set('autostartDelay', autostartDelay);

    this.commandRouter.pushToastMessage('success', 'AutoStart', this.commandRouter.getI18nString("COMMON.CONFIGURATION_UPDATE_DESCRIPTION"));

    this.logger.info('AutoStart - settings saved');

    return libQ.resolve();
};

AutoStart.prototype.getConfigurationFiles = function () {
    return ['config.json'];
}
