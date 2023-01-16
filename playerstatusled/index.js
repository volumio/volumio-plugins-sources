'use strict';

var libQ = require('kew');
var fs = require('fs-extra');
var gpio = require('onoff').Gpio;
var io = require('socket.io-client');

var socket;	// local volumio web socket 
var led;	// led that indicates status

const pluginName = 'PlayerStatusLed';	// this plugin name string used in messages.

module.exports = StatusLedController;

function StatusLedController(context) {
	var self = this;

	self.context = context;
	self.commandRouter = self.context.coreCommand;
	self.logger = self.context.logger;
	self.configManager = self.context.configManager;
}

StatusLedController.prototype.onVolumioStart = function () {
    var self = this;
	
    var configFile = self.commandRouter.pluginManager.getConfigurationFile(self.context, 'config.json');
	self.config = new (require('v-conf'))(); // this needs to be here to load config, not in global var declarations.
    self.config.loadFile(configFile);
	self.log('Initialized');
	
    return libQ.resolve();
};

StatusLedController.prototype.onStart = function () {
    var self = this;
    var defer = libQ.defer();

	self.load18nStrings();
	socket = io.connect('http://localhost:3000');

    self.initLed();

	// read and parse status once
	socket.emit('getState', '');
	socket.once('pushState', self.statusChanged.bind(self));

	// listen to every subsequent status report from Volumio
	socket.on('pushState', self.statusChanged.bind(self));

    // Once the Plugin has successfully started resolve the promise
    defer.resolve();
    return defer.promise;
};

StatusLedController.prototype.onStop = function () {
    var self = this;

	if(led?.timerId) {
		clearInterval(led.timerId);
	}
        
	socket.off('pushState'); // socket.off() removes all listeners
	socket.disconnect();

    self.releaseLed();

    return libQ.resolve();
};

// Player status has changed (might not always be play or pause action)
StatusLedController.prototype.statusChanged = function (state) {
    var self = this;

	//self.log(`player state update: ${led.playerState} -> ${state.status}`); // DEBUGGING only

	// status updates come async by other plugin requests, avoid processing when no change happened
	if (led.playerState == state.status) {
		return;
	}

	self.log(`player state update: ${led.playerState} -> ${state.status}`);

    switch (state.status) {
        case 'play':
            self.log('turning LED on');
			if(led.timerId) {
				clearInterval(led.timerId); // stop blinking before turning LED on
			}
			led.write(1)
				.catch(err => self.log(err));
            break;
        case 'pause': // BUG: volumio allows pause command on web streams. Resuming with play does not produce status update. Exit-stop.
			self.log('starting to blink LED');
            led.timerId = setInterval( function() {
				led.read()
					.then(value => led.write(value ^ 1))
					.catch(err => {
						self.log(err);
						clearInterval(led.timerId); // plugin may be disabled or GPIO unexported during blinking.
					})
				}, led.delay);
            break;
        default:
            self.log('turning LED off');
            if(led.timerId) {
				clearInterval(led.timerId);
			}
			led.write(0)
				.catch(err => self.log(err));
	}
	
	led.playerState = state.status; // store new state
};

// initialize LED gpio to the one stored in the config
StatusLedController.prototype.initLed = function() {
    var self = this;

    self.log('initializing GPIO');
    led = new gpio(self.config.get('gpionum'), 'out');
	led.timerId; // store blinker timer reference here
	led.playerState; // player state before state change.
	led.delay = self.config.get('interval');	// blink interval
	led.setActiveLow(self.config.get('activestate'));
};

// initialize LED gpio to the one stored in the config
StatusLedController.prototype.releaseLed = function() {
    var self = this;

    self.log('releasing GPIO');
	try {
        led.unexport(); // something else may have unexported this GPIO, fatal error. Unexport is synchronous.
    } catch(err) {
		self.log('releasing GPIO: ' + err);
    }
};

