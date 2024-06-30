'use strict';

// Logging: sudo journalctl -f
const logging = false;

// I used tomatpasser's gpio-buttons plugin as a basis for this project
const libQ = require("kew");
const fs = require("fs-extra");
const gpiox = require("@iiot2k/gpiox");
const config = new (require("v-conf"))();
const io = require('socket.io-client');
const sleep = require('sleep');
const socket = io.connect("http://localhost:3000");
const execSync = require('child_process').execSync;

// gpiox library
// https://www.npmjs.com/package/@iiot2k/gpiox?activeTab=readme

// Duration enum
const DURATION = {
	HOURS: 0,
	MINUTES: 1,
	SECONDS: 2,
	MILLISECONDS: 3
}

// State enum
const STATE = {
	PLAY: "play",
	PAUSE: "pause",
	STOP: "stop"
};

// Events enum
const EVENT = {
	SYSTEM_STARTUP: "systemStartup",
	SYSTEM_SHUTDOWN: "systemShutdown",
	MUSIC_PLAY: "musicPlay",
	MUSIC_PAUSE: "musicPause",
	MUSIC_STOP: "musicStop",
	MUTE_ON: "muteOn",
	MUTE_OFF: "muteOff",
	RANDOM_ON: "randomOn",
	RANDOM_OFF: "randomOff",
	REPEAT_ON: "repeatOn",
	REPEAT_OFF: "repeatOff",
	REPEAT_ALL_ON: "repeatAllOn",
	REPEAT_ALL_OFF: "repeatAllOff",
	REPEAT_SINGLE_ON: "repeatSingleOn",
	REPEAT_SINGLE_OFF: "repeatSingleOff"	
};

// Events that we can detect and do something
const events = [
	EVENT.SYSTEM_STARTUP, 
	EVENT.SYSTEM_SHUTDOWN, 
	EVENT.MUSIC_PLAY, 
	EVENT.MUSIC_PAUSE, 
	EVENT.MUSIC_STOP, 
	EVENT.MUTE_ON, 
	EVENT.MUTE_OFF, 
	EVENT.RANDOM_ON, 
	EVENT.RANDOM_OFF, 
	EVENT.REPEAT_ON, 
	EVENT.REPEAT_ALL_ON, 
	EVENT.REPEAT_ALL_OFF, 
	EVENT.REPEAT_SINGLE_ON, 
	EVENT.REPEAT_SINGLE_OFF,
	EVENT.REPEAT_OFF
];

module.exports = GPIOControl;

// Constructor
function GPIOControl(context) {
	const self = this;

	self.context = context;
	self.commandRouter = self.context.coreCommand;
	self.logger = self.context.logger;
	self.load18nStrings();
	self.GPIOs = [];
	self.previousState = "";
}

// Volumio is starting
GPIOControl.prototype.onVolumioStart = function(){
	const self = this;
	const configFile = self.commandRouter.pluginManager.getConfigurationFile(self.context, "config.json");
	
	config.loadFile(configFile);

	return libQ.resolve();
}

// Volumio is shutting down
GPIOControl.prototype.onVolumioShutdown = function() {
	const self = this;

	self.handleEvent(EVENT.SYSTEM_SHUTDOWN);

	return libQ.resolve();
};

// Return config filename
GPIOControl.prototype.getConfigurationFiles = function() {
	return ["config.json"];
}

// Plugin has started
GPIOControl.prototype.onStart = function() {
	const self = this;
	const defer = libQ.defer();

	// read and parse status once
	socket.emit("getState", "");
	socket.once("pushState", self.statusChanged.bind(self));

	// listen to every subsequent status report from Volumio
	// status is pushed after every playback action, so we will be
	// notified if the status changes
	socket.on("pushState", self.statusChanged.bind(self));

	// Create pin objects
	self.createGPIOs()
	.then ((result) => {
		self.log("GPIOs created");
		self.handleEvent(EVENT.SYSTEM_STARTUP);

		defer.resolve();
	});

	return defer.promise;
};

// Plugin has stopped
GPIOControl.prototype.onStop = function() {
	const self = this;
	const defer = libQ.defer();

	self.clearGPIOs()
	.then ((result) => {
		self.log("GPIOs destroyed");
		defer.resolve();
	});

	return libQ.resolve();
};

// The usual plugin guff :p
GPIOControl.prototype.onRestart = function() {};
GPIOControl.prototype.onInstall = function () {};
GPIOControl.prototype.onUninstall = function () {};
GPIOControl.prototype.getConf = function (varName) {};
GPIOControl.prototype.setConf = function(varName, varValue) {};
GPIOControl.prototype.getAdditionalConf = function (type, controller, data) {};
GPIOControl.prototype.setAdditionalConf = function () {};
GPIOControl.prototype.setUIConfig = function (data) {};

