'use strict';

var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var fs = require('fs-extra');
var libNet = require('net');
var libQ = require('kew');
var net = require('net');
var path = require('path');

// Define the ControllerSqueezelite class
module.exports = ControllerSqueezelite;

function ControllerSqueezelite(context) 
{
	var self = this;
	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;
};

ControllerSqueezelite.prototype.onVolumioStart = function()
{
	var self = this;
	var configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
    this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);
	self.logger.info("[Squeezelite] Initiated plugin");	
	return libQ.resolve();	
};

ControllerSqueezelite.prototype.getConfigurationFiles = function()
{
	return ['config.json'];
};

// Plugin methods -----------------------------------------------------------------------------
ControllerSqueezelite.prototype.onStop = function() {
	var self = this;
	var defer = libQ.defer();
	self.stopService('squeezelite')
	.then(function(edefer)
	{
		defer.resolve();
	})
	.fail(function(e)
	{
		self.commandRouter.pushToastMessage('error', "Stopping failed", "Could not stop the Squeezelite plugin in a fashionable manner, error: " + e);
		defer.reject(new error());
	});
	return defer.promise;
};

ControllerSqueezelite.prototype.stop = function() {
	var self = this;
	var defer = libQ.defer();
	self.stopService('squeezelite')
	.then(function(edefer)
	{
		defer.resolve();
	})
	.fail(function(e)
	{
		self.commandRouter.pushToastMessage('error', "Stopping failed", "Could not stop the Squeezelite plugin in a fashionable manner, error: " + e);
		defer.reject(new error());
	});
	return defer.promise;
};

ControllerSqueezelite.prototype.onStart = function() {
	var self = this;
	var defer = libQ.defer();
	self.restartService('squeezelite', true)
	.then(function(edefer)
	{
		defer.resolve();
	})
	.fail(function(e)
	{
		self.commandRouter.pushToastMessage('error', "Startup failed", "Could not start the Squeezelite plugin in a fashionable manner.");
		self.logger.info("[Squeezelite] Could not start the Squeezelite plugin in a fashionable manner.");
		defer.reject(new error());
	});
	return defer.promise;
};

ControllerSqueezelite.prototype.onRestart = function() 
{
	// self.logger.info("performing onRestart action");	
	var self = this;
};

ControllerSqueezelite.prototype.onInstall = function() 
{
	// self.logger.info("performing onInstall action");	
	var self = this;
};

ControllerSqueezelite.prototype.onUninstall = function() 
{
	// Perform uninstall tasks here!
};

ControllerSqueezelite.prototype.getUIConfig = function() {
    var self = this;
	var defer = libQ.defer();    
    var lang_code = this.commandRouter.sharedVars.get('language_code');

	var seconds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
	self.commandRouter.i18nJson(__dirname+'/i18n/strings_' + lang_code + '.json',
		__dirname + '/i18n/strings_en.json',
		__dirname + '/UIConfig.json')
    .then(function(uiconf)
    {
		self.logger.info("[Squeezelite] Populating UI for configuration...");		
		uiconf.sections[0].content[0].value = self.config.get('enabled');
		uiconf.sections[0].content[1].value = self.config.get('name');
		self.logger.info("[Squeezelite] 1/2 settings sections loaded");
				
		for (var s in seconds)
		{
			self.configManager.pushUIConfigParam(uiconf, 'sections[1].content[0].options', {
				value: s,
				label: s
			});
			
			if(self.config.get('soundcard_timeout') == s)
			{
				uiconf.sections[1].content[0].value.value = self.config.get('soundcard_timeout');
				uiconf.sections[1].content[0].value.label = self.config.get('soundcard_timeout');
			}
		}		
		uiconf.sections[1].content[1].value = self.config.get('alsa_params');
		uiconf.sections[1].content[2].value = self.config.get('extra_params');
		self.logger.info("[Squeezelite] 2/2 settings sections loaded");		
		defer.resolve(uiconf);
	})
	.fail(function()
	{
		defer.reject(new Error());
	});

	return defer.promise;
};

ControllerSqueezelite.prototype.setUIConfig = function(data) {
	var self = this;
	var uiconf = fs.readJsonSync(__dirname + '/UIConfig.json');	
	return libQ.resolve();
};

ControllerSqueezelite.prototype.getConf = function(configFile) {
	var self = this;
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);
	return libQ.resolve();
};

