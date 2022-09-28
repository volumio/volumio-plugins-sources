'use strict';

var libQ = require('kew');
var fs = require('fs-extra');
var exec = require('child_process').exec;
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var RoonApi = require("node-roon-api");
var RoonApiTransport = require("node-roon-api-transport");
var RoonApiImage = require("node-roon-api-image");

var core;
var transport;
var zone = null;
var zoneid = null;
var roon = null;
var extraData;
var outputdevicename = null;
var roonIsActive = false;
var roonPausedTimer = null;
var albumArt;

const msgMap = new Map();
msgMap.set('playing', 'play')
msgMap.set('paused', 'pause')
msgMap.set('loading', 'pause')
msgMap.set('stopped', 'stop')

module.exports = roonumio;

function roonumio(context) {
	var self = this;
	// Save a reference to the parent commandRouter
	self.context = context;
	self.commandRouter = self.context.coreCommand;
	self.logger = self.commandRouter.logger;
	this.state = {
		status: 'stop',
		service: 'roonumio',
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
		disableUiControls: true
	}

}

roonumio.prototype.roonListener = function () {
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
			transport = core.services.RoonApiTransport;
			albumArt = core.services.RoonApiImage;
			transport.subscribe_zones(function (response, msg) {
				// self.logger.error('Roon zone printout: \n' + JSON.stringify(msg, null, ' '));
				if (response == "Subscribed") {
					self.updateMetadata(msg);
					// console.log(activeZone)
				} else if (response == "Changed") {
					if (msg.zones_added || msg.zones_changed) {
						self.updateMetadata(msg);
					}
					if (msg.zones_seek_changed) {
						// 	var now = Date.now();
						var zone_seek = msg.zones_seek_changed.find(zone => {
							// var ed = getExtraDataForZone(x.zone_id);
							// ed.seek_position = x.seek_position;
							return zone.zone_id == zoneid
						});
						self.updateProgress(zone_seek);
						// self.pushState();
					}
				}
			})
		},

		core_lost: function (core_) {
			core = undefined;

		}
	});

	roon.init_services({
		required_services: [RoonApiTransport, RoonApiImage]
	});

	roon.start_discovery();
	self.logger.info('ROON API SUCCESSFULLY INITIALIZED')

}

// roonumio.prototype.getExtraDataForZone = function (zoneid) {
// 	var self = this;
// 	var ed = extraData[zoneid];
// 	if (ed == null) {
// 		ed = {};
// 		extraData[zoneid] = ed;
// 	}

// 	return ed;
// };

// TO PREVENT CONSTANT CYCLING OF THE BELOW CODE. PERHAPS IMPLEMENT A CHECK AND STORE THE ZONEID? 
// THEN ONLY RERUN THE DEVICE CHECK ON AN ALSA RECONFIG?
roonumio.prototype.updateMetadata = function (msg) {
	var self = this;

	// Get the zoneid for the device
	if (msg.zones && (zoneid === null)) { //So we don't loop through this logic every single time.
		zone = (msg.zones).find(zone => {
			return zone =
				zone.outputs.find(output => {
					return output =
						output.source_controls.find(source_control => {
							return source_control.display_name === outputdevicename
						})
				})
		})

		zoneid = zone.zone_id

	}

	if (msg.zones) {
		zone = (msg.zones).find(zone => {
			return zone.zone_id === zoneid;
		})
	}

	if (msg.zones_changed) {
		zone = (msg.zones_changed).find(zone_changed => {
			return zone_changed.zone_id === zoneid
		})
	}

	if (zone) {
		if (zone.state == 'playing') {
			self.setRoonActive();
			// self.prepareRoonPlayback();
		}

		if (zone.state == 'paused' && roonIsActive && !roonPausedTimer) roonPausedTimer = Date.now();

		// if (zone.state == 'paused' && roonIsActive && roonPausedTimer) {
		// 	if (Date.now() - roonPausedTimer >= 600000) {
		// 		roonPausedTimer = null;
		// 		self.setRoonInactive();
		// 	}
		// }

		if (roonIsActive || roonPausedTimer) {

			self.state.status = zone.state ? msgMap.get(zone.state) : 'play';
			// self.state.service = 'roonumio';
			self.state.title = zone.now_playing ? zone.now_playing.three_line.line1 : '';
			self.state.artist = zone.now_playing ? zone.now_playing.three_line.line2 : '';
			self.state.album = zone.now_playing ? zone.now_playing.three_line.line3 : '';
			self.state.albumart = '/albumart';
			self.state.uri = '';
			self.state.seek = zone.now_playing ? zone.now_playing.seek_position * 1000 : 0;
			self.state.duration = zone.now_playing ? zone.now_playing.length : 0;
			// self.state.samplerate = '';
			// self.state.bitdepth = '';
			// self.state.bitrate = '';
			self.state.channels = 2;

			self.logger.info(JSON.stringify(self.state, null, ' '));
			self.pushState();
			// zone = null;
		}
	}


}