// Read config from UI
GPIOControl.prototype.getUIConfig = function() {
	const defer = libQ.defer();
	const self = this;
	const lang_code = self.commandRouter.sharedVars.get("language_code");
	const UIConfigFile = __dirname + "/UIConfig.json";

	self.commandRouter.i18nJson(
		__dirname + "/i18n/strings_" + lang_code + ".json",
		__dirname + "/i18n/strings_en.json",
		UIConfigFile
	)
	.then((uiconf) => {
		events.forEach((e) => {

			// Strings for data fields
			const enabled = e.concat("Enabled");
			const pin = e.concat("Pin");
			const state = e.concat("State");
			const delay = e.concat("Delay");
			const delayUnits = e.concat("DelayUnits");
			const duration = e.concat("Duration");
			const durationUnits = e.concat("DurationUnits");

			// Strings for config
			const configEnabled = e.concat(".enabled");
			const configPin = e.concat(".pin");
			const configState = e.concat(".state");
			const configDelay = e.concat(".delay");
			const configDelayUnits = e.concat(".delayUnits");
			const configDuration = e.concat(".duration");
			const configDurationUnits = e.concat(".durationUnits");

			// Extend the find method on the content array - mental but works
			uiconf.sections[0].content.findItem = function(obj) {
				return this.find(function(item) {
					for (const prop in obj)
						if (!(prop in item) || obj[prop] !== item[prop])
							return false;
					return true;
				});
			}

			// Populate our controls
			self.setSwitchElement(uiconf, enabled, config.get(configEnabled)); // event on/off
			self.setSelectElementStr(uiconf, pin, config.get(configPin)); // GPIO pin
			self.setSelectElement(uiconf, state, config.get(configState), self.boolToString(config.get(configState))); // state
			self.setSelectElement(uiconf, delay, config.get(configDelay), self.delayToString(config.get(configDelay))); // delay
			self.setSelectElement(uiconf, delayUnits, config.get(configDelayUnits), self.unitsToString(config.get(configDelayUnits))); // delay units
			self.setSelectElement(uiconf, duration, config.get(configDuration), self.durationToString(config.get(configDuration))); // duration
			self.setSelectElement(uiconf, durationUnits, config.get(configDurationUnits), self.unitsToString(config.get(configDurationUnits))); // duration units
		});

		defer.resolve(uiconf);
	})
	.fail(function()
	{
		defer.reject(new Error());
	});

	return defer.promise;
};

// Save config
GPIOControl.prototype.saveConfig = function(data){
	const self = this;

	self.clearGPIOs();

	// Loop through standard events
	events.forEach((item) => {

		// Element names
		const enabled = item.concat("Enabled");
		const pin = item.concat("Pin");
		const state = item.concat("State");
		const delay = item.concat("Delay");
		const delayUnits = item.concat("DelayUnits");
		const duration = item.concat("Duration");
		const durationUnits = item.concat("DurationUnits");

		// Save config
		config.set(item.concat(".enabled"), data[enabled]);
		config.set(item.concat(".pin"), data[pin]["value"]);
		config.set(item.concat(".state"), data[state]["value"]);
		config.set(item.concat(".delay"), data[delay]["value"]);
		config.set(item.concat(".delayUnits"), data[delayUnits]["value"]);
		config.set(item.concat(".duration"), data[duration]["value"]);
		config.set(item.concat(".durationUnits"), data[durationUnits]["value"]);
	});

	// Clear any previous states
	self.previousState = "";

	self.log("Saving config");
	self.createGPIOs();

	// Pins have been reset so fire off system startup
	self.handleEvent(EVENT.SYSTEM_STARTUP);

	// Retrieve playing status
	socket.emit("getState", "");

	// Display toaster message
	self.commandRouter.pushToastMessage("success", self.getI18nString("PLUGIN_CONFIGURATION"), self.getI18nString("SETTINGS_SAVED"));
};

