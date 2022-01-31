'use strict';

var libQ = require('kew');
var libNet = require('net');
var fs = require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var net = require('net');

module.exports = snapclient;
function snapclient(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

}

snapclient.prototype.onVolumioStart = function()
{
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);
    return libQ.resolve();
}

snapclient.prototype.onStart = function() {
    var self = this;
	var defer=libQ.defer();
	
	self.restartService(true)
	.fail(function(e)
	{
		self.commandRouter.pushToastMessage('error', "Startup failed", "Could not start the SnapCast plugin in a fashionable manner.");
		self.logger.error("[SnapClient] Could not start the SnapCast plugin in a fashionable manner. Error: " + e);
		defer.reject(new error(e));
	});
	defer.resolve();
    return defer.promise;
};

snapclient.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    self.stopService()
	.fail(function(e)
	{
		defer.reject(new error());
	});

    return libQ.resolve();
};

snapclient.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};


// Configuration Methods -----------------------------------------------------------------------------

snapclient.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;
		
	var volumioInstances = self.getVolumioInstances();
	var soundcards = self.getAlsaCards();
	
    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {
			// Client settings
			for (var n = 0; n < volumioInstances.list.length; n++){			
				if(volumioInstances.list[n].isSelf == true)
				{
					self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[0].options', {
						value: '127.0.0.1',
						label: 'Localhost [default]'
					});				
				}
				else
				{
					self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[0].options', {
						value: volumioInstances.list[n].host.replace('http://', ''),
						label: volumioInstances.list[n].name
					});
				}
				
				if(volumioInstances.list[n].host.replace('http://', '') == self.config.get('volumio_host'))
				{
					uiconf.sections[0].content[0].value.value = volumioInstances.list[n].host.replace('http://', '');
					uiconf.sections[0].content[0].value.label = volumioInstances.list[n].name;
				}
			}
			uiconf.sections[0].content[1].value = self.config.get('custom_host');
			uiconf.sections[0].content[2].value = self.config.get('host');
			
			for (var n = 0; n < soundcards.length; n++){
				self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[3].options', {
					value: soundcards[n].hw,
					label: soundcards[n].name
				});
			
				if(soundcards[n].hw == self.config.get('soundcard'))
				{
					uiconf.sections[0].content[3].value.value = soundcards[n].hw;
					uiconf.sections[0].content[3].value.label = soundcards[n].name;
				}
			}
			
			uiconf.sections[0].content[4].value = self.config.get('custom_host_id');
			uiconf.sections[0].content[5].value = self.config.get('host_id');
			uiconf.sections[0].content[6].value = self.config.get('client_cli');
			self.logger.info("[SnapClient] 1/1 setting groups loaded");
			
            defer.resolve(uiconf);
        })
        .fail(function(err)
        {
			self.logger.error('[SnapClient] An error occurred: ' + err);
            defer.reject(new Error());
        });

    return defer.promise;
};

snapclient.prototype.getConfigurationFiles = function() {
	return ['config.json'];
}

snapclient.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

snapclient.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

snapclient.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};

// Update Config Methods -----------------------------------------------------------------------------

snapclient.prototype.updateSnapClient = function (data)
{
	var self = this;
	var defer = libQ.defer();
	
	self.config.set('volumio_host', data['volumio_host'].value);
	self.config.set('custom_host', data['custom_host']);
	self.config.set('host', data['host']);
	self.config.set('soundcard', data['soundcard'].value);
	self.config.set('custom_host_id', data['custom_host_id']);
	self.config.set('host_id', data['host_id']);
	self.config.set('client_cli', data['client_cli']);
	
	self.logger.info("[SnapClient] Successfully updated client configuration");
	
	self.updateSnapClientConfig(data)
	.then(function (restartService) {
		self.restartService("snapclient", false);		
	})
	.fail(function(e)
	{
		defer.reject(new error());
	})
	
	return defer.promise;
};

