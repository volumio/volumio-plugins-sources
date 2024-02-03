'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;

// Define the Dstmmix class
module.exports = moode;


function moode(context) {
	var self = this;
	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;
}


moode.prototype.onVolumioStart = function()
{
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);
	self.getIP();
    return libQ.resolve();
}



moode.prototype.stop = function() {
	var self = this;
	var defer = libQ.defer();
	self.stopService('docker.socket')
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


moode.prototype.onStart = function() {
	var self = this;
	var defer = libQ.defer();
	self.restartService('docker.socket', true)
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
		self.commandRouter.pushToastMessage('error', "Startup failed", "Could not start docker in a fashionable manner.");
		self.logger.info("Could not start docker in a fashionable manner.");
		defer.reject(new error());
	});

	return defer.promise;
};

moode.prototype.onStop = function() {
	var self = this;
	var defer = libQ.defer();

	self.stopService('docker.socket')
	.then(function(edefer)
	{
		defer.resolve();
	})
	.fail(function(e)
	{
		self.commandRouter.pushToastMessage('error', "Stopping failed", "Could not stop docker in a fashionable manner, error: " + e);
		// Do not reject, in case user is uninstalling a possibly broken installation - rejecting will abort the process.
		defer.resolve();
	});

	return defer.promise;
};



moode.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};




// Configuration Methods -----------------------------------------------------------------------------

moode.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {
			var IPaddress = self.config.get('address');

			uiconf.sections[0].content.push(
				{
					"id": "section_account_logout",
					"element": "button",
					"label": "Open MOODE",
					"description": "Open Moode Audio Player in a webpage",
					"onClick": {
						"type": "openUrl",
						"url": "http://" + IPaddress + ":8008"
					}})

            defer.resolve(uiconf);
        })
        .fail(function()
        {
            defer.reject(new Error());
        });

    return defer.promise;
};



moode.prototype.getConfigurationFiles = function() {
	return ['config.json'];
}



moode.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};



moode.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};



moode.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};







// Public Methods ---------------------------------------------------------------------------------------
moode.prototype.getIP = function () {
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

moode.prototype.alsaconf = function (data) {
    const self = this;
	const defer = libQ.defer();
    
    exec('/bin/sh /data/plugins/music_service/moode/Alsamod.sh', { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
		if (error !== null) {
            self.logger.error('Failed to execute Alsamod.sh: ' + error);
            self.commandRouter.pushToastMessage('error', 'Failed to execute Alsamod.sh', error);
		  defer.reject(error);
		} else {
            self.logger.info('Alsamod.sh executed successfully.');
            self.commandRouter.pushToastMessage('success', 'Alsamod.sh executed successfully.');
		  defer.resolve();
		}
	  });

	  return defer.promise;
	};
moode.prototype.alsarestore = function (data) {
        const self = this;
        const defer = libQ.defer();
        
        exec('/bin/sh /data/plugins/music_service/moode/Alsareverse.sh', { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
            if (error !== null) {
                self.logger.error('Failed to execute Alsamod.sh: ' + error);
                self.commandRouter.pushToastMessage('error', 'Failed to execute Alsamod.sh', error);
              defer.reject(error);
            } else {
                self.logger.info('Alsareverse.sh executed successfully.');
                self.commandRouter.pushToastMessage('success', 'Alsareverse.sh executed successfully.');
              defer.resolve();
            }
          });
    
          return defer.promise;
    };
    
moode.prototype.blueconf = function (data) {
			const self = this;
			const defer = libQ.defer();
			
			exec('/bin/sh /data/plugins/music_service/moode/Bluemod.sh', { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
				if (error !== null) {
					self.logger.error('Failed to execute Bluemod.sh: ' + error);
					self.commandRouter.pushToastMessage('error', 'Failed to execute Bluemod.sh', error);
				  defer.reject(error);
				} else {
					self.logger.info('Bluemod.sh executed successfully.');
					self.commandRouter.pushToastMessage('success', 'Bluemod.sh executed successfully.');
				  defer.resolve();
				}
			  });
		
			  return defer.promise;
	};	
moode.prototype.bluerestore = function (data) {
				const self = this;
				const defer = libQ.defer();
				
				exec('/bin/sh /data/plugins/music_service/moode/Bluereverse.sh', { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
					if (error !== null) {
						self.logger.error('Failed to execute Bluereverse.sh: ' + error);
						self.commandRouter.pushToastMessage('error', 'Failed to execute Bluereverse.sh', error);
					  defer.reject(error);
					} else {
						self.logger.info('Bluereverse.sh executed successfully.');
						self.commandRouter.pushToastMessage('success', 'Bluereverse.sh executed successfully.');
					  defer.resolve();
					}
				  });
			
				  return defer.promise;
	};

moode.prototype.volumioconf = function (data) {
					const self = this;
					const defer = libQ.defer();
					
					exec('/bin/sh /data/plugins/music_service/moode/Volumiomod.sh', { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
						if (error !== null) {
							self.logger.error('Failed to execute Volumiomod.sh: ' + error);
							self.commandRouter.pushToastMessage('error', 'Failed to execute Volumiomod.sh', error);
						  defer.reject(error);
						} else {
							self.logger.info('Volumiomod.sh executed successfully.');
							self.commandRouter.pushToastMessage('success', 'Volumiomod.sh executed successfully.');
						  defer.resolve();
						}
					  });
				
					  return defer.promise;
	};				
moode.prototype.volumiorestore = function (data) {
						const self = this;
						const defer = libQ.defer();
						
						exec('/bin/sh /data/plugins/music_service/moode/Volumioreverse.sh', { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
							if (error !== null) {
								self.logger.error('Failed to execute Volumioreverse.sh: ' + error);
								self.commandRouter.pushToastMessage('error', 'Failed to execute Volumioreverse.sh', error);
							  defer.reject(error);
							} else {
								self.logger.info('Bluereverse.sh executed successfully.');
								self.commandRouter.pushToastMessage('success', 'Volumioreverse.sh executed successfully. May have to reboot...');
							  defer.resolve();
							}
						  });
					
						  return defer.promise;
	};

	moode.prototype.restartService = function (serviceName, boot)
	{
		var self = this;
		var defer=libQ.defer();
		var command = "/usr/bin/sudo /bin/systemctl restart " + serviceName;
		exec(command, {uid:1000,gid:1000}, function (error, stdout, stderr) {
			if (error !== null) {
				self.commandRouter.pushConsoleMessage('The following error occurred while starting ' + serviceName + ': ' + error);
				self.commandRouter.pushToastMessage('error', "Restart failed", "Restarting " + serviceName + " failed with error: " + error);
				defer.reject(new Error('Unable to restart service DOCKER'));
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



	moode.prototype.stopService = function (serviceName)
{
	var self = this;
	var defer=libQ.defer();
	var command = "/usr/bin/sudo /bin/systemctl stop " + serviceName;
	exec(command, {uid:1000,gid:1000}, function (error, stdout, stderr) {
		if (error !== null) {
			self.commandRouter.pushConsoleMessage('The following error occurred while stopping ' + serviceName + ': ' + error);
			self.commandRouter.pushToastMessage('error', "Stopping service failed", "Stopping " + serviceName + " failed with error: " + error);
			defer.reject(new Error('Unable to stop service DOCKER'));
		}
		else {
			self.commandRouter.pushConsoleMessage(serviceName + ' stopped');
			self.commandRouter.pushToastMessage('success', "Stopping", "Stopped " + serviceName + ".");
			defer.resolve();
		}
	});
	return defer.promise;
};