// Output to log
StatusLedController.prototype.log = function(s) {
	var self = this;
	self.logger.info(`[${pluginName}] ${s}`);
}

// Settings Methods -----------------------------------------------------------------------------

StatusLedController.prototype.saveSettings = function (data) {
    var self = this;
    var defer = libQ.defer();

	try {	
		if (isNaN(data['gpionum']) || data['gpionum'] < 0 || data['gpionum'] > 200) {
			throw new Error (self.getI18nString('GPIONUM_LBL') + self.getI18nString('ERROR_OUT_OF_RANGE_TITLE') + '. ' + self.getI18nString('ERROR_OUT_OF_RANGE_MESSAGE') + '0 - 200' );
		}
		
		if (isNaN(data['activestate']) || data['activestate'] < 0 || data['activestate'] > 1) {
			throw new Error (self.getI18nString('ACTIVESTATE_LBL') + self.getI18nString('ERROR_OUT_OF_RANGE_TITLE') + '. ' + self.getI18nString('ERROR_OUT_OF_RANGE_MESSAGE') + '0 - 1' );
		}
		
		if (isNaN(data['interval']) || data['interval'] < 100 || data['interval'] > 10000) {
			throw new Error (self.getI18nString('INTERVAL_LBL') + self.getI18nString('ERROR_OUT_OF_RANGE_TITLE') + '. ' + self.getI18nString('ERROR_OUT_OF_RANGE_MESSAGE') + '100 - 10000' );
		}

		self.config.set('gpionum', data['gpionum']);
		self.config.set('activestate', data['activestate']);
		self.config.set('interval', data['interval']); // numeric params do not need ['value']

		self.releaseLed(); // unexport GPIO before constructing new GPIO object. This wll not throw if not exported.
		self.initLed();
	
		self.commandRouter.pushToastMessage('success', self.getI18nString('SUCCESS_TITLE'), self.getI18nString('SUCCESS_MESSAGE'));

    } catch(err) { // some errors require toString() to be properly displayed by the toast msg.
		self.commandRouter.pushToastMessage('error', self.getI18nString('ERROR_MESSAGE'), err.toString());
    }

    defer.resolve();

    return defer.promise;
};

StatusLedController.prototype.load18nStrings = function () {
    var self = this;

    try {
        var language_code = this.commandRouter.sharedVars.get('language_code');
        self.i18nStrings = fs.readJsonSync(__dirname + '/i18n/strings_' + language_code + '.json');
    } catch (e) {
        self.i18nStrings = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
    }

    self.i18nStringsDefaults = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
};

StatusLedController.prototype.getI18nString = function (key) {
    var self = this;

    if (self.i18nStrings[key] !== undefined)
        return self.i18nStrings[key];
    else
        return self.i18nStringsDefaults[key];
};

// Configuration Methods -----------------------------------------------------------------------------
StatusLedController.prototype.getUIConfig = function () {
    var self = this;
	var defer = libQ.defer();

    const lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {
			uiconf.sections[0].content[0].value = self.config.get('gpionum', 22);
			uiconf.sections[0].content[1].value = self.config.get('activestate', 0);
            uiconf.sections[0].content[2].value = self.config.get('interval', 500);
            defer.resolve(uiconf);
        })
        .fail(function(err)
        {
            self.logger.error(`Failed to parse UI Configuration page for plugin ${pluginName}: ${err}`); 
			defer.reject(err);
        });

    return defer.promise;
};

StatusLedController.prototype.getConfigurationFiles = function () {
	return ['config.json'];
};

StatusLedController.prototype.updateUIConfig = function () {
  var self = this;

  self.commandRouter.getUIConfigOnPlugin('system_hardware', 'playerstatusled', {})
    .then(function (uiconf) {
      self.commandRouter.broadcastMessage('pushUiConfig', uiconf);
    });
  self.commandRouter.broadcastMessage('pushUiConfig');
};