snapclient.prototype.getAlsaCards = function () {
	var self = this;
	var cards = [];
	var multi = false;
	var carddata = fs.readJsonSync(('/volumio/app/plugins/audio_interface/alsa_controller/cards.json'),  'utf8', {throws: false});

	try {
		var soundCardDir = '/proc/asound/';
		var soundFiles = fs.readdirSync(soundCardDir);
		cards.push({id: 99, hw: "", name: "Omit soundcard parameter"});
		
		for (var i = 0; i < soundFiles.length; i++) {

			if (soundFiles[i].indexOf('card') >= 0 && soundFiles[i] != 'cards'){
				var cardnum = soundFiles[i].replace('card', '');
				var cardinfo = self.getCardinfo(cardnum);
				var rawname = cardinfo.name;
				var name = rawname;
				var hw = fs.readFileSync(soundCardDir + soundFiles[i] + '/id').toString().trim();
				var id = cardinfo.id;
					for (var n = 0; n < carddata.cards.length; n++){
						var cardname = carddata.cards[n].name.toString().trim();
						if (cardname === rawname){
							if(carddata.cards[n].multidevice) {
								multi = true;
								var card = carddata.cards[n];
								for (var j = 0; j < card.devices.length; j++) {
									var subdevice = carddata.cards[n].devices[j].number;
									name = carddata.cards[n].devices[j].prettyname;
									cards.push({id: id + ',' + subdevice, name: name});
								}

							} else {
								multi = false;
								name = carddata.cards[n].prettyname;
							}
						}
					} if (!multi){
						cards.push({id: id, hw: hw, name: name});
					}
			}

		}
	} catch (e) {
		self.logger.error('[SnapClient] Could not enumerate soundcards, error: ' + e.message);
		var namestring = 'No Audio Device Available';
		cards.push({id: '', hw: 'ALSA', name: namestring});
	}
	return cards;
};

snapclient.prototype.getCardinfo = function (cardnum) {
	var self = this;
	var info = fs.readFileSync('/proc/asound/card'+cardnum+'/pcm0p/info').toString().trim().split('\n');

	for (var e = 0; e < info.length; e++) {
		if (info[e].indexOf('id') >= 0) {
			var infoname = info[e].split(':')[1].replace(' ', '');
		}

	}
	var cardinfo = {'id':cardnum,'name':infoname};
	return cardinfo;
};

snapclient.prototype.getVolumioInstances = function () {
	var self = this;
	var results = self.commandRouter.executeOnPlugin('system_controller', 'volumiodiscovery', 'getDevices', '');
	return results;
};

snapclient.prototype.updateSnapClientConfig = function (data)
{
	let self = this;
	let defer = libQ.defer();
		
	let streamHost = (data['volumio_host'].value == undefined ? "" : " -h " + data['volumio_host'].value);
	if(data['custom_host'] == true)
		streamHost = (data['host'] == undefined ? " -h localhost" : " -h " + data['host']);
	
	let snapSoundCard = " -s ";
	if(data['soundcard'] != undefined)
		if(data['soundcard'].value != "")
			snapSoundCard += data['soundcard'].value;
		else
			snapSoundCard = "";
	else
		snapSoundCard = " -s 0";
	
	let cli_commands = (self.config.get('client_cli') == undefined ? '' : self.config.get('client_cli'));
	
	var hostID = "";
	if(data['custom_host_id'] && data['host_id'] != undefined && data['host_id'] != "")
		hostID = " --hostID " + data['host_id'];
	
	try
	{
		self.streamEdit("SNAPCLIENT_OPTS", "SNAPCLIENT_OPTS=\"" + streamHost + snapSoundCard + hostID + " " + cli_commands + "\"", __dirname + "/default/snapclient", false);
		self.commandRouter.pushToastMessage('success', "Settings saved", "Successfully saved the SnapClient settings and reinitialized the player.");
		defer.resolve();
	}
	catch(e)
	{
		self.logger.error("[SnapClient] an error occurred while trying to update the SnapClient settings. Error:\n " + e.message);
		defer.reject(new Error("Unable to save settings with error: " + e.message));
	}
	
	return defer.promise;
};

