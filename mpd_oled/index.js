// volumio plugin refresh && volumio vrestart
// sudo chown -R volumio mpd_oled
// journalctl -f
// mpd_oled  -o 3 -b 16 -g 1 -f 60 -s 8,5 -C 0 -P p -c fifo,/tmp/mpdoledfifo -B 1 -r 25 -D 24 -S 0

'use strict';

var libQ = require('kew');
var fs = require('fs-extra');
var config = new (require("v-conf"))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var sleep = require('sleep');

// System daemon
const TMP_SCRIPT = "/tmp/mpd_oled_plugin.sh"

// Configuration file
const CONFIG_FILE = "config.json";

// Placeholder for replacing default labels in config file
const TRANSLATE_COMBO_LABEL_DEFAULT = "TRANSLATE.COMBO_LABEL_DEFAULT";

// Constants of UI elements and configuration values
const uiElement = {
	oledType : {
		name: "oledType",
		key: "OLED_TYPE"
	}, 
	numberOfBars : {
		name: "numberOfBars",
		key: "NUMBER_OF_BARS"
	},
	gapBetweenBars : {
		name: "gapBetweenBars",
		key: "GAP_BETWEEN_BARS"
	},
	frameRate : {
		name: "frameRate",
		key: "FRAME_RATE"
	},
	scrollRate : {
		name: "scrollRate",
		key: "SCROLL_RATE"
	},
	scrollDelay : {
		name: "scrollDelay",
		key: "SCROLL_DELAY"
	},
	clockFormat : {
		name: "clockFormat",
		key: "CLOCK_FORMAT"
	},
	pauseScreenType : {
		name: "pauseScreenType",
		key: "PAUSE_SCREEN_TYPE"
	},
	cavaInputMethodAndSourceEnabled : {
		name: "cavaInputMethodAndSourceEnabled",
		key: "CAVA_INPUT_METHOD_AND_SOURCE_ENABLED"
	},
	cavaInputMethodAndSource : {
		name: "cavaInputMethodAndSource",
		key: "CAVA_INPUT_METHOD_AND_SOURCE"
	},
	rotateDisplay : {
		name: "rotateDisplay",
		key: "ROTATE_DISPLAY"
	},
	invertDisplayEnabled : {
		name: "invertDisplayEnabled",
		key: "INVERT_DISPLAY_ENABLED"
	},
	invertDisplayPeriod : {
		name: "invertDisplayPeriod",
		key: "INVERT_DISPLAY_PERIOD"
	},
	i2cAddress : {
		name: "i2cAddress",
		key: "I2C_ADDRESS"
	},
	i2cBus : {
		name: "i2cBus",
		key: "I2C_BUS"
	},
	spiResetGPIONumber : {
		name: "spiResetGPIONumber",
		key: "SPI_RESET_GPIO_NUMBER"
	},
	spiDCGPIONumber : {
		name: "spiDCGPIONumber",
		key: "SPI_DC_GPIO_NUMBER"
	},
	spiCS : {
		name: "spiCS",
		key: "SPI_CS"
	},
	dateFormat : {
		name: "dateFormat",
		key: "DATE_FORMAT"
	}
};

// Array of names of combos in the UI to be populated
const comboElements = [
	uiElement.oledType,
	uiElement.numberOfBars,
	uiElement.gapBetweenBars,
	uiElement.frameRate,
	uiElement.scrollRate,
	uiElement.scrollDelay,
	uiElement.clockFormat,
	uiElement.pauseScreenType,
	uiElement.invertDisplayPeriod,
	uiElement.i2cAddress,
	uiElement.i2cBus,
	uiElement.spiResetGPIONumber,
	uiElement.spiDCGPIONumber,
	uiElement.spiCS,
	uiElement.dateFormat
];

// Define the MpdOled class
module.exports = MpdOled;

// Constructor
function MpdOled(context) {
	const self = this;

	self.context = context;
	self.commandRouter = self.context.coreCommand;
	self.logger = self.context.logger;
	self.configManager = self.context.configManager;
	self.load18nStrings();
};

