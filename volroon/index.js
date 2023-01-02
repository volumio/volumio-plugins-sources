'use strict';

var libQ = require('kew');
var fs = require('fs-extra');
var exec = require('child_process').exec;
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var RoonApi = require("node-roon-api");
var RoonApiTransport = require("node-roon-api-transport");

var core;
var zone;
var zoneid;
var zonename;
var roon;
var outputdevicename;
var roonIsActive = false;
var roonPausedTimer;
var coreFound;

const msgMap = new Map();
msgMap.set('playing', 'play')
msgMap.set('paused', 'pause')
msgMap.set('loading', 'pause')
msgMap.set('stopped', 'stop')

module.exports = volroon;

function volroon(context) {
	var self = this;
	// Save a reference to the parent commandRouter
	self.context = context;
	self.commandRouter = self.context.coreCommand;
	self.logger = self.commandRouter.logger;
	self.configManager = self.context.configManager;
	self.coreip;
	self.coreport;
	self.coreid;
	self.corename;
	this.state = {
		status: 'stop',
		service: 'volroon',
		title: '',
		artist: '',
		album: '',
		albumart: '/albumart',
		uri: '',
		trackType: 'roon',
		seek: 0,
		duration: 0,
		samplerate: '',
		bitdepth: '',
		bitrate: '',
		channels: 2,
		stream: false,
		random: false,
		repeat: false,
		repeatSingle: false,
		disableUiControls: false
	}
	self.is_next_allowed = false;
	self.is_previous_allowed = false;
	self.is_pause_allowed = false;
	self.is_play_allowed = true;
	self.is_seek_allowed = false;


}

volroon.prototype.roonListener = function () {
	var self = this;
	roon = new RoonApi({
		// Make it look like an existing built-in Roon extension and you don't need to approve it in the UI.
		extension_id: 'com.roonlabs.display_zone', // I think I only need to keep this one constant to avoid needing auth in Roon.
		display_name: 'volroon - Roon Bridge on Volumio',
		display_version: '1.0.0',
		publisher: 'Dale Rider',
		email: 'dale@sempervirens.co.za',
		log_level: 'none',


		core_found: function (core_) {
			core = core_;
			core.services.RoonApiTransport.subscribe_zones(function (response, msg) {

				if (response && (response == "Subscribed" || response == "Changed")) {

					if (msg?.zones || msg?.zones_added || msg?.zones_changed) {
						self.indentifyZone(msg)
							.then(() => {
								self.chooseTheRightCore()
							})
							.then(() => {
								self.updateMetadata(msg)
							})
							.fail(err => {
								self.logger.error(`volroon::Metadata - ${err}`);
							});


					}

					if (msg && msg.zones_seek_changed && roonIsActive) {
						try {
							msg.zones_seek_changed.find(zone => {
								if (zone.zone_id === zoneid) {
									if (zone.seek_position && Math.abs((zone.seek_position * 1000) - self.state.seek) > 1500) {
										self.state.seek = zone.seek_position * 1000;
										self.pushState();
									} else {
										self.state.seek = zone.seek_position * 1000;
									}

								}
							});
							// self.pushState();
						} catch (e) {
							self.logger.error(`volroon::Seek change - ${e}`);
						}
					}
				}
				// if (Date.now() - roonPausedTimer >= 10000) {
				// 	roonPausedTimer = null;
				// 	self.stop();
				// }
			})
		},

		core_lost: function (core_) {

		}
	});

	roon.init_services({
		required_services: [RoonApiTransport]
	});

	roon.start_discovery();
	self.logger.info(this.state.service + '::Roon API Services Started');

}

volroon.prototype.chooseTheRightCore = function () {
	var self = this;
	var defer = libQ.defer()
	//Get the Core IP and Port. If you have multiple cores or even just 2 PC's running Roon, finding the right core by just looking at core.moo.transport.host will be a hit and miss.
	if (zoneid && core.services.RoonApiTransport._zones && core.services.RoonApiTransport._zones[zoneid] && !coreFound) {

		self.coreip = core.moo.transport.host ? core.moo.transport.host : '';
		self.coreport = core.moo.transport.port ? core.moo.transport.port : '';
		self.coreid = core.core_id ? core.core_id : '';
		self.corename = core.display_name ? core.display_name : '';

		if (self.coreip && self.coreport) coreFound = core;
		self.logger.info(`${this.state.service}::Roon Core Identified: ${self.coreip}:${self.coreport} with ID of: ${self.coreid}`)
		self.state.disableUiControls = false;

	} else if (!coreFound) {

		self.state.disableUiControls = true; // If the core isn't found then this will prevent the Volumio controls from working and causing a state mismatch.

	}

	defer.resolve();
	return defer.promise;

}