roonumio.prototype.updateProgress = function (msg) {
	var self = this;
	self.state.seek = msg.seek_position ? msg.seek_position * 1000 : self.state.seek;
	// self.pushState();
}

roonumio.prototype.setRoonActive = function () {
	var self = this;

	roonIsActive = true;

	if (!self.commandRouter.stateMachine.isVolatile) {
		self.commandRouter.stateMachine.setVolatile({
			service: 'roonumio',
			callback: self.unsetVol.bind(self)
		})
	}
};

roonumio.prototype.setRoonInactive = function () {
	var self = this;
	roonIsActive = false;
	//The unsetVolatile callback will be called when "stop" is pushed or called.
};

// roonumio.prototype.prepareRoonPlayback = function () {
// 	var self = this;

// 	// var state = self.commandRouter.stateMachine.getState();
// 	// if (state && state.service && state.service !== 'roonumio') {
// 	// 	if (self.commandRouter.stateMachine.isVolatile) {
// 	// 		self.commandRouter.stateMachine.unSetVolatile();
// 	// 	} else {
// 	// 		self.context.coreCommand.volumioStop();
// 	// 	}
// 	// }
// 	// setTimeout(() => {
// 	if (!self.commandRouter.stateMachine.isVolatile) {
// 		self.commandRouter.stateMachine.setVolatile({
// 			service: 'roonumio',
// 			callback: self.unsetVol.bind(self)
// 		})
// 	}
// 	// }, 1000);
// }

roonumio.prototype.unsetVol = function () {
	var self = this;

	var state = self.commandRouter.stateMachine.getState();
	if (state && state.service && state.service !== 'roonumio' && self.commandRouter.stateMachine.isVolatile) {
		return self.stop();
	} else {
		setTimeout(() => {
			return libQ.resolve();
		}, 1500);
	}
	return self.stop();

};

roonumio.prototype.outputDeviceCallback = function () { // If the outputdevice changes we can do something about it here.
	var self = this;

	self.logger.info('Output device has changed');

};

// Optional functions exposed for making development easier and more clear
roonumio.prototype.getSystemConf = function (pluginName, varName) {
};

roonumio.prototype.setSystemConf = function (pluginName, varName) {
};

roonumio.prototype.getAdditionalConf = function (type, controller, data) {
	var self = this;
	return self.context.coreCommand.executeOnPlugin(type, controller, 'getConfigParam', data);
};

roonumio.prototype.setAdditionalConf = function () {
};

roonumio.prototype.getOutputDeviceName = function () {
	var self = this;
	outputdevicename = self.getAdditionalConf('audio_interface', 'alsa_controller', 'outputdevicename');
}
roonumio.prototype.onVolumioStart = function () {
	var self = this;
	this.commandRouter.sharedVars.registerCallback('alsa.outputdevice', this.outputDeviceCallback.bind(this));
	var configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);
	return libQ.resolve();
};