// Volumio is starting
MpdOled.prototype.onVolumioStart = function(){
	const self = this;
	var configFile = self.commandRouter.pluginManager.getConfigurationFile(self.context, CONFIG_FILE);

	self.info(`Reading configuration file at: ${configFile}`);

	// Read config file
	config.loadFile(configFile);

	// Translate any default combo labels according to language
	self.translateDefaultLabels();

	return libQ.resolve();
};

// Volumio is shutting down
MpdOled.prototype.onVolumioShutdown = function() {
	const self = this;
	return libQ.resolve();
};

// Return config filename
MpdOled.prototype.getConfigurationFiles = function() {
	return [CONFIG_FILE];
};

// Plugin has started
MpdOled.prototype.onStart = function() {
	const self = this;
	var defer = libQ.defer();

	self.makeMpdoledFifo();
	self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'updateALSAConfigFile');
	
	// Start service
	self.startService();

	defer.resolve();
	return defer.promise;
};

// Pluging has stopped
MpdOled.prototype.onStop = function() {
	const self = this;
	var defer = libQ.defer();

	// Stop service
	self.stopService();

	defer.resolve();
	return defer.promise;
};


// Make fifo
MpdOled.prototype.makeMpdoledFifo = function () {
	const self = this;
	var defer = libQ.defer();

	try {
		execSync("/usr/bin/mkfifo -m 646 /tmp/mpdoledfifo", {
			uid: 1000, 
			gid: 1000 
		});
	}
	catch (err) {
		self.logger.error(`Failed to create mpdoledfifo: ${err}`);
		defer.reject(err);
	}
};

// Read config and setup UI
MpdOled.prototype.getUIConfig = function() {
	var defer = libQ.defer();
	const self = this;

	var languageCode = this.commandRouter.sharedVars.get("language_code");

	self.commandRouter.i18nJson(
		__dirname + `/i18n/strings_${languageCode}.json`,
		__dirname + "/i18n/strings_en.json",
		__dirname + "/UIConfig.json"
	)
	.then(function(uiconf){

		// Populate all combos elements from config file
		comboElements.forEach(function(item) {

			// Extend the find method on the content array - mental but works
			uiconf.sections[0].content.findItem = function(obj) {
				return this.find(function(item) {
					for (var prop in obj)
						if (!(prop in item) || obj[prop] !== item[prop])
							return false;
					return true;
				});
			}

			// Retrieve the combo value and label from config file
			var comboName = item.name;
			var comboValue = config.get(comboName);   
			var comboLabel = config.get(comboName + "Label");

			if (comboValue !== undefined){
				self.info(`Populating: ${comboName}: ${comboValue} - ${comboLabel}`);

				self.setSelectElement(uiconf, comboName, comboValue, comboLabel);
			}
			else{
				self.info(`Could not find ${comboName} in config.json - using default`);
			}
		});

		// Populate switches
		self.setSwitchElement(uiconf, uiElement.cavaInputMethodAndSourceEnabled.name);
		self.setSwitchElement(uiconf, uiElement.rotateDisplay.name);
		self.setSwitchElement(uiconf, uiElement.invertDisplayEnabled.name);

		// Populate text fields
		self.setTextElement(uiconf, uiElement.cavaInputMethodAndSource.name);

		defer.resolve(uiconf);
	})
	.fail(function(){
		defer.reject(new Error());
	});

	return defer.promise;
};

// Save config
MpdOled.prototype.saveConfig = function(data){
	const self = this;
	var validationError = self.userInterfaceValidationError(data);

	if (validationError != ""){
		self.commandRouter.pushToastMessage("error", self.getI18nString("INVALID_CONFIGURATION"), validationError);
		return;
	}

	// Store each combo elements in config
	comboElements.forEach(function(item) {
		var comboName = item.name;
		var comboLabel = comboName + "Label";

		config.set(comboName, data[comboName]["value"]);
		config.set(comboLabel, data[comboName]["label"]);   
	
		self.info(`Saving: ${comboName}: ${data[comboName]["value"]} - ${data[comboName]["label"]}`);
	});

	// Store non combo elements in config
	self.saveElementInConfig(uiElement.cavaInputMethodAndSourceEnabled.name, data);
	self.saveElementInConfig(uiElement.rotateDisplay.name, data);
	self.saveElementInConfig(uiElement.invertDisplayEnabled.name, data);
	self.saveElementInConfig(uiElement.cavaInputMethodAndSource.name, data);

	// Restart mpd_oled service
	self.restartService();

	self.commandRouter.pushToastMessage("success", self.getI18nString("VALID_CONFIGURATION"), self.getI18nString("SETTINGS_SAVED"));
};