// Create GPIO objects for future events
GPIOControl.prototype.createGPIOs = function() {
	const self = this;

	self.log("Reading config and creating GPIOs");

	events.forEach((e) => {
		const configEnabled = e.concat(".enabled");
		const configPin = e.concat(".pin");
		const configState = e.concat(".state");
		const configDelay = e.concat(".delay");
		const configDelayUnits = e.concat(".delayUnits");	
		const configDuration = e.concat(".duration");
		const configDurationUnits = e.concat(".durationUnits");	

		const enabled = config.get(configEnabled);
		const pin = config.get(configPin);
		const state = config.get(configState);
		const delay = self.getDurationMs(config.get(configDelay), config.get(configDelayUnits));
		const delayUnits = self.unitsToString(config.get(configDelayUnits));
		const duration = self.getDurationMs(config.get(configDuration), config.get(configDurationUnits));
		const durationUnits = self.unitsToString(config.get(configDurationUnits));

		if (enabled){
			var msg = `On ${e} will set GPIO ${pin} to ${self.boolToString(state)}`;

			if (delay > 0){
				msg += ` after ${config.get(configDelay)} ${delayUnits} delay`;
			}
			if (duration > 0){
				msg += ` for ${config.get(configDuration)} ${durationUnits}`;
			}

			self.log(msg);

			const gpio = {
				e: e,
				state: state ? 1 : 0,
				pin: pin,
				delay: delay,
				duration: duration,
				delayTimeoutId: 0,
				durationTimeoutId: 0
			};

			self.GPIOs.push(gpio);

			// Default state for GPIO is off
			gpiox.init_gpio(pin, gpiox.GPIO_MODE_OUTPUT, 0);
		}
	});

	return libQ.resolve();
};

// Calculate duration given a number and units
GPIOControl.prototype.getDurationMs = function (number, units) {
	switch (units){
		case 0: // hours;
			return number * 1000 * 60 * 60;
		case 1: // minutes;
			return number * 1000 * 60;
		case 2: // seconds;
			return number * 1000;
	};

	return number;
}

// Release our GPIO objects
GPIOControl.prototype.clearGPIOs = function () {
	const self = this;

	self.GPIOs.forEach((gpio) => {
		clearTimeout(gpio.delayTimeoutId);
		clearTimeout(gpio.durationTimeoutId);
		self.log("Destroying GPIO " + gpio.pin);
		gpiox.deinit_gpio(gpio.pin);
	});

	self.GPIOs = [];

	return libQ.resolve();
};

// Playing status has changed, more than one thing might have changed
// https://volumio.github.io/docs/API/REST_API.html
GPIOControl.prototype.statusChanged = function(state) {
	const self = this;

	self.log(`Status changed: ${state.status}`);

	// Player status
	if (state.status == STATE.PLAY && self.previousState.status != STATE.PLAY){
		self.handleEvent(EVENT.MUSIC_PLAY);
	}
	if (state.status == STATE.PAUSE && self.previousState.status != STATE.PAUSE){
		self.handleEvent(EVENT.MUSIC_PAUSE);
	}
	if (state.status == STATE.STOP && self.previousState.status != STATE.STOP){
		self.handleEvent(EVENT.MUSIC_STOP);
	}

	// mute
	if (state.mute && !self.previousState.mute){
		self.handleEvent(EVENT.MUTE_ON);
	}
	if (!state.mute && self.previousState.mute){
		self.handleEvent(EVENT.MUTE_OFF);
	}
	
	// randomize
	if (state.random && !self.previousState.random){
		self.handleEvent(EVENT.RANDOM_ON);
	}
	if (!state.random && self.previousState.random){
		self.handleEvent(EVENT.RANDOM_OFF);
	}
	
	// Handle any repeat events
	if (!self.previousState){
		if (state.repeat){
			self.handleEvent(EVENT.REPEAT_ON);
		}
		if (state.repeat && !state.repeatSingle){
			self.handleEvent(EVENT.REPEAT_ALL_ON);
		}
		if (!state.repeat && !state.repeatSingle){
			self.handleEvent(EVENT.REPEAT_ALL_OFF);
		}
		if (state.repeat && state.repeatSingle){
			self.handleEvent(EVENT.REPEAT_SINGLE_ON);
		}
		if (!state.repeat && state.repeatSingle){
			self.handleEvent(EVENT.REPEAT_SINGLE_OFF);        
		}
		if (!state.repeat){
			self.handleEvent(EVENT.REPEAT_OFF);
		}
	}
	else{
		if (state.repeat && !self.previousState.repeat){
			self.handleEvent(EVENT.REPEAT_ON);
		}
		
		// repeat all
		if (state.repeat && !state.repeatSingle && (!self.previousState.repeat || self.previousState.repeatSingle)){
			self.handleEvent(EVENT.REPEAT_ALL_ON);
		}
		
		// repeat single
		if (state.repeat && state.repeatSingle && (!self.previousState.repeat || !self.previousState.repeatSingle)){
			self.handleEvent(EVENT.REPEAT_SINGLE_ON);
		}

		if (!state.repeat && self.previousState.repeat){
			self.handleEvent(EVENT.REPEAT_OFF);
			if (self.previousState.repeatSingle){
				self.handleEvent(EVENT.REPEAT_SINGLE_OFF); 
			}
			else{
				self.handleEvent(EVENT.REPEAT_ALL_OFF);
			}
		}
	}

	// Remember previous state
	self.previousState = state;
}

