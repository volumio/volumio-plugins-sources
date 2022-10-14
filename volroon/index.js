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
var roon;
var outputdevicename;
var roonIsActive = false;
var roonPausedTimer;
var coreFound = false;

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
	self.coreip;
	self.coreport;
	self.coreid;
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
		repeatSingle: false
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
		extension_id: 'com.roonlabs.display_zone',
		display_name: 'Roon API Display Zone',
		display_version: "1.0.0",
		publisher: 'Roon Labs, LLC',
		email: 'contact@roonlabs.com',
		log_level: 'none',


		core_found: function (core_) {
			core = core_;
			core.services.RoonApiTransport.subscribe_zones(function (response, msg) {
				// self.logger.error('Roon zone printout: \n' + JSON.stringify(msg, null, ' '));
				if (response == "Subscribed") {
					self.updateMetadata(msg);
					// console.log(activeZone)
				} else if (response == "Changed") {
					if (msg.zones_added || msg.zones_changed) {
						// self.indentifyZone(msg);
						self.updateMetadata(msg);
					}
					if (msg.zones_seek_changed && roonIsActive) {
						msg.zones_seek_changed.find(zone => {
							if (zone.zone_id === zoneid) {
								if (zone.seek_position && Math.abs((zone.seek_position * 1000) - self.state.seek) > 1500) {
									self.state.seek = zone.seek_position * 1000;
									self.pushState()
								} else {
									self.state.seek = zone.seek_position * 1000;
								}

							}
						});
						// self.pushState();

					}
				}
				// if (Date.now() - roonPausedTimer >= 10000) {
				// 	roonPausedTimer = null;
				// 	self.stop();
				// }
			})
		},

		core_lost: function (core_) {
			if (core_ === coreFound && roonIsActive) {
				self.stop();
				//Maybe run some cleanup here as well. Meh.
			}

		}
	});

	roon.init_services({
		required_services: [RoonApiTransport]
	});

	roon.start_discovery();
	self.logger.info(this.state.service + '::Roon API Services Started')
	// self.commandRouter.pushConsoleMessage(this.state.service + '::Roon API Services Started');

}

volroon.prototype.chooseTheRightCore = function () {
	var self = this;
	//Get the Core IP and Port. If you have multiple cores or even just 2 PC's running Roon, finding the right core by just looking at core.moo.transport.host will be a hit and miss.
	if (zoneid && core.services.RoonApiTransport._zones && core.services.RoonApiTransport._zones[zoneid] && !coreFound) {

		self.coreip = core.moo.transport.host ? core.moo.transport.host : '';
		self.coreport = core.moo.transport.port ? core.moo.transport.port : '';
		self.coreid = core.core_id ? core.core_id : '';
		if (self.coreip && self.coreport) coreFound = core;
		self.logger.info(`${this.state.service}::Roon Core Identified: ${self.coreip}:${self.coreport} with ID of: ${self.coreid}`)
	}

}

volroon.prototype.indentifyZone = function (msg) {
	var self = this;
	// Get the zoneid for the device
	// I might need to do this for msg.zones_changed as well in case it get missed going down this road.
	if (((msg.zones || msg.zones_changed) && zoneid == undefined) || (msg.zones_added)) {
		zone = (msg.zones ? msg.zones : msg.zones_changed ? msg.zones_changed : msg.zones_added).find(zone => {
			return zone =
				zone.outputs.find(output => {
					return output =
						output.source_controls.find(source_control => {
							return source_control.display_name === outputdevicename
						})
				})
		})

		zoneid = (zone && zone.zone_id) ? zone.zone_id : undefined;
		// This works much better over here. If we're busy looking at the right zone then we can only be looking at the correct core as well.
		self.chooseTheRightCore();


	}
}

volroon.prototype.updateMetadata = function (msg) {
	var self = this;

	self.indentifyZone(msg)

	if (msg.zones || msg.zones_changed || msg.zones_added) {
		zone = (msg.zones ? msg.zones : msg.zones_changed ? msg.zones_changed : msg.zones_added).find(zone => {
			if (zone.zone_id) return zone.zone_id === zoneid;
		})
		self.logger.debug('UpdateMetadata() zone: \n' + JSON.stringify(zone, null, ' '));
	}

	if (zone) {
		if (zone.state == 'playing') {
			self.setRoonActive();

			// self.prepareRoonPlayback();
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
			// zone = null;
		}
	}
}