// ======================= Process control ======================

// Restart the mpd_oled service
MpdOled.prototype.restartService = function(){
	const self = this;
	self.stopService();
	self.startService();
}

// Create a dynamic bash script that runs mpd_oled with the correct parameters
MpdOled.prototype.createPluginTmpScript = function(){
	const self = this;
	const parameters = self.getParameters();
	const content = `#!/bin/bash
	/usr/bin/mpd_oled ${parameters}`;

	// Create a new/overwrite bash script
	fs.writeFile(TMP_SCRIPT, content, error => {
		if (error) {
			self.error(`Could not create tmp script: ${error}`);
			return;
		}
		self.info(`tmp script created ${TMP_SCRIPT}`);
	});

	// Allow it to be executable
	exec(`/usr/bin/sudo /bin/chmod +x ${TMP_SCRIPT}`,
		(error, stdout, stderr) => {
			if (error !== null) {
				self.error(`Could not chmod tmp script ${error}`);
				return;
			}
			self.info(`Set execute permissions on ${TMP_SCRIPT}`);
		}
	);
}

// Start the mpd_oled service
MpdOled.prototype.startService = function(){
	const self = this;
	const defer = libQ.defer();

	// Check if the oled type has been initialised
	if (config.get(uiElement.oledType.name) == 0){
		self.info("Not starting mpd_oled service because oled type is not configured yet");
		defer.resolve();
		return defer.promise;;
	}

	// Create a dynamic bash script, this is referenced by the service using a static path
	self.createPluginTmpScript();

	// Start the service command
	exec("/usr/bin/sudo /bin/systemctl start mpd_oled_plugin.service", 
		(error, stdout, stderr) => {
			if (error !== null) {
				self.error(`Could not start mpd_oled_plugin service: ${error}`);
				defer.reject();
				return defer.promise;;
			}
			defer.resolve();
			self.info(`Started mpd_oled_plugin service`);
		}
	);

	return defer.promise;
}

// Stop the mpd_oled service
MpdOled.prototype.stopService = function(){
	const self = this;
	const defer = libQ.defer();

	// Stop the service command
	exec("/usr/bin/sudo /bin/systemctl stop mpd_oled_plugin.service", 
		(error, stdout, stderr) => {
			if (error !== null) {
				self.error(`Could not stop mpd_oled_plugin service: ${error}`);
				defer.reject();
				return defer.promise;;
			}
			defer.resolve();
			self.info(`Stopped mpd_oled_plugin service`);
		}
	);

	return defer.promise;
}

// Generate the command line parameters for mpd_oled from configuration file
MpdOled.prototype.getParameters = function(){
	var ret = "";

	ret += " -o " + config.get(uiElement.oledType.name);
	ret += " -b " + config.get(uiElement.numberOfBars.name);
	ret += " -g " + config.get(uiElement.gapBetweenBars.name);
	ret += " -f " + config.get(uiElement.frameRate.name);
	ret += " -s " + config.get(uiElement.scrollRate.name) + "," + config.get(uiElement.scrollDelay.name);	
	ret += " -C " + config.get(uiElement.clockFormat.name);
	ret += " -P " + config.get(uiElement.pauseScreenType.name);
	if (config.get(uiElement.cavaInputMethodAndSourceEnabled.name)){
		ret += " -c " + config.get(uiElement.cavaInputMethodAndSource.name);
	}
	if (config.get(uiElement.rotateDisplay.name)){
		ret += " -R";
	}
	if (config.get(uiElement.invertDisplayEnabled.name)){
		ret += " -I ";
		if (config.get(uiElement.invertDisplayPeriod.name) == 0){
			ret += "i"
		}
		else{
			ret += config.get(uiElement.invertDisplayPeriod.name);
		}
	}
	if (config.get(uiElement.i2cAddress.name) != ""){
		ret += " -a " + config.get(uiElement.i2cAddress.name);
	}
	ret += " -B " + config.get(uiElement.i2cBus.name);
	ret += " -r " + config.get(uiElement.spiResetGPIONumber.name);	
	ret += " -D " + config.get(uiElement.spiDCGPIONumber.name);
	ret += " -S " + config.get(uiElement.spiCS.name);
	if (config.get(uiElement.dateFormat.name) == 1){
		ret += " -d ";
	}

	return ret;
};