roonumio.prototype.onStart = function () {
	var self = this;
	var defer = libQ.defer();

	// This is used when autodetecting the Zone to use in Roon
	this.getOutputDeviceName();

	exec('/usr/bin/sudo /bin/systemctl start roonbridge.service', { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
		if (error) {
			self.logger.error('Cannot start Roon Bridge ' + error);
			defer.reject(error);
		} else {
			self.logger.info('Roon Bridge has successfully started ')

		}
	});

	self.roonListener();

	defer.resolve('');
	return defer.promise;
};

roonumio.prototype.onStop = function () {
	var self = this;
	var defer = libQ.defer();
	roon = null;
	exec('/usr/bin/sudo /bin/systemctl stop roonbridge.service', { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
		if (error) {
			self.logger.error('Cannot kill Roon Bridge ' + error);
			defer.reject(error);
		} else {
			defer.resolve('');
		}
	});
	return defer.promise;
};

roonumio.prototype.onRestart = function () {
	var self = this;
	var defer = libQ.defer();

	// This is used when autodetecting the Zone to use in Roon
	this.getOutputDeviceName();

	exec('/usr/bin/sudo /bin/systemctl restart roonbridge.service', { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
		if (error) {
			self.logger.error('Cannot start Roon Bridge ' + error);
			defer.reject(error);
		} else {
			self.logger.info('Roon Bridge has successfully started ')

		}
	});

	self.roonListener();

	defer.resolve('');
	return defer.promise;
};


// Configuration Methods -----------------------------------------------------------------------------

roonumio.prototype.getUIConfig = function () {
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

roonumio.prototype.getConfigurationFiles = function () {
	return ['config.json'];
}

roonumio.prototype.setUIConfig = function (data) {
	var self = this;
	//Perform your installation tasks here
};

roonumio.prototype.getConf = function (varName) {
	var self = this;
	//Perform your installation tasks here
};

roonumio.prototype.setConf = function (varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};



// Playback Controls ---------------------------------------------------------------------------------------
// If your plugin is not a music_sevice don't use this part and delete it


roonumio.prototype.addToBrowseSources = function () {

	// Use this function to add your music service plugin to music sources
	//var data = {name: 'Spotify', uri: 'spotify',plugin_type:'music_service',plugin_name:'spop'};
	this.commandRouter.volumioAddToBrowseSources(data);
};

roonumio.prototype.handleBrowseUri = function (curUri) {
	var self = this;

	//self.commandRouter.logger.info(curUri);
	var response;


	return response;
};



// Define a method to clear, add, and play an array of tracks
roonumio.prototype.clearAddPlayTrack = function (track) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + this.state.service + '::clearAddPlayTrack');

};

roonumio.prototype.seek = function (timepos) {
	this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + this.state.service + '::seek to ' + timepos);

};

// Stop
roonumio.prototype.stop = function () {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + this.state.service + '::stop');
	self.setRoonInactive();


};

// Spop pause
roonumio.prototype.pause = function () {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + this.state.service + '::pause');


};

// Get state
roonumio.prototype.getState = function () {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + this.state.service + '::getState');
	return self.commandRouter.stateMachine.getState();


};

//Parse state
roonumio.prototype.parseState = function (sState) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + this.state.service + '::parseState');

	//Use this method to parse the state and eventually send it with the following function
};

// Announce updated State
roonumio.prototype.pushState = function () {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + this.state.service + '::pushState');

	return self.commandRouter.servicePushState(this.state, this.state.service);
};


roonumio.prototype.explodeUri = function (uri) {
	var self = this;
	var defer = libQ.defer();

	// Mandatory: retrieve all info for a given URI

	return defer.promise;
};

roonumio.prototype.getAlbumArt = function (data, path) {
	var self = this;

};





roonumio.prototype.search = function (query) {
	var self = this;
	var defer = libQ.defer();

	// Mandatory, search. You can divide the search in sections using following functions

	return defer.promise;
};

roonumio.prototype._searchArtists = function (results) {

};

roonumio.prototype._searchAlbums = function (results) {

};

roonumio.prototype._searchPlaylists = function (results) {


};

roonumio.prototype._searchTracks = function (results) {

};

roonumio.prototype.goto = function (data) {
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