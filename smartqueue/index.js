'use strict';

var libQ = require('kew');
var fs = require('fs-extra');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;


// Define the blissify class
module.exports = smartqueue;


function smartqueue(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;
};

smartqueue.prototype.onVolumioStart = function () 
 {
	var self = this;
	var configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);

	setTimeout(() => {
		exec('/usr/bin/python3 /data/plugins/user_interface/smartqueue/unit/corechooser.py', (error, stdout, stderr) => {
			console.log('Executing corechooser.py...');

			if (error) {
				console.error(`Error executing corechooser.py: ${error.message}`);
				return;
			}

			console.log(`Output: ${stdout}`);
			if (stderr) {
				console.error(`stderr: ${stderr}`);
			}
		});

	}, 5000); // 2000 milliseconds delay
 
	return libQ.resolve();
 };

 smartqueue.prototype.getConfigurationFiles = function () {
	var self = this;
	return ['config.json'];
 };

// Plugin methods -----------------------------------------------------------------------------
smartqueue.prototype.onStop = function () {
	var self = this;
	var defer = libQ.defer();

	exec("/usr/bin/pgrep shellinabox | xargs -r /bin/kill -15", (err, stdout, stderr) => {
		if (err) {
			console.error(`Error killing shellinabox: ${err}`);
		}
		exec("/usr/bin/pgrep blissify | xargs -r /bin/kill -15", (err, stdout, stderr) => {
			if (err) {
				console.error(`Error killing blissify: ${err}`);
			}
			exec("/usr/bin/pgrep python3 | xargs -r /bin/kill -15", (err, stdout, stderr) => {
				if (err) {
					console.error(`Error killing python3: ${err}`);
				}
				defer.resolve();
			});
		});
	});
	return libQ.resolve();
};


smartqueue.prototype.onStart = function () {
	var self = this;
	var defer = libQ.defer();
	// exec("/usr/bin/pgrep blissify | xargs -r /bin/kill -15", (err, stdout, stderr) => {
	// 	if (err) {
	// 		console.error(`Error killing blissify: ${err}`);
	// 	}
		exec("/usr/bin/pgrep shellinabox | xargs -r /bin/kill -15", (err, stdout, stderr) => {
			if (err) {
				console.error(`Error killing shellinabox: ${err}`);
			}

			exec("/bin/sh /data/plugins/user_interface/smartqueue/unit/shellbox.sh", (err, stdout, stderr) => {
				if (err) {
					console.error(`Error launching shellbox: ${err}`);
				}

				setTimeout(() => {
					exec('/usr/bin/python3 /data/plugins/user_interface/smartqueue/unit/corechooser.py', (error, stdout, stderr) => {
						console.log('Executing corechooser.py...');
			
						if (error) {
							console.error(`Error executing corechooser.py: ${error.message}`);
							return;
						}
			
						console.log(`Output: ${stdout}`);
						if (stderr) {
							console.error(`stderr: ${stderr}`);
						}
					});
				}, 5000); // 2000 milliseconds delay
			});
		});
	// });

	self.getIP();
	defer.resolve();
	return libQ.resolve();
}

smartqueue.prototype.onRestart = function () {
	// Do nothing
	var self = this;

	var defer = libQ.defer();

	// exec("/usr/bin/pgrep blissify | xargs -r /bin/kill -15", (err, stdout, stderr) => {
	// 	if (err) {
	// 		console.error(`Error killing blissify: ${err}`);
	// 	}
		exec("/usr/bin/pgrep shellinabox | xargs -r /bin/kill -15", (err, stdout, stderr) => {
			if (err) {
				console.error(`Error killing shellinabox: ${err}`);
			}

			exec("/bin/sh /data/plugins/user_interface/smartqueue/unit/shellbox.sh", (err, stdout, stderr) => {
				if (err) {
					console.error(`Error launching shellbox: ${err}`);
				}

				setTimeout(() => {
					exec('/usr/bin/python3 /data/plugins/user_interface/smartqueue/unit/corechooser.py', (error, stdout, stderr) => {
						console.log('Executing corechooser.py...');
			
						if (error) {
							console.error(`Error executing corechooser.py: ${error.message}`);
							return;
						}
			
						console.log(`Output: ${stdout}`);
						if (stderr) {
							console.error(`stderr: ${stderr}`);
						}
					});
				}, 5000); // 2000 milliseconds delay
			});
		});
	// });
	defer.resolve();
	return libQ.resolve();
};