// General functions ---------------------------------------------------------------------------------

snapclient.prototype.executeShellScript = function (scriptName)
{
	var self = this;
	var defer = libQ.defer();

	var command = "/bin/sh " + scriptName;	
	exec(command, {uid:1000, gid:1000}, function (error, stout, stderr) {
		if(error)
		{
			self.logger.error("[SnapClient] could not execute script with error: " + stderr);
			self.commandRouter.pushConsoleMessage('[SnapClient] Could not execute script {' + scriptName + '} with error: ' + error);
		}
		self.commandRouter.pushConsoleMessage('[SnapClient] Successfully executed script {' + scriptName + '}');
		defer.resolve();
	});

	
	return defer.promise;
};

snapclient.prototype.streamEdit = function (pattern, value, inFile, append)
{
	var self = this;
	var defer = libQ.defer();
	let castValue;
	
	if(value == true || value == false)
			castValue = ~~value;
	else
		castValue = value;

	let command = "/bin/sed -i -- '/" + pattern + ".*/a " + castValue + "' " + inFile;
	if(!append)
		command = "/bin/sed -i -- 's|" + pattern + ".*|" + castValue + "|g' " + inFile;	

	exec(command, {uid:1000, gid:1000}, function (error, stout, stderr) {
		if(error)
			self.logger.error("[SnapClient] unable to edit stream (sed) with error: " + stderr);
		defer.resolve();
	});
	
	return defer.promise;
};

snapclient.prototype.isValidJSON = function (str) 
{
	var self = this;
    try 
	{
        JSON.parse(JSON.stringify(str));
    } 
	catch (e) 
	{
		self.logger.error('[SnapClient] Could not parse JSON, error: ' + e.message + '\nMalformed JSON msg: ' + JSON.stringify(str));
        return false;
    }
    return true;
};


// Service Control -----------------------------------------------------------------------------------

snapclient.prototype.restartService = function (boot)
{
	var self = this;
	var defer=libQ.defer();

	var command = "/usr/bin/sudo /bin/systemctl restart snapclient";		
	if(!boot)
	{
		self.logger.info('[SnapClient] Reloading daemon, for changes to take effect');
		command = "/usr/bin/sudo /bin/systemctl daemon-reload && /usr/bin/sudo /bin/systemctl restart snapclient";
	}
	
	exec(command, {uid:1000,gid:1000}, function (error, stdout, stderr) {
		if (error !== null) {
			self.commandRouter.pushConsoleMessage('[SnapClient] The following error occurred while starting snapclient: ' + error);
			self.commandRouter.pushToastMessage('error', "Restart failed", "Restarting snapclient failed with error: " + error);
			defer.reject();
		}
		else {
			self.commandRouter.pushConsoleMessage('[SnapClient] snapclient started');
			if(boot == false)
				self.commandRouter.pushToastMessage('success', "Restarted SnapClient", "Restarted SnapClient for the changes to take effect.");
			
			defer.resolve();
		}
	});

	return defer.promise;
};

snapclient.prototype.stopService = function ()
{
	var self = this;
	var defer=libQ.defer();

	var command = "/usr/bin/sudo /bin/systemctl stop snapclient";
	exec(command, {uid:1000,gid:1000}, function (error, stdout, stderr) {
		if (error !== null) {
			self.commandRouter.pushConsoleMessage('[SnapClient] The following error occurred while stopping SnapClient: ' + error);
			self.commandRouter.pushToastMessage('error', "Stopping service failed", "Stopping SnapClient failed with error: " + error);
			defer.reject();
		}
		else {
			self.commandRouter.pushConsoleMessage('[SnapClient] snapclient stopped');
			self.commandRouter.pushToastMessage('success', "Stopping", "Stopped SnapClient.");
			defer.resolve();
		}
	});

	return defer.promise;
};