ControllerSqueezelite.prototype.setConf = function(conf) {
	var self = this;
	return libQ.resolve();
};

// Public Methods ---------------------------------------------------------------------------------------

ControllerSqueezelite.prototype.updateSqueezeliteServiceConfig = function (data)
{
	var self = this;
	var defer = libQ.defer();
	self.config.set('enabled', data['enabled']);
	self.config.set('name', data['name']);
	self.logger.info("[Squeezelite] Successfully updated Squeezelite service configuration");
	self.constructUnit(__dirname + "/etc/systemd/system/squeezelite.service-template", __dirname + "/etc/systemd/system/squeezelite.service")
	.then(function(stopIfNeeded){
		if(self.config.get('enabled') != true)
		{
			self.stopService("squeezelite")
			.then(function(edefer)
			{
				defer.resolve();
			})
			.fail(function()
			{
				self.commandRouter.pushToastMessage('error', "Stopping failed", "Stopping Squeezelite failed with error: " + error);
				defer.reject(new Error());
			});
		}
	});
	return defer.promise;
};

ControllerSqueezelite.prototype.updateSqueezeliteAudioConfig = function (data)
{
	var self = this;
	var defer = libQ.defer();
	self.config.set('soundcard_timeout', data['soundcard_timeout'].value);
	self.config.set('alsa_params', data['alsa_params']);
	self.config.set('extra_params', data['extra_params']);
	self.logger.info("[Squeezelite] Successfully updated Squeezelite config.json");
	self.constructUnit(path.join(__dirname + "/etc/systemd/system/squeezelite.service-template"), path.join(__dirname + "/etc/systemd/system/squeezelite.service"))
	.then(function(stopIfNeeded){
		if(self.config.get('enabled') != true)
		{
			self.stopService("squeezelite")
			.then(function(edefer)
			{
				defer.resolve();
			})
			.fail(function()
			{
				self.commandRouter.pushToastMessage('error', "Stopping failed", "Stopping Squeezelite failed with error: " + error);
				defer.reject(new Error());
			});
		}
	});
	return defer.promise;
};

ControllerSqueezelite.prototype.restartService = function (serviceName, boot)
{
	var self = this;
	var defer = libQ.defer();
	if(self.config.get('enabled'))
	{
		var command = "/usr/bin/sudo /bin/systemctl restart " + serviceName;
		self.reloadService(serviceName)
		.then(function(restart){
			exec(command, {uid:1000,gid:1000}, function (error, stdout, stderr) {
				if (error !== null) {
					self.commandRouter.pushConsoleMessage('The following error occurred while starting ' + serviceName + ': ' + error);
					self.commandRouter.pushToastMessage('error', "Restart failed", "Restarting " + serviceName + " failed with error: " + error);
					defer.reject();
				}
				else {
					self.commandRouter.pushConsoleMessage(serviceName + ' started');
					if(boot == false)
						self.commandRouter.pushToastMessage('success', "Restarted " + serviceName, "Restarted " + serviceName + " for the changes to take effect.");
					
					defer.resolve();
				}
			});
		});
	}
	else
	{
		self.logger.info("[Squeezelite] Not starting " + serviceName + "; it's not enabled.");
		defer.resolve();
	}
	return defer.promise;
};

ControllerSqueezelite.prototype.reloadService = function (serviceName)
{
	var self = this;
	var defer = libQ.defer();
	var command = "/usr/bin/sudo /bin/systemctl daemon-reload";
	exec(command, {uid:1000,gid:1000}, function (error, stdout, stderr) {
		if (error !== null) {
			self.commandRouter.pushConsoleMessage('The following error occurred while reloading ' + serviceName + ': ' + error);
			self.commandRouter.pushToastMessage('error', "Reloading service failed", "Reloading " + serviceName + " failed with error: " + error);
			defer.reject();
		}
		else {
			self.commandRouter.pushConsoleMessage(serviceName + ' reloaded');
			self.commandRouter.pushToastMessage('success', "Reloading", "Reloading " + serviceName + ".");
			defer.resolve();
		}
	});
	return defer.promise;
};