smartqueue.prototype.saveSettings = function (data) {
	var self = this;
	this.config.set('Autoqueue', data['Autoqueue']);
	this.config.set('Blissmixer', data['Blissmixer']);
	this.config.set('Tracksn', data['Tracksn']);
	this.config.set('Drift', data['Drift']);


	setTimeout(() => {
		exec('/usr/bin/python3 /data/plugins/user_interface/smartqueue/unit/corechooser.py', (error, stdout, stderr) => {
			console.log('Executing corechooser.py...');

			if (error) {
				console.error(`Error executing corechooser.py: ${error.message}`);
				return;
			}

			console.log(`Output: ${stdout}`);
			if (stderr) {
				console.error(`stderr: ${stderr}`);
			}
		});
	}, 2000); // 2000 milliseconds delay

	this.commandRouter.pushToastMessage('success', "Success at applying " + data['Autoqueue'] + " " + data['Blissmixer'] + " " + data['Tracksn'] + " " + data['Drift']);
};


smartqueue.prototype.getUIConfig = function () {
	var self = this;
	var defer = libQ.defer();

	var lang_code = this.commandRouter.sharedVars.get('language_code');
	self.logger.info("Loaded the previous config.");
	self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
		__dirname + '/i18n/strings_en.json',
		__dirname + '/UIConfig.json')
		.then(function (uiconf) {

			var IPaddress = self.config.get('address');
			self.logger.info("Autoqueue: " + self.config.get('Autoqueue'));
			self.logger.info("Blissmixer: " + self.config.get('Blissmixer'));
			self.logger.info("Tracksn: " + self.config.get('Tracksn'));
			self.logger.info("Drift: " + self.config.get('Drift'));

			uiconf.sections[0].content.push(
				{
					'id': 'Autoqueue',
					'element': 'switch',
					'label': 'Enable lastfm Infinite mix',
					'doc': 'This will add x similar local tracks based on lastfm recommandations, and complete up to x with similar genre tracks if needed',
					'value': self.config.get('Autoqueue')
				})
			uiconf.sections[0].content.push(
				{
					'id': 'Blissmixer',
					'element': 'switch',
					'label': 'Enable blissify mix',
					'doc': 'This will add x similar metric local track based on blissify database and euclydian distance calculation',
					'value': self.config.get('Blissmixer')
				})
			uiconf.sections[0].content.push(
				{
					"id": "Tracksn",
					"type": "text",
					"element": "input",
					"doc": "Number of tracks to push to the queue using lastfm, blissify or genre",
					"label": "Number of tracks to push",
					'value': self.config.get('Tracksn')
				}),

				uiconf.sections[0].content.push(
					{
						"id": "Drift",
						"element": "equalizer",
						"doc": "Number of tracks to drift from lastfm or blissify, to avoid repetition (typical 0,1,2)",
						"label": "Number of tracks to drift",
						"config": {
							"orientation": "horizontal",
							"bars": [
								{
									"min": "0",
									"max": "2",
									"step": "1",
									"value": self.config.get('Drift'),
									"tooltip": "always"
								}
							]
						}
					}),

			uiconf.sections[0].saveButton.data.push('Autoqueue')
			uiconf.sections[0].saveButton.data.push('Blissmixer')
			uiconf.sections[0].saveButton.data.push('Tracksn')
			uiconf.sections[0].saveButton.data.push('Drift')

			uiconf.sections[1].content.push(
				{
					"id": "advanced",
					"element": "button",
					"label": "Install Blissify",
					"description": "Install Blissify , output in a webconsole",
					"onClick": {
						"type": "openUrl",
						"url": "http://" + IPaddress + ":10002/install"
					}
				})

			uiconf.sections[1].content.push(
				{
					"id": "advanced",
					"element": "button",
					"label": "Bliss library analysis",
					"description": "Bliss analyse your library (500-1000 files/hours) , output in a webconsole",
					"onClick": {
						"type": "openUrl",
						"url": "http://" + IPaddress + ":10003/update"
					}
				})

			defer.resolve(uiconf);
		})
		.fail(function () {
			defer.reject(new Error());
		});
	return defer.promise;
};

smartqueue.prototype.setUIConfig = function (data) {
	var self = this;
	self.logger.info("Updating UI config");
	var uiconf = fs.readJsonSync(__dirname + '/UIConfig.json');
	return libQ.resolve();
};

smartqueue.prototype.getConf = function (varName) {
	var self = this;
  
	self.config = new (require('v-conf'))();
	self.config.loadFile(configFile);
  };

smartqueue.prototype.setConf = function (varName, varValue) {
	var self = this;
  
	fs.writeJsonSync(self.configFile, JSON.stringify(conf));
  };

// Public Methods ---------------------------------------------------------------------------------------

smartqueue.prototype.getIP = function () {
	var self = this;
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
