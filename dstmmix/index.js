'use strict';

var exec = require('child_process').exec;
const execSync = require('child_process').execSync;
var fs = require('fs-extra');
var libQ = require('kew');


// Define the Dstmmix class
module.exports = Dstmmix;



function Dstmmix(context){
	var self = this;
	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;
};


Dstmmix.prototype.onVolumioStart = function () {
	const self = this;
	let configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);
	return libQ.resolve();
};

Dstmmix.prototype.getConfigurationFiles = function () {
	return ['config.json'];
};

// Plugin methods -----------------------------------------------------------------------------
Dstmmix.prototype.onStop = function () {
	var self = this;
	var defer = libQ.defer();
	self.stopService('logitechmediaserver')
		.then(function(edefer){
		
			defer.resolve();
		})
		.fail(function(e){
			self.commandRouter.pushToastMessage('error', "Stopping failed", "Could not stop the LMS plugin in a fashionable manner, error: " + e);
			defer.reject(new error());
		});
	return defer.promise;
};



Dstmmix.prototype.stop = function () {
	var self = this;
	var defer = libQ.defer();
	self.stopService('logitechmediaserver')
		.then(function(edefer) {
			defer.resolve();
		})
		.fail(function(e) {
			self.commandRouter.pushToastMessage('error', "Stopping failed", "Could not stop the LMS plugin in a fashionable manner, error: " + e);
			defer.reject(new error());
		});
	return defer.promise;
};



Dstmmix.prototype.onStart = function() {
	var self = this;
	var defer = libQ.defer();
	self.restartService('logitechmediaserver', true)
				
		.then(function(edefer) {
		
			exec('/bin/sh /data/plugins/music_service/dstmmix/shellbox.sh');
			self.commandRouter.pushToastMessage('info', 'test2');
			self.selfIP = self.commandRouter.getCachedIPAddresses();
		})
		.then(function(fdefer) {
			defer.resolve();
		})
		.fail(function(e) {
			self.commandRouter.pushToastMessage('error', "Startup failed", "Could not start the LMS plugin in a fashionable manner.");
			self.logger.info("Could not start the LMS plugin in a fashionable manner.");
			defer.reject(new error());
		});
	self.getIP();
	return defer.promise;
}



Dstmmix.prototype.onRestart = function() {
	// Do nothing
	self.logger.info("performing onRestart action");
	let cp7 = exec('/bin/sh /data/plugins/music_service/dstmmix/shellbox.sh');
	self.commandRouter.pushToastMessage('info', 'test2');
	self.getIP();
	var self = this;
};



Dstmmix.prototype.onInstall = function() {
	self.logger.info("performing onInstall action");
	var self = this;
};



Dstmmix.prototype.onUninstall = function() {
	// Perform uninstall tasks here!
};



Dstmmix.prototype.getUIConfig = function () {
	var self = this;
	var defer = libQ.defer();
	//self.logger.info("[LMS] Loading configuration...for WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW " + addressip);

	var lang_code = this.commandRouter.sharedVars.get('language_code');
	self.logger.info("Loaded the previous config.");
	self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
		__dirname + '/i18n/strings_en.json',
		__dirname + '/UIConfig.json')
		.then(function (uiconf) {
			//	self.logger.info("[LMS] Loading configuration...for WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW " + addressip);
		
			var IPaddress = self.config.get('address');

			uiconf.sections[0].content.push(
				{
					"id": "section_account_logout",
					"element": "button",
					"label": "Open",
					"description": "Open LMS",
					"onClick": {
						"type": "openUrl",
						"url": "http://" + IPaddress + ":9000"
					}})
					
			uiconf.sections[1].content.push(
				{
					"id": "advanced",
					"element": "button",
					"label": "Launch library analysis",
					"description": "Library analysis in a webconsole",
					"onClick": {
						"type": "openUrl",
						"url": "http://" + IPaddress + ":10000/bliss_shell"
					}})		
					
			uiconf.sections[1].content.push(
				{
					"id": "advanced",
					"element": "button",
					"label": "Launch Database update",
					"description": "Database transfer to LMS in a webconsole",
					"onClick": {
						"type": "openUrl",
						"url": "http://" + IPaddress + ":10001/bliss_shell"
					}})				
					
			uiconf.sections[1].content.push(
				{
					"id": "advanced",
					"element": "button",
					"label": "Launch Database backup",
					"description": "Little webtool to backup your precious database",
					"onClick": {
						"type": "openUrl",
						"url": "http://" + IPaddress + ":8080/home/volumio/Blissanalyser/dbb.html"
					}})				
					
					
			defer.resolve(uiconf);
		})
		.fail(function () {
			defer.reject(new Error());
		});
	return defer.promise;
};




