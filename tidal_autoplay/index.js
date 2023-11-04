'use strict';

var libQ = require('kew');
var io = require('socket.io-client');

module.exports = tidalAutoplay;
function tidalAutoplay(context) {
	var self = this;

	self.context = context;
	self.commandRouter = self.context.coreCommand;
	self.logger = self.context.logger;
	self.configManager = self.context.configManager;
};

tidalAutoplay.prototype.onVolumioStart = function () {
	var self = this;
	var configFile = self.commandRouter.pluginManager.getConfigurationFile(self.context, 'config.json');
	self.config = new (require('v-conf'))();
	self.config.loadFile(configFile);

	self.mixId = self.config.get('mixId');

	return libQ.resolve();
};

tidalAutoplay.prototype.onStart = function () {
	var self = this;
	var defer = libQ.defer();

	self.socket = io.connect('http://localhost:3000');

	self.socket.on('pushBrowseSources', function (sources) {
		if (self.tidalAvailable(sources)) {
			self.commandRouter.explodeUriFromService('tidal', 'tidal://mymusic/mixes/' + self.mixId)
				.then(tracks => {
					self.commandRouter.volumioClearQueue();
					self.commandRouter.addQueueItems(tracks).then(() => {
						self.socket.on('pushBackendEventsStatus', function(data){
							self.socket.emit('play');
							self.socket.removeAllListeners();
						});
					});
				})
				.fail(function () {
					self.socket.removeAllListeners();
				});
		}
	});

	// Once the Plugin has successfull started resolve the promise
	defer.resolve();

	return defer.promise;
};

tidalAutoplay.prototype.onStop = function () {
	var self = this;
	var defer = libQ.defer();

	self.socket.removeAllListeners();

	// Once the Plugin has successfull stopped resolve the promise
	defer.resolve();

	return libQ.resolve();
};

tidalAutoplay.prototype.onRestart = function () {
	// Optional, use if you need it
};


// Configuration Methods -----------------------------------------------------------------------------

tidalAutoplay.prototype.getUIConfig = function () {
	var defer = libQ.defer();
	var self = this;

	var lang_code = self.commandRouter.sharedVars.get('language_code');

	self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
		__dirname + '/i18n/strings_en.json',
		__dirname + '/UIConfig.json')
		.then(function (uiconf) {
			uiconf.sections[0].content[0].value = self.config.get('mixId');

			defer.resolve(uiconf);
		})
		.fail(function () {
			defer.reject(new Error());
		});

	return defer.promise;
};

tidalAutoplay.prototype.getConfigurationFiles = function () {
	return ['config.json'];
};

tidalAutoplay.prototype.setUIConfig = function (data) {
	var self = this;

	self.config.set('mixId', data['mixId']);

	self.commandRouter.pushToastMessage('success', 'Tidal Autoplay', self.commandRouter.getI18nString('COMMON.CONFIGURATION_UPDATE_DESCRIPTION'));
};

tidalAutoplay.prototype.getConf = function () {
	//Perform your installation tasks here
};

tidalAutoplay.prototype.setConf = function () {
	//Perform your installation tasks here
};

tidalAutoplay.prototype.tidalAvailable = function (sources) {
	for (let i = 0; i < sources.length; i++) {
		if (sources[i].plugin_name == 'tidal') {
			return true;
		}
	}

	return false;
};