volroon.prototype.indentifyZone = function (msg) {
	var self = this;
	var defer = libQ.defer();

	// Get the zoneid for the device
	if ((zoneid == undefined) || (msg?.zones_added)) {
		// let zone = [...msg?.zones?.values()].find((zone) => zone?.outputs[0]?.source_controls[0]?.display_name === device);
		zone = [...((msg?.zones ? msg.zones : msg?.zones_changed ? msg.zones_changed : msg?.zones_added)).values()].find(zone => {
			return zone?.outputs[0]?.source_controls[0]?.display_name === outputdevicename
		})

		zoneid = zone?.zone_id;
		zonename = zone?.display_name;

	}

	zoneid ? defer.resolve(zoneid) : defer.reject();
	return defer.promise;
}

volroon.prototype.updateMetadata = function (msg) {
	var self = this;
	var defer = libQ.defer();


	zone = (msg?.zones ? msg.zones : msg?.zones_changed ? msg?.zones_changed : msg.zones_added).find(zone => {
		return zone?.zone_id === zoneid;
	})
	self.logger.debug('volroon::updateMetadata zone: \n' + JSON.stringify(zone, null, ' '));


	if (zone) {
		if (zone.state == 'playing') {
			self.setRoonActive();

		}

		// This was a plan to have Volumio clear everything if Roon was sitting "paused" for long enough. I.e. you're gone.
		if (zone && zone.state == 'paused' && roonIsActive && !roonPausedTimer) roonPausedTimer = Date.now();

		// if (zone.state == 'paused' && roonIsActive && roonPausedTimer) {
		// 	if (Date.now() - roonPausedTimer >= 600000) {
		// 		roonPausedTimer = null;
		// 		self.setRoonInactive();
		// 	}
		// }

		if (roonIsActive || roonPausedTimer) {

			self.state.status = zone.state ? msgMap.get(zone.state) : 'play';
			self.state.title = zone.now_playing ? zone.now_playing.three_line.line1 : '';
			self.state.artist = zone.now_playing ? zone.now_playing.three_line.line2 : '';
			self.state.album = zone.now_playing ? zone.now_playing.three_line.line3 : '';
			self.state.albumart = zone.now_playing ? this.getAlbumArt(zone.now_playing.image_key) : '/albumart';
			self.state.uri = '';
			self.state.seek = zone.now_playing ? zone.now_playing.seek_position * 1000 : 0;
			self.state.duration = zone.now_playing ? zone.now_playing.length : 0;
			self.state.stream = self.state.duration === 0 ? true : false;
			self.state.random = zone.settings ? zone.settings.shuffle : false;
			if (zone.settings) {
				if (zone.settings.loop === 'loop') {
					self.state.repeat = true
					self.state.repeatSingle = false
				} else if (zone.settings.loop === 'loop_one') {
					self.state.repeat = true
					self.state.repeatSingle = true
				} else {
					self.state.repeat = false
					self.state.repeatSingle = false
				}

			}

			// self.state.samplerate = '';
			// self.state.bitdepth = '';
			// self.state.bitrate = '';
			self.state.channels = 2;

			self.is_next_allowed = zone ? zone.is_next_allowed : true;
			self.is_previous_allowed = zone ? zone.is_previous_allowed : true;
			self.is_pause_allowed = zone ? zone.is_pause_allowed : true;
			self.is_play_allowed = zone ? zone.is_play_allowed : false;
			self.is_seek_allowed = zone ? zone.is_seek_allowed : true;

			self.logger.verbose(`${this.state.service}::State snapshot: ${JSON.stringify(self.state, null, '')}`);
			self.pushState();
			defer.resolve();

		}
	}
	return defer.promise;
}

