'use strict';

const libQ = require('kew');
const fs=require('fs-extra');
const config = new (require('v-conf'))();
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const gpiox = require("@iiot2k/gpiox");

//GPIO pin for Volumio Ready signal
//Default to Low State at startup
const VOLUMIO_READY_GPIO = 17;

module.exports = roseaudiosys;
function roseaudiosys(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

}

//Volumio is starting
roseaudiosys.prototype.onVolumioStart = function()
{
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);
	this.commandRouter.logger.info("Starting Rose Audio System Initialization Plugin");

	//Initialize the Volumio Ready GPIO
	gpiox.init_gpio(VOLUMIO_READY_GPIO, gpiox.GPIO_MODE_OUTPUT, 0);

	// Set the Volumio Ready GPIO to High State
	gpiox.set_gpio(VOLUMIO_READY_GPIO, 1);

    return libQ.resolve();
}

// Volumio is shutting down
GPIOControl.prototype.onVolumioShutdown = function() {
	const self = this;

	self.commandRouter.logger.info("Shutting down Rose Audio System Initialization Plugin");

	// self.handleEvent(EVENT.SYSTEM_SHUTDOWN);

	// return libQ.resolve();

	// Set the Volumio Ready GPIO to Low State
	gpiox.set_gpio(VOLUMIO_READY_GPIO, 0);

	// Deinitialize the Volumio Ready GPIO
	gpiox.deinit_gpio(VOLUMIO_READY_GPIO);
};

roseaudiosys.prototype.onStart = function() {
    var self = this;
	var defer=libQ.defer();


	// Once the Plugin has successfull started resolve the promise
	defer.resolve();

    return defer.promise;
};

roseaudiosys.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();

    return libQ.resolve();
};

roseaudiosys.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};


// Configuration Methods -----------------------------------------------------------------------------

roseaudiosys.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {


            defer.resolve(uiconf);
        })
        .fail(function()
        {
            defer.reject(new Error());
        });

    return defer.promise;
};

roseaudiosys.prototype.getConfigurationFiles = function() {
	return ['config.json'];
}

roseaudiosys.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

roseaudiosys.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

roseaudiosys.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};
