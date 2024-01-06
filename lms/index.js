'use strict';

var exec = require('child_process').exec;
var fs = require('fs-extra');
var libQ = require('kew');
var selfIP = '';

// Define the ControllerLMS class
module.exports = ControllerLMS;

function ControllerLMS(context) 
{
	var self = this;
	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;
};

ControllerLMS.prototype.onVolumioStart = function()
{
	var self = this;	
	return libQ.resolve();	
};

ControllerLMS.prototype.getConfigurationFiles = function()
{
	return ['config.json'];
};

// Plugin methods -----------------------------------------------------------------------------
ControllerLMS.prototype.onStop = function() {
	var self = this;
	var defer = libQ.defer();

	self.stopService('logitechmediaserver')
	.then(function(edefer)
	{
		defer.resolve();
	})
	.fail(function(e)
	{
		self.commandRouter.pushToastMessage('error', "Stopping failed", "Could not stop the LMS plugin in a fashionable manner, error: " + e);
		// Do not reject, in case user is uninstalling a possibly broken installation - rejecting will abort the process.
		defer.resolve();
	});

	return defer.promise;
};

ControllerLMS.prototype.stop = function() {
	var self = this;
	var defer = libQ.defer();
	self.stopService('logitechmediaserver')
	.then(function(edefer)
	{
		defer.resolve();
	})
	.fail(function(e)
	{
		self.commandRouter.pushToastMessage('error', "Stopping failed", "Could not stop the LMS plugin in a fashionable manner, error: " + e);
		defer.reject(new error());
	});

	return defer.promise;
};

ControllerLMS.prototype.onStart = function() {
	var self = this;
	var defer = libQ.defer();
	self.restartService('logitechmediaserver', true)
	.then(function(edefer)
	{
		self.selfIP = self.commandRouter.getCachedIPAddresses();
	})
	.then(function(fdefer)
	{
		defer.resolve();
	})
	.fail(function(e)
	{
		self.commandRouter.pushToastMessage('error', "Startup failed", "Could not start the LMS plugin in a fashionable manner.");
		self.logger.info("Could not start the LMS plugin in a fashionable manner.");
		defer.reject(new error());
	});

	return defer.promise;
};

ControllerLMS.prototype.onRestart = function() 
{
	// Do nothing
	self.logger.info("performing onRestart action");
	
	var self = this;
};

ControllerLMS.prototype.onInstall = function() 
{
	self.logger.info("performing onInstall action");
	
	var self = this;
};

ControllerLMS.prototype.onUninstall = function() 
{
	// Perform uninstall tasks here!
};

ControllerLMS.prototype.getUIConfig = function() {
    var self = this;
	var defer = libQ.defer();    
    var lang_code = this.commandRouter.sharedVars.get('language_code');
	self.logger.info("Loaded the previous config.");
	self.commandRouter.i18nJson(__dirname+'/i18n/strings_' + lang_code + '.json',
		__dirname + '/i18n/strings_en.json',
		__dirname + '/UIConfig.json')
    .then(function(uiconf)
    {
		self.logger.info("[LMS] Loading configuration...");
		let consoleUrl = `http://${self.selfIP['eth0'] || self.selfIP['wlan0']}:9000`;
		self.logger.info(`[LMS] Console URL: ${consoleUrl}`);
		uiconf.sections[0].content[0].onClick.url = consoleUrl;
		defer.resolve(uiconf);
	})
	.fail(function()
	{
		defer.reject(new Error());
	});
	return defer.promise;
};

ControllerLMS.prototype.setUIConfig = function(data) {
	var self = this;
	self.logger.info("Updating UI config");
	var uiconf = fs.readJsonSync(__dirname + '/UIConfig.json');
	return libQ.resolve();
};

ControllerLMS.prototype.getConf = function(configFile) {
	var self = this;
	
	return libQ.resolve();
};

ControllerLMS.prototype.setConf = function(conf) {
	var self = this;
	return libQ.resolve();
};

// Public Methods ---------------------------------------------------------------------------------------

ControllerLMS.prototype.restartService = function (serviceName, boot)
{
	var self = this;
	var defer=libQ.defer();
	var command = "/usr/bin/sudo /bin/systemctl restart " + serviceName;
	exec(command, {uid:1000,gid:1000}, function (error, stdout, stderr) {
		if (error !== null) {
			self.commandRouter.pushConsoleMessage('The following error occurred while starting ' + serviceName + ': ' + error);
			self.commandRouter.pushToastMessage('error', "Restart failed", "Restarting " + serviceName + " failed with error: " + error);
			defer.reject(new Error('Unable to restart service LMS'));
		}
		else {
			self.commandRouter.pushConsoleMessage(serviceName + ' started');
			if(boot == false)
				self.commandRouter.pushToastMessage('success', "Restarted " + serviceName, "Restarted " + serviceName + " for the changes to take effect.");
			defer.resolve();
		}
	});
	return defer.promise;
};

ControllerLMS.prototype.stopService = function (serviceName)
{
	var self = this;
	var defer=libQ.defer();
	var command = "/usr/bin/sudo /bin/systemctl stop " + serviceName;
	exec(command, {uid:1000,gid:1000}, function (error, stdout, stderr) {
		if (error !== null) {
			self.commandRouter.pushConsoleMessage('The following error occurred while stopping ' + serviceName + ': ' + error);
			self.commandRouter.pushToastMessage('error', "Stopping service failed", "Stopping " + serviceName + " failed with error: " + error);
			defer.reject(new Error('Unable to stop service LMS'));
		}
		else {
			self.commandRouter.pushConsoleMessage(serviceName + ' stopped');
			self.commandRouter.pushToastMessage('success', "Stopping", "Stopped " + serviceName + ".");
			defer.resolve();
		}
	});
	return defer.promise;
};