volroon.prototype.setRoonActive = function () {
	var self = this;

	if (!roonIsActive) {
		var state = self.getState();
		if (state && state.service && state.service !== this.state.service) {
			if (self.commandRouter.stateMachine.isVolatile) {
				self.commandRouter.stateMachine.unSetVolatile();
			} else {
				self.volumioStop();
				self.context.coreCommand.stateMachine.resetVolumioState();
			}
		}

		roonIsActive = true;

		setTimeout(() => {
			self.commandRouter.stateMachine.setVolatile({
				service: 'volroon',
				callback: self.unsetVol.bind(self)
			})
			self.logger.info('volroon::Setting volatile state to volroon');
			self.pushState();
			this.commandRouter.pushToastMessage('info', 'volroon', 'Roon Bridge is active.');
		}, 1000);
	}
};

volroon.prototype.setRoonInactive = function () {
	var self = this;
	roonIsActive = false;
	// coreFound = false;
};

//The unsetVolatile callback will be called when "stop" is pushed or called.
volroon.prototype.unsetVol = function () {
	var self = this;

	var state = self.getState();
	if (state && state.service && state.service !== 'volroon' && self.commandRouter.stateMachine.isVolatile) {
		return self.stop();
	} else {
		setTimeout(() => {
			return libQ.resolve();
		}, 1500);
	}
	return self.stop();

};

volroon.prototype.outputDeviceCallback = function () { // Callback registered to alsa.outputdevice sharedVars - update the device on this end to stay in sync with Roon
	var self = this;

	zoneid = undefined;

	this.getOutputDeviceName();

	self.logger.info(`${this.state.service}::Output device has changed`);

};

volroon.prototype.getZones = function () {
	var self = this;
	core.services.RoonApiTransport.get_zones(function (err, zones) {
		if (!err) {
			self.indentifyZone(zones);
		}
	})
}

// Optional functions exposed for making development easier and more clear
volroon.prototype.getSystemConf = function (pluginName, varName) {
};

volroon.prototype.setSystemConf = function (pluginName, varName) {
};

volroon.prototype.getAdditionalConf = function (type, controller, data) {
	var self = this;
	return self.context.coreCommand.executeOnPlugin(type, controller, 'getConfigParam', data);
};

volroon.prototype.setAdditionalConf = function () {
};

volroon.prototype.checkAudioDeviceAvailable = function () {
	// I am looking at a way to be able to check the audio device before Roon starts playing and generates an error
	// on that end. Unlikely, though, because RoonBridge is self-contained and closed source.

	return self.coreCommand.executeOnPlugin('audio_interface', 'alsa_controller', 'checkAudioDeviceAvailable', '');
}

volroon.prototype.getOutputDeviceName = function () {
	var self = this;
	var cards = self.context.coreCommand.executeOnPlugin('audio_interface', 'alsa_controller', 'getAplayInfo', '');

	let outputdeviceid = self.getAdditionalConf('audio_interface', 'alsa_controller', 'outputdevice');

	try {
		cards.forEach((card) => {
			if (card.id === outputdeviceid) {
				outputdevicename = card.name;
			}
		});
	} catch (e) {
		self.logger.error(`volroon::getOutputDeviceName Error: ${e}`);
	}

};

volroon.prototype.onVolumioStart = function () {
	var self = this;

	this.commandRouter.sharedVars.registerCallback('alsa.outputdevice', this.outputDeviceCallback.bind(this));

	var configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);
	this.loadI18n();
	return libQ.resolve();
};

volroon.prototype.onStart = function () {
	var self = this;
	var defer = libQ.defer();

	// This is used when autodetecting the Zone to use in Roon
	this.getOutputDeviceName();

	exec('/usr/bin/sudo /bin/systemctl start roonbridge.service', { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
		if (error) {
			self.logger.error('::Cannot start Roon Bridge - Error: ' + error);
			defer.reject(error);
		} else {
			self.logger.info('::Roon Bridge has successfully started ')

		}
	});

	self.roonListener();

	defer.resolve('');
	return defer.promise;
};

volroon.prototype.onStop = function () {
	var self = this;
	var defer = libQ.defer();

	exec('/usr/bin/sudo /bin/systemctl stop roonbridge.service', { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
		if (error) {
			self.logger.error('::Cannot kill Roon Bridge - Error: ' + error);
			defer.reject(error);
		} else {
			self.logger.info('::Roon Bridge has been successfully shutdown ')

		}
	});

	defer.resolve('');
	return defer.promise;
};

volroon.prototype.onRestart = function () {
	var self = this;
	var defer = libQ.defer();

	// This is used when autodetecting the Zone to use in Roon
	this.getOutputDeviceName();

	exec('/usr/bin/sudo /bin/systemctl restart roonbridge.service', { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
		if (error) {
			self.logger.error('::Cannot start Roon Bridge - Error: ' + error);
			defer.reject(error);
		} else {
			self.logger.info('::Roon Bridge has successfully started ')

		}
	});

	self.roonListener();

	defer.resolve('');
	return defer.promise;
};


