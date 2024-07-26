'use strict';
// Logging: sudo journalctl -f
const logging = false;

// I used tomatpasser's gpio-buttons plugin as a basis for this project
const libQ = require("kew");
const fs = require("fs-extra");
const Gpio = require("onoff").Gpio;
const config = new (require("v-conf"))();
const io = require('socket.io-client');
const sleep = require('sleep');
const socket = io.connect("http://localhost:3000");
const execSync = require('child_process').execSync;

// Event string consts
const SYSTEM_STARTUP = "systemStartup";
const SYSTEM_SHUTDOWN = "systemShutdown";
const MUSIC_PLAY = "musicPlay";
const MUSIC_PAUSE = "musicPause";
const MUSIC_STOP = "musicStop";
const MUTE_ON = "muteOn";
const MUTE_OFF = "muteOff";
const RANDOM_ON = "randomOn";
const RANDOM_OFF = "randomOff";
const REPEAT_ON = "repeatOn";
const REPEAT_OFF = "repeatOff";
const REPEAT_ALL_ON = "repeatAllOn";
const REPEAT_ALL_OFF = "repeatAllOff";
const REPEAT_SINGLE_ON = "repeatSingleOn";
const REPEAT_SINGLE_OFF = "repeatSingleOff";

// State constants
const STATE_PLAY = "play";
const STATE_PAUSE = "pause";
const STATE_STOP = "stop";

