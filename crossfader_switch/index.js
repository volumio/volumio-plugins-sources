'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var crossfaderthreshold = "5";
var MixrampdB = "-15";
var Mixrampdelay = "1";


module.exports = crossfaderSwitch;
function crossfaderSwitch(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

}


crossfaderSwitch.prototype.onVolumioStart = function()
{
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);

    return libQ.resolve();
}

crossfaderSwitch.prototype.onStart = function() {
    var self = this;
	var defer=libQ.defer();


	// Once the Plugin has successfull started resolve the promise
	defer.resolve();

    return defer.promise;
};

crossfaderSwitch.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();

    return libQ.resolve();
};

crossfaderSwitch.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};

crossfaderSwitch.prototype.saveSettings = function (data) {
	
    this.config.set('crossfaderthreshold',data['crossfaderthreshold']);
    this.config.set('MixrampdB',data['MixrampdB']);
    this.config.set('Mixrampdelay',data['Mixrampdelay']);
    var command = "/usr/bin/mpc crossfade " + data['crossfaderthreshold'] +"|/usr/bin/mpc mixrampdb " + data['MixrampdB'] + "|/usr/bin/mpc mixrampdelay " + + data['Mixrampdelay'];
   	execSync(command, { uid: 1000, gid: 1000});
   	 this.commandRouter.pushToastMessage('success', "Success at applying " + data['crossfaderthreshold'] + " " + data['MixrampdB'] +" " + data['Mixrampdelay'] );
   	var command2 = "/usr/sbin/service mpd restart";
   	execSync(command2, { uid: 1000, gid: 1000});
   
    
    
};
// Configuration Methods -----------------------------------------------------------------------------

crossfaderSwitch.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {
			
			uiconf.sections[1].content.push(
				{
					"id": "help and info",
					"element": "button",
					"label": "Help",
					"doc" : "MPD online documentation",
					"description": "",
					"onClick": {
						"type": "openUrl",
						"url": "https://mpd.readthedocs.io/en/latest/user.html#cross-fading"
					}})
			
         uiconf.sections[2].content.push(
				{
              "id": "crossfaderthreshold",
              "element": "equalizer",
              "label": "Adjust crossfade time in second",
              "doc": "If crossfade is set to a positive number, then adjacent songs are cross-faded by this number of seconds",
              
              "config": {
                "orientation": "horizontal",
                "bars": [
                  {
                    "min": "0",
                    "max": "15",
                    "step": "1",
                    "value": self.config.get('crossfaderthreshold'),
                    "ticksLabels": [
                      "s"
                    ],
                    "tooltip": "always"
                  }
                ]
              }
            })
            
               uiconf.sections[2].content.push(
				{
              "id": "MixrampdB",
              "element": "equalizer",
              "label": "Adjust mixrampdb in dB",
              "doc": "loudness levels at start and end of a song and can be used by MPD to find the best time to begin cross-fading",
              
              "config": {
                "orientation": "horizontal",
                "bars": [
                  {
                    "min": "-20",
                    "max": "0",
                    "step": "1",
                    "value": self.config.get('MixrampdB'),
                    "ticksLabels": [
                      "dB"
                    ],
                    "tooltip": "always"
                  }
                ]
              }
            })
            
   
            
             uiconf.sections[2].content.push(
				{
              "id": "Mixrampdelay",
              "element": "equalizer",
              "label": "Adjust mixrampdelay in second",
              "doc": "Additionnal delay in second before start of the crossfade",
              
              "config": {
                "orientation": "horizontal",
                "bars": [
                  {
                    "min": "0",
                    "max": "10",
                    "step": "1",
                    "value": self.config.get('Mixrampdelay'),
                    "ticksLabels": ["s"],
                    "tooltip": "always"
                  }
                ]
              }
            })
            
        uiconf.sections[2].saveButton.data.push('crossfaderthreshold')
        uiconf.sections[2].saveButton.data.push('MixrampdB')
        uiconf.sections[2].saveButton.data.push('Mixrampdelay')
           
            defer.resolve(uiconf);
        })
        .fail(function()
        {
            defer.reject(new Error());
        });

    return defer.promise;
};

crossfaderSwitch.prototype.getConfigurationFiles = function() {
	return ['config.json'];
}

crossfaderSwitch.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

crossfaderSwitch.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

crossfaderSwitch.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};