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



// Playback Controls ---------------------------------------------------------------------------------------
// If your plugin is not a music_sevice don't use this part and delete it


roseaudiosys.prototype.addToBrowseSources = function () {

	// Use this function to add your music service plugin to music sources
    //var data = {name: 'Spotify', uri: 'spotify',plugin_type:'music_service',plugin_name:'spop'};
    this.commandRouter.volumioAddToBrowseSources(data);
};

roseaudiosys.prototype.handleBrowseUri = function (curUri) {
    var self = this;

    //self.commandRouter.logger.info(curUri);
    var response;


    return response;
};



// Define a method to clear, add, and play an array of tracks
roseaudiosys.prototype.clearAddPlayTrack = function(track) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'roseaudiosys::clearAddPlayTrack');

	self.commandRouter.logger.info(JSON.stringify(track));

	return self.sendSpopCommand('uplay', [track.uri]);
};

roseaudiosys.prototype.seek = function (timepos) {
    this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'roseaudiosys::seek to ' + timepos);

    return this.sendSpopCommand('seek '+timepos, []);
};

// Stop
roseaudiosys.prototype.stop = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'roseaudiosys::stop');


};

// Spop pause
roseaudiosys.prototype.pause = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'roseaudiosys::pause');


};

// Get state
roseaudiosys.prototype.getState = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'roseaudiosys::getState');


};

//Parse state
roseaudiosys.prototype.parseState = function(sState) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'roseaudiosys::parseState');

	//Use this method to parse the state and eventually send it with the following function
};

// Announce updated State
roseaudiosys.prototype.pushState = function(state) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'roseaudiosys::pushState');

	return self.commandRouter.servicePushState(state, self.servicename);
};


roseaudiosys.prototype.explodeUri = function(uri) {
	var self = this;
	var defer=libQ.defer();

	// Mandatory: retrieve all info for a given URI

	return defer.promise;
};

roseaudiosys.prototype.getAlbumArt = function (data, path) {

	var artist, album;

	if (data != undefined && data.path != undefined) {
		path = data.path;
	}

	var web;

	if (data != undefined && data.artist != undefined) {
		artist = data.artist;
		if (data.album != undefined)
			album = data.album;
		else album = data.artist;

		web = '?web=' + nodetools.urlEncode(artist) + '/' + nodetools.urlEncode(album) + '/large'
	}

	var url = '/albumart';

	if (web != undefined)
		url = url + web;

	if (web != undefined && path != undefined)
		url = url + '&';
	else if (path != undefined)
		url = url + '?';

	if (path != undefined)
		url = url + 'path=' + nodetools.urlEncode(path);

	return url;
};





roseaudiosys.prototype.search = function (query) {
	var self=this;
	var defer=libQ.defer();

	// Mandatory, search. You can divide the search in sections using following functions

	return defer.promise;
};

roseaudiosys.prototype._searchArtists = function (results) {

};

roseaudiosys.prototype._searchAlbums = function (results) {

};

roseaudiosys.prototype._searchPlaylists = function (results) {


};

roseaudiosys.prototype._searchTracks = function (results) {

};

roseaudiosys.prototype.goto=function(data){
    var self=this
    var defer=libQ.defer()

// Handle go to artist and go to album function

     return defer.promise;
};