// ===================== I2C device scanning ====================

// Display modal dialog
MpdOled.prototype.displayModal = function(title, msg){
	const self = this;
	var modalData = {
		title: title,
		message: msg,
		size: 'lg',
		buttons: [
			{
				name: self.getI18nString("OK"),
				class: "btn btn-info"
			}  
		]
	};
	self.commandRouter.broadcastMessage("openModal", modalData);
}

// Run an i2c device scan of both available buses and display results in a dialog
MpdOled.prototype.i2cScan = function(){
	const self = this;
	var i2cScan = [self.i2cScanBus(0), self.i2cScanBus(1)];

	// Display any error messages from the scan
	for (var i = 0; i < 2; i++){
		if (i2cScan[i].exception){
			self.commandRouter.pushToastMessage("error", self.getI18nString("I2C_DEVICE_SCAN"), i2cScan[i].exception);
			return;	
		}
	}

	// Display results of i2c scan in modal dialog
	var title = self.getI18nString("I2C_DEVICE_SCAN");
	var message = i2cScan[0].message + "<br/><br/>" + i2cScan[1].message;
	self.displayModal(title, message);
};

// Run i2c device scan
MpdOled.prototype.i2cScanBus = function(bus){
	const self = this;
	const regex = /\x20[0-9A-F]{2}/gi;
	const busName = self.getI18nString("I2C_BUS")["ITEM" + bus];
	const command = "/usr/bin/sudo i2cdetect -y " + bus;

	var buffer;
	var ret = {
		message: "", 
		exception: ""
	};

	try{
		self.info(`Starting i2c scan bus ${busName}: ${command}`)
		buffer = execSync(command).toString();
	}
	catch(e){
		var error = e.toString();
		if (error.includes("command not found")){
			ret.exception = self.getI18nString("I2C_NO_TOOLS");
			self.error(ret.exception);
			return ret;
		}
		else if (error.includes("Could not open file")){
			let msg = self.getI18nString("I2C_BUS_DISABLED");
			msg = msg.replace("<I2C_BUS>", busName);
			ret.message = msg;
			self.info(ret.message);
			return ret;
		}
		else{
			let msg = self.getI18nString("I2C_SCAN_ERROR");
			msg = msg.replace("<I2C_BUS>", busName);
			msg = msg.replace("<ERROR>", error);
			ret.exception = msg;
			self.error(ret.exception);
			return ret;
		}
	}
	var devices;
	var matches = buffer.match(regex);
	var msg = self.getI18nString("I2C_DEVICE_LIST");
	
	if (matches){
		devices = matches.map(item => item.trim()).join("<br/>");
	}
	else{
		devices = self.getI18nString("I2C_DEVICES_NONE");
	}

	msg = msg.replace("<I2C_BUS>", busName);
	msg = msg.replace("<DEVICES>", devices);
	ret.message = msg;
	self.info(ret.message);

	return ret;
};

// ========================= Languages ========================

// Translate any default combo labels using the strings_en.json
MpdOled.prototype.translateDefaultLabels = function() {
	const self = this;
	comboElements.forEach(function(item) {
		var comboConfigItem = item.name + "Label";
		var comboLabel = config.get(comboConfigItem);

		if (comboLabel == TRANSLATE_COMBO_LABEL_DEFAULT){
			var comboKey = item.key;
			var translationItem = self.getI18nString(comboKey);
			var translatedDefault = ""
			if (translationItem !== undefined && translationItem["DEFAULT"] !== undefined){
				translatedDefault = translationItem["DEFAULT"];
				self.info(`Translated default label of ${comboKey} to ${translatedDefault}`);
			}
			else{
				self.error(`Could not find the default translated label for ${comboKey}`);
			}
			config.set(comboConfigItem, translatedDefault);
		}
	});
};