// Configuration Methods -----------------------------------------------------------------------------
// loadI18n and getI18n functions from Spotify plugin (https://github.com/volumio/volumio-plugins-sources/tree/master/spotify)
volroon.prototype.loadI18n = function () {
	var self = this;

	try {
		var language_code = this.commandRouter.sharedVars.get('language_code');
		self.i18n = fs.readJsonSync(__dirname + '/i18n/strings_' + language_code + ".json");
	} catch (e) {
		self.i18n = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
	}

	self.i18nDefaults = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
};

volroon.prototype.getI18n = function (key) {
	var self = this;

	if (key.indexOf('.') > 0) {
		var mainKey = key.split('.')[0];
		var secKey = key.split('.')[1];
		if (self.i18n[mainKey][secKey] !== undefined) {
			return self.i18n[mainKey][secKey];
		} else {
			return self.i18nDefaults[mainKey][secKey];
		}

	} else {
		if (self.i18n[key] !== undefined) {
			return self.i18n[key];
		} else {
			return self.i18nDefaults[key];
		}

	}
};

volroon.prototype.getUIConfig = function () {
	var defer = libQ.defer();
	var self = this;

	var lang_code = this.commandRouter.sharedVars.get('language_code');

	self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
		__dirname + '/i18n/strings_en.json',
		__dirname + '/UIConfig.json')
		.then(function (uiconf) {


			self.configManager.setUIConfigParam(uiconf, 'sections[1].content[0].value', self.corename ? self.corename : self.getI18n('NOT_DETECTED'));

			self.configManager.setUIConfigParam(uiconf, 'sections[1].content[1].value', (self.coreip && self.coreport) ? `${self.coreip}:${self.coreport}` : self.getI18n('NOT_DETECTED'));

			self.configManager.setUIConfigParam(uiconf, 'sections[1].content[2].value', zonename ? zonename : self.getI18n('NOT_DETECTED'));

			self.configManager.setUIConfigParam(uiconf, 'sections[1].content[3].value', outputdevicename ? outputdevicename : self.getI18n('NOT_DETECTED'));


			defer.resolve(uiconf);
		})
		.fail(function () {
			defer.reject(new Error());
		});

	return defer.promise;
};

volroon.prototype.getConfigurationFiles = function () {
	return ['config.json'];
}

volroon.prototype.setUIConfig = function (data) {
	var self = this;
	//Perform your installation tasks here
};

volroon.prototype.getConf = function (varName) {
	var self = this;
	//Perform your installation tasks here
};

volroon.prototype.setConf = function (varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};



// Playback Controls ---------------------------------------------------------------------------------------
// If your plugin is not a music_sevice don't use this part and delete it


volroon.prototype.addToBrowseSources = function () {

	// Use this function to add your music service plugin to music sources
	//var data = {name: 'Spotify', uri: 'spotify',plugin_type:'music_service',plugin_name:'spop'};
	this.commandRouter.volumioAddToBrowseSources(data);
};

volroon.prototype.handleBrowseUri = function (curUri) {
	var self = this;

	//self.commandRouter.logger.info(curUri);
	var response;


	return response;
};

// Roon control method
volroon.prototype.roonControl = function (zoneid, control) {
	var self = this;
	var currentState = self.state.status;

	if (zoneid != undefined && control != undefined && coreFound != false) {
		try {
			coreFound.services.RoonApiTransport.control(zoneid, control, (err) => {
				if (err) {
					self.commandRouter.pushConsoleMessage(`${this.state.service}::Unable to send ${control} command to Roon - Error: ${err}`);
					//Otherwise Volumio sits around with a mismatched state.
					self.state.status = currentState;
					self.pushState();
				} else {
					self.commandRouter.pushConsoleMessage(`${this.state.service}::${control} command successfully sent to Roon.`);
				}
			})
		} catch (err) {
			self.logger.error(`volroon::roonControl - ${err}`);
			self.state.status = currentState;
			self.pushState();
		}
	}
}