volroon.prototype.setRoonActive = function () {
	var self = this;
	var currentState;
	if (!roonIsActive) {
		currentState = self.getState();
		if (currentState && (currentState.status === 'pause' || currentState.status === 'play') && currentState.service !== this.state.service) {
			self.volumioStop()
			self.commandRouter.stateMachine.playQueue.clearPlayQueue();
		}
		roonIsActive = true;

		if (!self.commandRouter.stateMachine.isVolatile) {
			self.commandRouter.stateMachine.setVolatile({
				service: 'volroon',
				callback: self.unsetVol.bind(self)
			})
			self.logger.info('volroon::Setting volatile state to volroon')
		}

		this.commandRouter.pushToastMessage('info', 'volroon', 'Roon Bridge is active.');

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

volroon.prototype.outputDeviceCallback = function () { // If the outputdevice changes we can do something about it here.
	var self = this;


	self.stop();
	zoneid = undefined;
	// coreFound = false; // The likelihood that the core has changed too is very low.
	// Probably need to use get_zones and filter the zoneid and core again this way...Unless we reinitialize the RoonListener
	this.getOutputDeviceName();
	// this.getZones();
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
	return self.coreCommand.executeOnPlugin('audio_interface', 'alsa_controller', 'checkAudioDeviceAvailable', '');
}

volroon.prototype.getOutputDeviceName = function () {
	var self = this;
	outputdevicename = self.getAdditionalConf('audio_interface', 'alsa_controller', 'outputdevicename');
};

volroon.prototype.onVolumioStart = function () {
	var self = this;
	this.commandRouter.sharedVars.registerCallback('alsa.outputdevice', this.outputDeviceCallback.bind(this));
	var configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);
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
	roon = undefined;
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

volroon.prototype.getUIConfig = function () {
	var defer = libQ.defer();
	var self = this;

	var lang_code = this.commandRouter.sharedVars.get('language_code');

	self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
		__dirname + '/i18n/strings_en.json',
		__dirname + '/UIConfig.json')
		.then(function (uiconf) {


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
		coreFound.services.RoonApiTransport.control(zoneid, control, (err) => {
			if (err) {
				self.commandRouter.pushConsoleMessage(`${this.state.service}::Unable to send ${control} command to Roon - Error: ${err}`);
				//Otherwise Volumio sits around with a mismatched state.
				self.state.status = currentState;
				self.pushState()
			} else {
				self.commandRouter.pushConsoleMessage(`${this.state.service}::${control} command successfully sent to Roon.`);
			}
		})
	}
}

// Roon settings (shuffle and repeat)
volroon.prototype.roonSettings = function (zoneid, settings) {
	var self = this;
	var currentState = self.state.status;

	if (zoneid != undefined && settings != undefined && coreFound != false) {
		coreFound.services.RoonApiTransport.change_settings(zoneid, settings, (err) => {
			if (err) {
				self.commandRouter.pushConsoleMessage(`${this.state.service}::Unable to send ${JSON.stringify(settings, null, '')} command to Roon - Error: ${err}`);
				//Otherwise Volumio sits around with a mismatched state.
				self.state.status = currentState;
				self.pushState()
			} else {
				self.commandRouter.pushConsoleMessage(`${this.state.service}::${JSON.stringify(settings, null, '')} command successfully sent to Roon.`);
			}
		})
	}

}
// Define a method to clear, add, and play an array of tracks
volroon.prototype.clearAddPlayTrack = function (track) {
	var self = this;
	self.commandRouter.pushConsoleMessage(this.state.service + '::clearAddPlayTrack');

};

volroon.prototype.seek = function (timepos) {
	var self = this;
	if (zoneid != undefined && timepos != undefined && coreFound != false) {
		return coreFound.services.RoonApiTransport.seek(zone, 'absolute', (timepos / 1000), (err) => {
			if (err) {
				self.commandRouter.pushConsoleMessage(`${this.state.service}::Unable to send seek command to Roon - Error: ${err}`);
			} else {
				self.commandRouter.pushConsoleMessage(`${this.state.service}::seek to ${timepos} command successfully sent to Roon.`);
			}
		})
	}

};

// Stop
volroon.prototype.stop = function () {
	var self = this;
	self.roonControl(zoneid, 'stop');
	self.setRoonInactive();

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