// Load language strings used by the plugin
MpdOled.prototype.load18nStrings = function() {
	const self = this;
	const languageCode = this.commandRouter.sharedVars.get("language_code");
	const languageFile = __dirname + "/i18n/strings_" + languageCode + ".json";
	const languageDefaultFile = __dirname + "/i18n/strings_en.json";

	try {
		self.i18nStrings = fs.readJsonSync(languageFile);
	}
	catch (e) {
		self.i18nStrings = fs.readJsonSync(languageDefaultFile);
	}
	self.i18nStringsDefaults = fs.readJsonSync(languageDefaultFile);
};

// Retrieve a language string
MpdOled.prototype.getI18nString = function(key) {
	const self = this;

	if (self.i18nStrings[key] !== undefined){
		return self.i18nStrings[key];
	}
	else{
		return self.i18nStringsDefaults[key];
	}
};

// ============================ UI ============================

// Check for any validation errors in UI
MpdOled.prototype.userInterfaceValidationError = function(data){
	const self = this;
	const SPECT_WIDTH = 64;
	const bars = data[uiElement.numberOfBars.name]["value"];
	const gap = data[uiElement.gapBetweenBars.name]["value"];
	const minWidth = bars + (bars - 1) * gap; 
	
	if (data[uiElement.spiResetGPIONumber.name]["value"] == data[uiElement.spiDCGPIONumber.name]["value"]){
		return self.getI18nString("RESET_DC_ERROR");
	}
	if (data[uiElement.oledType.name]["value"] == 0){
		return self.getI18nString("OLED_TYPE_ERROR");
	}
	if (data[uiElement.cavaInputMethodAndSourceEnabled.name] && data[uiElement.cavaInputMethodAndSource.name] == ""){
		return self.getI18nString("CAVA_ERROR");
	}
	if (minWidth > SPECT_WIDTH){
		var msg = self.getI18nString("GAP_BARS_ERROR");
		msg = msg.replace("<SPECT_WIDTH>", SPECT_WIDTH);
		msg = msg.replace("<BARS>", bars);
		msg = msg.replace("<GAP>", gap);
		msg = msg.replace("<MIN_WIDTH>", minWidth);
		return msg;
	}
	return "";
};

// Retrieve a UI element from UI object
MpdOled.prototype.getUIElement = function(ui, field){
	const self = this;
	var lookfor = JSON.parse('{"id":"' + field + '"}');
	return ui.sections[0].content.findItem(lookfor);
};

// Populate switch UI element
MpdOled.prototype.setSwitchElement = function(ui, field){
	const self = this;
	var control = self.getUIElement(ui, field);
	if (control){
		control.value = config.get(field);
	}
	else{
		self.error(`Could not find switch element: ${field}`);
	}	
};

// Populate select UI element
MpdOled.prototype.setSelectElement = function(ui, field, value, label){
	const self = this;
	var control = self.getUIElement(ui, field);
	if (control){
		control.value.value = value;
		control.value.label = label;
	}
	else{
		self.error(`Could not find select element: ${field}`);
	}
};

// Populate text UI element
MpdOled.prototype.setTextElement = function(ui, field){
	const self = this;
	var control = self.getUIElement(ui, field);
	if (control){
		control.value = config.get(field);
	}
	else{
		self.error(`Could not find text element: ${field}`);
	}
};

// Save UI element in configuration file
MpdOled.prototype.saveElementInConfig = function(field, data){
	config.set(field, data[field]); 
};

// ========================== Logger ==========================

// Output error to log
MpdOled.prototype.error = function(msg){
	const self = this;
	self.logger.error(`[MPD_OLED Plugin] ${msg}`);
};

// Output info to log
MpdOled.prototype.info = function(msg){
	const self = this;
	self.logger.info(`[MPD_OLED Plugin] ${msg}`);
};

// ==================== Unused plugin methods ====================

MpdOled.prototype.onRestart = function(){};
MpdOled.prototype.onInstall = function (){};
MpdOled.prototype.onUninstall = function(){};
MpdOled.prototype.getConf = function(varName){};
MpdOled.prototype.setConf = function(varName, varValue){};
MpdOled.prototype.getAdditionalConf = function(type, controller, data){};
MpdOled.prototype.setAdditionalConf = function(){};
MpdOled.prototype.setUIConfig = function(data){};