// Roon settings (shuffle and repeat)
volroon.prototype.roonSettings = function (zoneid, settings) {
	var self = this;
	var currentState = self.state.status;

	if (zoneid != undefined && settings != undefined && coreFound != false) {
		try {
			coreFound.services.RoonApiTransport.change_settings(zoneid, settings, (err) => {
				if (err) {
					self.commandRouter.pushConsoleMessage(`${this.state.service}::Unable to send ${JSON.stringify(settings, null, '')} command to Roon - Error: ${err}`);
					//Otherwise Volumio sits around with a mismatched state.
					self.state.status = currentState;
					self.pushState();
				} else {
					self.commandRouter.pushConsoleMessage(`${this.state.service}::${JSON.stringify(settings, null, '')} command successfully sent to Roon.`);
				}
			})
		} catch (err) {
			self.logger.error(`volroon::roonSettings - ${err}`);
			//Otherwise Volumio sits around with a mismatched state.
			self.state.status = currentState;
			self.pushState();
		}
	}

}

volroon.prototype.seek = function (timepos) {
	var self = this;
	if (zoneid != undefined && timepos != undefined && coreFound != false) {
		try {
			return coreFound.services.RoonApiTransport.seek(zone, 'absolute', (timepos / 1000), (err) => {
				if (err) {
					self.commandRouter.pushConsoleMessage(`${this.state.service}::Unable to send seek command to Roon - Error: ${err}`);
				} else {
					self.commandRouter.pushConsoleMessage(`${this.state.service}::seek to ${timepos} command successfully sent to Roon.`);
				}
			})
		} catch (err) {
			self.logger.error(`volroon::roonSeek - ${err}`);
		}
	}

};

// Stop
volroon.prototype.stop = function () {
	var self = this;

	if (roonIsActive) {
		self.roonControl(zoneid, 'stop');
		self.setRoonInactive();
	}

	var state = self.getState();
	if (state && state.service && state.service === 'volroon') {
		self.logger.info(this.state.service + '::Roon Playback Stopped, clearing state');
		self.context.coreCommand.stateMachine.resetVolumioState();
	}

	// self.commandRouter.stateMachine.playQueue.clearPlayQueue();

};

//Volumio Stop - To kill currently running services before we start ours.
volroon.prototype.volumioStop = function () {
	var self = this;
	// if (!roonIsActive) {
	// 	self.logger.info(this.state.service + '::Stopping currently active service');
	return this.commandRouter.volumioStop();
	// } else {
	// 	self.logger.warn(this.state.service + '::Not requesting volumioStop on our own service');
	// }
}

// Volumio controls
volroon.prototype.pause = function () {
	var self = this;
	if (this.is_pause_allowed) self.roonControl(zoneid, 'pause');

};

volroon.prototype.play = function () {
	var self = this;
	if (this.is_play_allowed) self.roonControl(zoneid, 'play');


};

volroon.prototype.next = function () {
	var self = this;
	if (this.is_next_allowed) self.roonControl(zoneid, 'next');
};

volroon.prototype.previous = function () {
	var self = this;
	if (this.is_previous_allowed) self.roonControl(zoneid, 'previous');
};

volroon.prototype.random = function (value) {
	var self = this;
	self.roonSettings(zoneid, { 'shuffle': value ? true : false })
}

volroon.prototype.repeat = function (value, repeatSingle) {
	var self = this;
	self.roonSettings(zoneid, { 'loop': repeatSingle && value ? 'loop_one' : value && !repeatSingle ? 'loop' : 'disabled' })
}

// Get state
volroon.prototype.getState = function () {
	var self = this;
	self.commandRouter.pushConsoleMessage(this.state.service + '::getState');
	return self.commandRouter.stateMachine.getState();

};

// Announce updated State
volroon.prototype.pushState = function () {
	var self = this;
	self.commandRouter.pushConsoleMessage(this.state.service + '::pushState');

	return self.commandRouter.servicePushState(this.state, this.state.service);
};


volroon.prototype.explodeUri = function (uri) {
	var self = this;
	var defer = libQ.defer();

	// Mandatory: retrieve all info for a given URI

	return defer.promise;
};

volroon.prototype.getAlbumArt = function (image_key = '') {
	var self = this;

	if (image_key && self.coreip && self.coreport) {
		return `http://${self.coreip}:${self.coreport}/api/image/${image_key}`
	} else {
		return '/albumart';
	}
};

volroon.prototype.search = function (query) {
	var self = this;
	var defer = libQ.defer();

	// Mandatory, search. You can divide the search in sections using following functions

	return defer.promise;
};