// An event has happened so do something about it
GPIOControl.prototype.handleEvent = function(e) {
	const self = this;

	self.log(`Handling event: ${e}`);

	self.GPIOs.forEach((gpio) => {
		if (gpio.e == e){

			// Clear any timers that act on the same pin
			self.GPIOs.forEach((g) => {
				if (g.pin == gpio.pin) {
					clearTimeout(g.delayTimeoutId);
					clearTimeout(g.durationTimeoutId);
				}
			});

			self.log(`*** ${e} ***`);
			if (gpio.delay > 0){
				self.log(`Delaying: ${gpio.delay}ms`);
			}

			// Create a delay to writing to GPIO
			gpio.delayTimeoutId = setTimeout(() => {
				self.log(`Turning GPIO ${gpio.pin} ${self.boolToString(gpio.state)} (${e})`);

				gpiox.set_gpio(gpio.pin, gpio.state);

				// If a duration has been specified then write to GPIO after specified duration
				if (gpio.duration > 0){

					self.log(`Delaying: ${gpio.duration}ms`);

					// Create timeout to pull GPIO
					gpio.durationTimeoutId = setTimeout(() => {
						self.log(`Turning GPIO ${gpio.pin} ${self.boolToString(!gpio.state)} (${e})`);
						gpiox.set_gpio(gpio.pin, !gpio.state);
					}, gpio.duration);
				}
			}, gpio.delay);

			// Shutdown after a short wait
			if (e == EVENT.SYSTEM_SHUTDOWN){
				sleep.sleep(5);
			}
		}
	});
}

// Output to log
GPIOControl.prototype.log = function(s) {
	const self = this;

	if (!logging){
		return;
	}

	self.logger.info(`[GPIO_Control] ${s}`);
}

// Function for printing booleans
GPIOControl.prototype.boolToString = function(value){
	const self = this;

	return value ? self.getI18nString("ON") : self.getI18nString("OFF");
}

// Function for retrieving duration
GPIOControl.prototype.durationToString = function(value){
	const self = this;

	return value == 0 ? self.getI18nString("DURATION_NONE") : value;
}

// Funciton for retrieving delay
GPIOControl.prototype.delayToString = function(value){
	const self = this;

	return value == 0 ? self.getI18nString("DELAY_NONE") : value;
}

// Function for displaying units
GPIOControl.prototype.unitsToString = function(value){
	const self = this;

	switch (value){
		case DURATION.HOURS:
			return self.getI18nString("UNITS_HOURS");
		case DURATION.MINUTES:
			return self.getI18nString("UNITS_MINUTES");
		case DURATION.SECONDS:
			return self.getI18nString("UNITS_SECONDS");
		case DURATION.MILLISECONDS:
			return self.getI18nString("UNITS_MILLISECONDS");
	}
}

// A method to get some language strings used by the plugin
GPIOControl.prototype.load18nStrings = function() {
	const self = this;
	const language_code = this.commandRouter.sharedVars.get('language_code');
	
	try {
		
		self.i18nStrings = fs.readJsonSync(__dirname + '/i18n/strings_' + language_code + ".json");
	}
	catch (e) {
		self.i18nStrings = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
	}

	self.i18nStringsDefaults = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
};

// Retrieve a string
GPIOControl.prototype.getI18nString = function (key) {
	const self = this;

	if (self.i18nStrings[key] !== undefined){
		return self.i18nStrings[key];
	}
	return self.i18nStringsDefaults[key];
};

// Retrieve a UI element from UI config
GPIOControl.prototype.getUIElement = function(obj, field){
	const self = this;
	const lookfor = JSON.parse('{"id":"' + field + '"}');

	return obj.sections[0].content.findItem(lookfor);
}

// Populate switch UI element
GPIOControl.prototype.setSwitchElement = function(obj, field, value){
	const self = this;
	const result = self.getUIElement(obj, field);
	
	if (result){
		result.value = value;
		return;
	}

	self.log(`Could not find control ${field}`);
}

// Populate select UI element
GPIOControl.prototype.setSelectElement = function(obj, field, value, label){
	const self = this;
	const result = self.getUIElement(obj, field);
	
	if (result){
		result.value.value = value;
		result.value.label = label;
		return;
	}

	self.log(`Could not find control ${field}`);
}

// Populate select UI element when value matches the label
GPIOControl.prototype.setSelectElementStr = function(obj, field, value){
	const self = this;
	self.setSelectElement(obj, field, value, value.toString());
}