ControllerSqueezelite.prototype.stopService = function (serviceName)
{
	var self = this;
	var defer = libQ.defer();
	var command = "/usr/bin/sudo /bin/systemctl stop " + serviceName;
	exec(command, {uid:1000,gid:1000}, function (error, stdout, stderr) {
		if (error !== null) {
			self.commandRouter.pushConsoleMessage('The following error occurred while stopping ' + serviceName + ': ' + error);
			self.commandRouter.pushToastMessage('error', "Stopping service failed", "Stopping " + serviceName + " failed with error: " + error);
			defer.reject();
		}
		else {
			self.commandRouter.pushConsoleMessage(serviceName + ' stopped');
			self.commandRouter.pushToastMessage('success', "Stopping", "Stopped " + serviceName + ".");
			defer.resolve();
		}
	});
	return defer.promise;
};

ControllerSqueezelite.prototype.constructUnit = function(unitTemplate, unitFile)
{
	var self = this;
	var defer = libQ.defer();
	var replacementDictionary = [
		{ placeholder: "${NAME}", replacement: self.config.get('name') },
		{ placeholder: "${SOUNDCARD_TIMEOUT}", replacement: self.config.get('soundcard_timeout') },
		{ placeholder: "${ALSA_PARAMS}", replacement: self.config.get('alsa_params') },
		{ placeholder: "${EXTRA_PARAMS}", replacement: self.config.get('extra_params') }
	];
	for (var rep in replacementDictionary)
	{
		if(replacementDictionary[rep].replacement == undefined || replacementDictionary[rep].replacement == 'undefined')
				replacementDictionary[rep].replacement = " ";
		else
		{
			if (replacementDictionary[rep].placeholder == "${NAME}" && self.config.get('name') != '')
				replacementDictionary[rep].replacement = "-n " + replacementDictionary[rep].replacement;
			else if (replacementDictionary[rep].placeholder == "${NAME}")
				replacementDictionary[rep].replacement = "-n Volumio";
			else if (replacementDictionary[rep].placeholder == "${SOUNDCARD_TIMEOUT}")
				replacementDictionary[rep].replacement = "-C " + replacementDictionary[rep].replacement;
			else if (replacementDictionary[rep].placeholder == "${ALSA_PARAMS}" && self.config.get('alsa_params') != '')
				replacementDictionary[rep].replacement = "-a " + replacementDictionary[rep].replacement;
			else if (replacementDictionary[rep].placeholder == "${ALSA_PARAMS}")
				replacementDictionary[rep].replacement = "-a 80:4::";
			else if (replacementDictionary[rep].placeholder == "${EXTRA_PARAMS}" && self.config.get('extra_params') != '')
				replacementDictionary[rep].replacement = replacementDictionary[rep].replacement;
			else if (replacementDictionary[rep].placeholder == "${EXTRA_PARAMS}")
				replacementDictionary[rep].replacement = "";
		}
	}
	self.replaceStringsInFile(unitTemplate, unitFile, replacementDictionary)
	.then(function(resolve){
		self.restartService('squeezelite', false);
		defer.resolve();
	})
	.fail(function(resolve){
		return defer.reject();
	});
	return defer.promise;
}

ControllerSqueezelite.prototype.replaceStringsInFile = function(sourceFilePath, destinationFilePath, replacements)
{
	var self = this;
	var defer = libQ.defer();

	fs.readFile(sourceFilePath, 'utf8', function (err, data) {
		if (err) {
			self.commandRouter.pushConsoleMessage('[Squeezelite] Read error while reading sourceFilePath in function replaceStringsInFile.');
			self.commandRouter.pushToastMessage('error', "Saving configuration", "Changing configuration failed.");
			return defer.reject(new Error(err));
		}
	
		var tmpConf = data;

		for (var rep in replacements)
		{
			self.logger.info('[Squeezelite] Replacing ' + replacements[rep].placeholder + " with " + replacements[rep].replacement);
			tmpConf = tmpConf.replace(replacements[rep].placeholder, replacements[rep].replacement);
		}
		fs.writeFile(destinationFilePath, tmpConf, 'utf8', function (err) {
			if (err)
			{
				self.commandRouter.pushConsoleMessage('[Squeezelite] Could not write the script with error: ' + err);
				self.commandRouter.pushToastMessage('error', "Saving configuration", "Changing configuration failed.");
				return defer.reject(new Error(err));
			}
			else 
			{
				defer.resolve();
			}
        });
	});
	return defer.promise;
};