volroon.prototype._searchArtists = function (results) {

};

volroon.prototype._searchAlbums = function (results) {

};

volroon.prototype._searchPlaylists = function (results) {


};

volroon.prototype._searchTracks = function (results) {

};

volroon.prototype.goto = function (data) {
	var self = this
	var defer = libQ.defer()

	// Handle go to artist and go to album function

	return defer.promise;
};

/* Example of a Zones object:

{
 "zones": [
	{
	 "zone_id": "1601f7a018710165756f42bbb2c86b46657e",
	 "display_name": "DACPi",
	 "outputs": [
		{
		 "output_id": "1701f7a018710165756f42bbb2c86b46657e",
		 "zone_id": "1601f7a018710165756f42bbb2c86b46657e",
		 "can_group_with_output_ids": [
			"1701f7a018710165756f42bbb2c86b46657e"
		 ],
		 "display_name": "DACPi",
		 "source_controls": [
			{
			 "control_key": "1",
			 "display_name": "E50",
			 "supports_standby": false,
			 "status": "indeterminate"
			}
		 ]
		}
	 ],
	 "state": "paused",
	 "is_next_allowed": true,
	 "is_previous_allowed": true,
	 "is_pause_allowed": false,
	 "is_play_allowed": true,
	 "is_seek_allowed": true,
	 "queue_items_remaining": 3,
	 "queue_time_remaining": 709,
	 "settings": {
		"loop": "disabled",
		"shuffle": false,
		"auto_radio": true
	 },
	 "now_playing": {
		"seek_position": 73,
		"length": 237,
		"one_line": {
		 "line1": "Castle Park - Julian Lage"
		},
		"two_line": {
		 "line1": "Castle Park",
		 "line2": "Julian Lage"
		},
		"three_line": {
		 "line1": "Castle Park",
		 "line2": "Julian Lage",
		 "line3": "View With A Room"
		},
		"image_key": "5843e4d4177374d885f6d9146420f82e",
		"artist_image_keys": [
		 "571aea9d5754fa472627adb52a956fc6"
		]
	 }
	},
	{
	 "zone_id": "160196a025d51a20bcbe38e7ddb58aa91545",
	 "display_name": "Shairport",
	 "outputs": [
		{
		 "output_id": "170196a025d51a20bcbe38e7ddb58aa91545",
		 "zone_id": "160196a025d51a20bcbe38e7ddb58aa91545",
		 "can_group_with_output_ids": [
			"170196a025d51a20bcbe38e7ddb58aa91545"
		 ],
		 "display_name": "Shairport",
		 "volume": {
			"type": "number",
			"min": 1,
			"max": 100,
			"value": 25,
			"step": 1,
			"is_muted": false,
			"hard_limit_min": 1,
			"hard_limit_max": 100,
			"soft_limit": 100
		 },
		 "source_controls": [
			{
			 "control_key": "1",
			 "display_name": "Volumio",
			 "supports_standby": false,
			 "status": "indeterminate"
			}
		 ]
		}
	 ],
	 "state": "paused",
	 "is_next_allowed": true,
	 "is_previous_allowed": true,
	 "is_pause_allowed": false,
	 "is_play_allowed": true,
	 "is_seek_allowed": true,
	 "queue_items_remaining": 15,
	 "queue_time_remaining": 4638,
	 "settings": {
		"loop": "disabled",
		"shuffle": false,
		"auto_radio": true
	 },
	 "now_playing": {
		"seek_position": 26,
		"length": 127,
		"one_line": {
		 "line1": "Carol of the Bells - Tord Gustavsen / Anne Karin Sundal-Ask / Det norske jentekor / Mykola Leontovych / Peter J. Wilhousky"
		},
		"two_line": {
		 "line1": "Carol of the Bells",
		 "line2": "Tord Gustavsen / Anne Karin Sundal-Ask / Det norske jentekor / Mykola Leontovych / Peter J. Wilhousky"
		},
		"three_line": {
		 "line1": "Carol of the Bells",
		 "line2": "Tord Gustavsen / Anne Karin Sundal-Ask / Det norske jentekor / Mykola Leontovych / Peter J. Wilhousky",
		 "line3": "2L — The MQA Experience"
		},
		"image_key": "77c13a11d52940bce55645d725e2bcaa",
		"artist_image_keys": [
		 "af35c9433ff87ac9bc20f29ffa66521a"
		]
	 }
	}
 ]
}

*/