// Events that we can detect and do something
const events = [
	SYSTEM_STARTUP, 
	SYSTEM_SHUTDOWN, 
	MUSIC_PLAY, 
	MUSIC_PAUSE, 
	MUSIC_STOP, 
	MUTE_ON, 
	MUTE_OFF, 
	RANDOM_ON, 
	RANDOM_OFF, 
	REPEAT_ON, 
	REPEAT_ALL_ON, 
	REPEAT_ALL_OFF, 
	REPEAT_SINGLE_ON, 
	REPEAT_SINGLE_OFF,
	REPEAT_OFF
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

	self.handleEvent(SYSTEM_SHUTDOWN);

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
			self.handleEvent(SYSTEM_STARTUP);

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
	.then((uiconf) =>
	{
		events.forEach((e) => {

			// Strings for data fields
			const s1 = e.concat("Enabled");
			const s2 = e.concat("Pin");
			const s3 = e.concat("State");
			const s4 = e.concat("Delay");
			const s5 = e.concat("DelayUnits");
			const s6 = e.concat("Duration");
			const s7 = e.concat("DurationUnits");

			// Strings for config
			const c1 = e.concat(".enabled");
			const c2 = e.concat(".pin");
			const c3 = e.concat(".state");
			const c4 = e.concat(".delay");
			const c5 = e.concat(".delayUnits");
			const c6 = e.concat(".duration");
			const c7 = e.concat(".durationUnits");

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
			self.setSwitchElement(uiconf, s1, config.get(c1)); // event on/off
			self.setSelectElementStr(uiconf, s2, config.get(c2)); // GPIO pin
			self.setSelectElement(uiconf, s3, config.get(c3), self.boolToString(config.get(c3))); // state
			self.setSelectElement(uiconf, s4, config.get(c4), self.delayToString(config.get(c4))); // delay
			self.setSelectElement(uiconf, s5, config.get(c5), self.unitsToString(config.get(c5))); // delay units
			self.setSelectElement(uiconf, s6, config.get(c6), self.durationToString(config.get(c6))); // duration
			self.setSelectElement(uiconf, s7, config.get(c7), self.unitsToString(config.get(c7))); // duration units
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
		const e1 = item.concat("Enabled");
		const e2 = item.concat("Pin");
		const e3 = item.concat("State");
		const e4 = item.concat("Delay");
		const e5 = item.concat("DelayUnits");
		const e6 = item.concat("Duration");
		const e7 = item.concat("DurationUnits");

		// Strings for config
		const c1 = item.concat(".enabled");
		const c2 = item.concat(".pin");
		const c3 = item.concat(".state");
		const c4 = item.concat(".delay");
		const c5 = item.concat(".delayUnits");
		const c6 = item.concat(".duration");
		const c7 = item.concat(".durationUnits");

		config.set(c1, data[e1]);
		config.set(c2, data[e2]["value"]);
		config.set(c3, data[e3]["value"]);
		config.set(c4, data[e4]["value"]);
		config.set(c5, data[e5]["value"]);
		config.set(c6, data[e6]["value"]);
		config.set(c7, data[e7]["value"]);
	});

	// Clear any previous states
	self.previousState = "";

	self.log("Saving config");
	self.createGPIOs();

	// Pins have been reset so fire off system startup
	self.handleEvent(SYSTEM_STARTUP);

	// retrieve playing status
	socket.emit("getState", "");

	self.commandRouter.pushToastMessage('success', self.getI18nString("PLUGIN_CONFIGURATION"), self.getI18nString("SETTINGS_SAVED"));
};

// Create GPIO objects for future events
GPIOControl.prototype.createGPIOs = function() {
	const self = this;

	self.log("Reading config and creating GPIOs");

	events.forEach((e) => {
		const c1 = e.concat(".enabled");
		const c2 = e.concat(".pin");
		const c3 = e.concat(".state");
		const c4 = e.concat(".delay");
		const c5 = e.concat(".delayUnits");	
		const c6 = e.concat(".duration");
		const c7 = e.concat(".durationUnits");	

		const enabled = config.get(c1);
		const pin = config.get(c2);
		const state = config.get(c3);
		const delay = self.getDurationMs(config.get(c4), config.get(c5));
		const delayUnits = self.unitsToString(config.get(c5));
		const duration = self.getDurationMs(config.get(c6), config.get(c7));
		const durationUnits = self.unitsToString(config.get(c7));

		if (enabled){
			var msg = `On ${e} will set GPIO ${pin} to ${self.boolToString(state)}`;

			if (delay > 0){
				msg += ` after ${config.get(c4)} ${delayUnits} delay`;
			}
			if (duration > 0){
				msg += ` for ${config.get(c6)} ${durationUnits}`;
			}

			self.log(msg);

			const gpio = new Gpio(pin, "out");
			gpio.e = e;
			gpio.state = state ? 1 : 0;
			gpio.pin = pin;
			gpio.delay = delay;
			gpio.duration = duration;
			gpio.delayTimeoutId = 0;
			gpio.durationTimeoutId = 0;
			self.GPIOs.push(gpio);
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
		gpio.unexport();
	});

	self.GPIOs = [];

	return libQ.resolve();
};

// Playing status has changed, more than one thing might have changed
// https://volumio.github.io/docs/API/REST_API.html
GPIOControl.prototype.statusChanged = function(state) {
	const self = this;

	self.log("State has changed!");

	// Player status
	if (state.status == STATE_PLAY && self.previousState.status != STATE_PLAY){
		self.handleEvent(MUSIC_PLAY);
	}
	if (state.status == STATE_PAUSE && self.previousState.status != STATE_PAUSE){
		self.handleEvent(MUSIC_PAUSE);
	}
	if (state.status == STATE_STOP && self.previousState.status != STATE_STOP){
		self.handleEvent(MUSIC_STOP);
	}

	// mute
	if (state.mute && !self.previousState.mute){
		self.handleEvent(MUTE_ON);
	}
	if (!state.mute && self.previousState.mute){
		self.handleEvent(MUTE_OFF);
	}
	
	// randomize
	if (state.random && !self.previousState.random){
		self.handleEvent(RANDOM_ON);
	}
	if (!state.random && self.previousState.random){
		self.handleEvent(RANDOM_OFF);
	}
	
	// Handle any repeat events
	if (!self.previousState){
		if (state.repeat){
			self.handleEvent(REPEAT_ON);
		}
		if (state.repeat && !state.repeatSingle){
			self.handleEvent(REPEAT_ALL_ON);
		}
		if (!state.repeat && !state.repeatSingle){
			self.handleEvent(REPEAT_ALL_OFF);
		}
		if (state.repeat && state.repeatSingle){
			self.handleEvent(REPEAT_SINGLE_ON);
		}
		if (!state.repeat && state.repeatSingle){
			self.handleEvent(REPEAT_SINGLE_OFF);        
		}
		if (!state.repeat){
			self.handleEvent(REPEAT_OFF);
		}
	}
	else{
		if (state.repeat && !self.previousState.repeat){
			self.handleEvent(REPEAT_ON);
		}
		
		// repeat all
		if (state.repeat && !state.repeatSingle && (!self.previousState.repeat || self.previousState.repeatSingle)){
			self.handleEvent(REPEAT_ALL_ON);
		}
		
		// repeat single
		if (state.repeat && state.repeatSingle && (!self.previousState.repeat || !self.previousState.repeatSingle)){
			self.handleEvent(REPEAT_SINGLE_ON);
		}

		if (!state.repeat && self.previousState.repeat){
			self.handleEvent(REPEAT_OFF);
			if (self.previousState.repeatSingle){
				self.handleEvent(REPEAT_SINGLE_OFF); 
			}
			else{
				self.handleEvent(REPEAT_ALL_OFF);
			}
		}
	}

	// Remember previous state
	self.previousState = state;
}

// An event has happened so do something about it
GPIOControl.prototype.handleEvent = function(e) {
	const self = this;

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

				gpio.writeSync(gpio.state);

				// If a duration has been specified then write to GPIO after specified duration
				if (gpio.duration > 0){

					self.log(`Delaying: ${gpio.duration}ms`);

					// Create timeout to pull GPIO
					gpio.durationTimeoutId = setTimeout(() => {
						self.log(`Turning GPIO ${gpio.pin} ${self.boolToString(!gpio.state)} (${e})`);
						gpio.writeSync(!gpio.state);
					}, gpio.duration);
				}
			}, gpio.delay);

			// Shutdown after a short wait
			if (e == SYSTEM_SHUTDOWN){
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
		case 0: // hours;
			return self.getI18nString("UNITS_HOURS");
		case 1: // minutes;
			return self.getI18nString("UNITS_MINUTES");
		case 2: // seconds;
			return self.getI18nString("UNITS_SECONDS");
		case 3: //ms
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

	if (self.i18nStrings[key] !== undefined)
		return self.i18nStrings[key];
	else
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
	}
	else{
		self.log(`Could not find control ${field}`);
	}
}

// Populate select UI element
GPIOControl.prototype.setSelectElement = function(obj, field, value, label){
	const self = this;
	const result = self.getUIElement(obj, field);
	
	if (result){
		result.value.value = value;
		result.value.label = label;
	}
	else{
		self.log(`Could not find control ${field}`);
	}
}

// Populate select UI element when value matches the label
GPIOControl.prototype.setSelectElementStr = function(obj, field, value){
	const self = this;
	self.setSelectElement(obj, field, value, value.toString());
}