Dstmmix.prototype.setUIConfig = function(data) {
	var self = this;
	self.logger.info("Updating UI config");
	var uiconf = fs.readJsonSync(__dirname + '/UIConfig.json');
	return libQ.resolve();
};

Dstmmix.prototype.getConf = function(configFile) {
	var self = this;
	
	return libQ.resolve();
};

Dstmmix.prototype.setConf = function(conf) {
	var self = this;
	return libQ.resolve();
};

// Public Methods ---------------------------------------------------------------------------------------


Dstmmix.prototype.getIP = function () {
	const self = this;
	var address
	var iPAddresses = self.commandRouter.executeOnPlugin('system_controller', 'network', 'getCachedIPAddresses', '');
	if (iPAddresses && iPAddresses.eth0 && iPAddresses.eth0 != '') {
		address = iPAddresses.eth0;
	} else if (iPAddresses && iPAddresses.wlan0 && iPAddresses.wlan0 != '' && iPAddresses.wlan0 !== '192.168.211.1') {
		address = iPAddresses.wlan0;
	} else {
		address = '127.0.0.1';
	}
	self.config.set('address', address)
};


Dstmmix.prototype.restartService = function (serviceName, boot) {
	var self = this;
	var defer = libQ.defer();
	var command = "/usr/bin/sudo /bin/systemctl restart " + serviceName;
	exec(command, { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
		if (error !== null) {
			self.commandRouter.pushConsoleMessage('The following error occurred while starting ' + serviceName + ': ' + error);
			self.commandRouter.pushToastMessage('error', "Restart failed", "Restarting " + serviceName + " failed with error: " + error);
			defer.reject(new Error('Unable to restart service LMS'));
		}
		else {
			self.commandRouter.pushConsoleMessage(serviceName + ' started');
			if (boot == false)
				self.commandRouter.pushToastMessage('success', "Restarted " + serviceName, "Restarted " + serviceName + " for the changes to take effect.");
			defer.resolve();
		}
	});
	return defer.promise;
};

Dstmmix.prototype.stopService = function (serviceName) {
	var self = this;
	var defer = libQ.defer();
	var command = "/usr/bin/sudo /bin/systemctl stop " + serviceName;
	exec(command, { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
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

//--------------Tools Section----------------

//here we download and install tools
Dstmmix.prototype.installtools = function (data) {
  const self = this;
  return new Promise(async function (resolve, reject) {
    try {	
    let modalData = {
        title: 'Install in progress',
        message: 'Install of tools in progress, press "ESC" when end toast message appears at the bottom of the page.',
        size: 'lg'
      };	
      self.commandRouter.broadcastMessage("openModal", modalData);
      const child = require('child_process').exec('/bin/sh /data/plugins/music_service/dstmmix/installbliss.sh' );  
      await new Promise( (resolve) => {
    child.on('close', resolve), setTimeout(resolve, 8000)
    
});
self.commandRouter.pushToastMessage('info', 'Tool install finished');
}
   catch (err) {
      self.logger.error('An error occurs while downloading or installing tools');
     self.commandRouter.pushToastMessage('error', 'An error occurs while downloading or installing tools');
   }

    resolve()
     self.config.set('toolsinstalled', true);
      self.refreshUI();
      self.socket.emit('updateDb');
      self.commandRouter.pushToasitMessage('info', 'Tool install finshed')
 })        
 }