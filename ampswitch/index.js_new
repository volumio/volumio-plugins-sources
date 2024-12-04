'use strict';

// load external modules
var libQ = require('kew');
var io = require('socket.io-client');
const { execSync } = require('child_process');

const socket = io.connect('http://localhost:3000');
// declare global status variable
var status = 'na';

// Define the AmpSwitchController class
module.exports = AmpSwitchController;

function AmpSwitchController(context) {
    var self = this;

    // Save a reference to the parent commandRouter
    self.context = context;
    self.commandRouter = self.context.coreCommand;
    self.logger = self.commandRouter.logger;
    this.configManager = this.context.configManager;

    // Setup Debugger
    self.logger.ASdebug = function(data) {
        self.logger.info('[ASDebug] ' + data);
    };

    // Define shutdown variable
    self.shutdownPin = null;
}

// define behaviour on system start up. In our case just read config file
AmpSwitchController.prototype.onVolumioStart = function() {
    var self = this;
    var configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
    this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);

    return libQ.resolve();
};

// Volumio needs this
AmpSwitchController.prototype.getConfigurationFiles = function() {
    return ['config.json'];
};

// define behaviour on plugin activation
AmpSwitchController.prototype.onStart = function() {
    var self = this;
    var defer = libQ.defer();

    // initialize output port
    self.ampGPIOInit();

    // read and parse status once
    socket.emit('getState', '');
    socket.once('pushState', self.parseStatus.bind(self));

    // listen to every subsequent status report from Volumio
    socket.on('pushState', self.parseStatus.bind(self));

    defer.resolve();
    return defer.promise;
};

// define behaviour on plugin deactivation.
AmpSwitchController.prototype.onStop = function() {
    var self = this;
    var defer = libQ.defer();

    self.logger.ASdebug('Port: ' + self.config.get('port'));
    self.logger.ASdebug('Inverted: ' + self.config.get('inverted'));
    self.logger.ASdebug('Delay: ' + self.config.get('delay'));

    // we don't have to claim GPIOs anymore
    self.freeGPIO();

    return defer.promise;
};

// initialize Plugin settings page
AmpSwitchController.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;
    self.logger.ASdebug('Setting UI defaults');
    self.logger.ASdebug('Port: ' + self.config.get('port'));
    self.logger.ASdebug('Inverted: ' + self.config.get('inverted'));
    self.logger.ASdebug('Latched: ' + self.config.get('latched'));
    self.logger.ASdebug('On pulse width: ' + self.config.get('on_pulse_width'));
    self.logger.ASdebug('Off pulse width: ' + self.config.get('off_pulse_width'));

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
        __dirname + '/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf) {
            uiconf.sections[0].content[0].value.value = self.config.get('port');
            uiconf.sections[0].content[0].value.label = self.config.get('port').toString();
            uiconf.sections[0].content[1].value = self.config.get('inverted');
            uiconf.sections[0].content[2].value = self.config.get('delay');
            uiconf.sections[0].content[3].value = self.config.get('latched');
            uiconf.sections[0].content[4].value = self.config.get('on_pulse_width');
            uiconf.sections[0].content[5].value = self.config.get('off_pulse_width');
            defer.resolve(uiconf);
        })
        .fail(function() {
            defer.reject(new Error());
        });

    return defer.promise;
};

// define what happens when the user clicks the 'save' button on the settings page
AmpSwitchController.prototype.saveOptions = function(data) {
    var self = this;
    var successful = true;
    var old_port = self.config.get('port');

    // save port setting to our config
    self.logger.ASdebug('Saving Settings: Port: ' + data['port_setting']['value']);
    self.logger.ASdebug('Saving Settings: Inverted: ' + data['inverted_setting']);
    self.logger.ASdebug('Saving Settings: Delay: ' + data['delay_setting']);
    self.logger.ASdebug('Saving Settings: Latched: ' + data['latched_setting']);
    self.logger.ASdebug('Saving Settings: On Pulse width: ' + data['on_pulse_width_setting']);
    self.logger.ASdebug('Saving Settings: Off Pulse width: ' + data['off_pulse_width_setting']);

    self.config.set('port', data['port_setting']['value']);
    self.config.set('inverted', data['inverted_setting']);
    self.config.set('delay', data['delay_setting']);
    self.config.set('latched', data['latched_setting']);
    self.config.set('on_pulse_width', data['on_pulse_width_setting']);
    self.config.set('off_pulse_width', data['off_pulse_width_setting']);

    // unexport GPIOs before constructing new GPIO object
    self.freeGPIO();
    try {
        self.ampGPIOInit();
    } catch (err) {
        successful = false;
    }
    if (successful) {
        self.commandRouter.pushToastMessage('success', 'Amplifier Switch Settings', 'Saved');
    } else {
        self.config.set('port', old_port);
        self.commandRouter.pushToastMessage('error', 'Port not accessible', '');
    }
};

// initialize shutdown port to the one that we stored in the config
AmpSwitchController.prototype.ampGPIOInit = function() {
    var self = this;
    self.shutdownPin = self.config.get('port');
    self.logger.ASdebug(`Initializing GPIO pin: ${self.shutdownPin}`);
};

// a pushState event has happened. Check whether it differs from the last known status and
// switch output port on or off respectively
AmpSwitchController.prototype.parseStatus = function(state) {
    var self = this;
    var delay = self.config.get('delay');
    self.logger.ASdebug('CurState: ' + state.status + ' PrevState: ' + status);

    clearTimeout(self.OffTimerID);
    if ((state.status != 'pause' && state.status != 'stop') && state.status != status) {
        status = state.status;
        self.config.get('latched') ? self.pulse(self.config.get('on_pulse_width')) : self.on();
    } else if ((state.status == 'pause' || state.status == 'stop') && (status != 'pause' && status != 'stop')) {
        self.logger.ASdebug('InitTimeout - Amp off in: ' + delay + ' ms');
        self.OffTimerID = setTimeout(function() {
            status = state.status;
            self.config.get('latched') ? self.pulse(self.config.get('off_pulse_width')) : self.off();
        }, delay);
    }
};

// switch output port on
AmpSwitchController.prototype.on = function() {
    var self = this;

    self.logger.ASdebug('Toggle GPIO: ON');
    if (!self.config.get('inverted')) {
        execSync(`gpioset /dev/gpiochip0 ${self.shutdownPin}=1`);
    } else {
        execSync(`gpioset /dev/gpiochip0 ${self.shutdownPin}=0`);
    }
};

// switch output port off
AmpSwitchController.prototype.off = function() {
    var self = this;

    self.logger.ASdebug('Toggle GPIO: OFF');
    if (!self.config.get('inverted')) {
        execSync(`gpioset /dev/gpiochip0 ${self.shutdownPin}=0`);
    } else {
        execSync(`gpioset /dev/gpiochip0 ${self.shutdownPin}=1`);
    }
};

// trigger a pulse, this is equivalent to the usual low-to-high-to-low cycle
AmpSwitchController.prototype.pulse = function(width) {
    var self = this;
    self.logger.ASdebug('Trigger Pulse');
    self.on();
    setTimeout(self.off.bind(self), width);
};

// free GPIO resources
AmpSwitchController.prototype.freeGPIO = function() {
    var self = this;
    execSync(`gpio unexport ${self.shutdownPin}`);
};

