'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;


module.exports = apgpio;
function apgpio(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

}



apgpio.prototype.onVolumioStart = function()
{
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);

    return libQ.resolve();
}

apgpio.prototype.onStart = function() {
    var self = this;
	var defer=libQ.defer();


	// Once the Plugin has successfull started resolve the promise
	defer.resolve();

    return defer.promise;
};

apgpio.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();

    return libQ.resolve();
};

apgpio.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};


// Configuration Methods -----------------------------------------------------------------------------

apgpio.prototype.getUIConfig = function() {
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

apgpio.prototype.getConfigurationFiles = function() {
	return ['config.json'];
}

apgpio.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

apgpio.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

apgpio.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};



// Playback Controls ---------------------------------------------------------------------------------------
// If your plugin is not a music_sevice don't use this part and delete it


apgpio.prototype.addToBrowseSources = function () {

	// Use this function to add your music service plugin to music sources
    //var data = {name: 'Spotify', uri: 'spotify',plugin_type:'music_service',plugin_name:'spop'};
    this.commandRouter.volumioAddToBrowseSources(data);
};

apgpio.prototype.handleBrowseUri = function (curUri) {
    var self = this;

    //self.commandRouter.logger.info(curUri);
    var response;


    return response;
};



// Define a method to clear, add, and play an array of tracks
apgpio.prototype.clearAddPlayTrack = function(track) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'apgpio::clearAddPlayTrack');

	self.commandRouter.logger.info(JSON.stringify(track));

	return self.sendSpopCommand('uplay', [track.uri]);
};

apgpio.prototype.seek = function (timepos) {
    this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'apgpio::seek to ' + timepos);

    return this.sendSpopCommand('seek '+timepos, []);
};

// Stop
apgpio.prototype.stop = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'apgpio::stop');


};

// Spop pause
apgpio.prototype.pause = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'apgpio::pause');


};

// Get state
apgpio.prototype.getState = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'apgpio::getState');


};

//Parse state
apgpio.prototype.parseState = function(sState) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'apgpio::parseState');

	//Use this method to parse the state and eventually send it with the following function
};

// Announce updated State
apgpio.prototype.pushState = function(state) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'apgpio::pushState');

	return self.commandRouter.servicePushState(state, self.servicename);
};


apgpio.prototype.explodeUri = function(uri) {
	var self = this;
	var defer=libQ.defer();

	// Mandatory: retrieve all info for a given URI

	return defer.promise;
};

apgpio.prototype.getAlbumArt = function (data, path) {

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





apgpio.prototype.search = function (query) {
	var self=this;
	var defer=libQ.defer();

	// Mandatory, search. You can divide the search in sections using following functions

	return defer.promise;
};

apgpio.prototype._searchArtists = function (results) {

};

apgpio.prototype._searchAlbums = function (results) {

};

apgpio.prototype._searchPlaylists = function (results) {


};

apgpio.prototype._searchTracks = function (results) {

};

apgpio.prototype.goto=function(data){
    var self=this
    var defer=libQ.defer()

// Handle go to artist and go to album function

     return defer.promise;
};
