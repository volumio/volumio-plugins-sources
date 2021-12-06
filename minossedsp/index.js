'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;

const core_fifo = "/tmp/mdsp-core.fifo";
const MDSP_BF_CONF="/tmp/mdsp-bf-conf.json";

const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));
var isMinosseConf = false;
const pushMsgPath = '/tmp/'
const pushMsgFile = 'mdsp-guimsg.txt';
var outputDeviceFlag = false;
const initeq = '0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0';

module.exports = minossedsp;
function minossedsp(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

};

minossedsp.prototype.onVolumioStart = function()
{
	var self = this;
	self.getMinosseConf();
    return libQ.resolve();
};

minossedsp.prototype.onStart = function() {
	var self = this;
	const IDSTR = "MinosseDSP::onStart: ";
	const sleepBeforeReboot = 4.5;	// Time in seconds
	const minosseDelay = 5000;		// Time in milliseconds
	//const activationDelay = 1500;		// Time in milliseconds
	
	var defer=libQ.defer();
	
	try {
		self.loadI18nStrings();
		this.commandRouter.sharedVars.registerCallback('language_code', this.loadI18nStrings.bind(this));
		self.getMinosseConf();
		
		exec('/usr/local/bin/mdsp-testactive.sh', {encoding: 'utf8'},
			function (error, stdout, stderr)
			{
				if (error)
				{
		        	console.log(IDSTR + error);
		      	} else {
					if (JSON.parse(stdout) == false) {
						
						//========== MINOSSE IS NOT ACTIVATED, ACTIVATE IT NOW ==========
						
						//setTimeout(() => {
								
							//console.log(IDSTR + self.getI18nString('PLUGIN_ACTIVATING'));
							//self.commandRouter.pushToastMessage('info', self.getI18nString('PLUGIN_ACTIVATING'));
							
							//exec('/usr/bin/sudo /usr/local/bin/mdsp-activate.sh');
							exec('/usr/bin/sudo /bin/systemctl start mdsp-core.service', {encoding: 'utf8'},
								function (error, stdout, stderr)
								{
									if (error)
									{
							        	console.log(IDSTR + error);
							      	} else {
										// Activate Minosse core
										const commstr = '/bin/echo \'{"event":"mdsp-activate","data":""}\' > ' + core_fifo;
										//console.log(IDSTR + commstr);
										exec(commstr,
											function (error, stdout, stderr)
											{
										    	if (error)
												{
										        	console.log(IDSTR + error);
										      	}
										    }
										);
									}
								}
							);
							
							// Override Volumio volume
							//exec('/usr/local/bin/mdsp-voloveron.sh');
							// Hide Volumio "volume options" section
							//execSync('/usr/local/bin/mdsp-volopthid.sh');
							self.setMixerTypeNone();
							//self.reconfVolumio();
							//self.executeOnPlugin2params('system_controller', 'system', 'setConf', 'startupSound', false);
							
							console.log(IDSTR + self.getI18nString('ACTIVATION_SUCCESS_AND_REBOOT'));
							self.commandRouter.pushToastMessage('warning', self.getI18nString('ACTIVATION_SUCCESS_AND_REBOOT'));
							exec('/bin/sleep ' + sleepBeforeReboot + ' && /usr/bin/sudo /sbin/shutdown -r now');
							
						//}, activationDelay);
						
					} else {
						
						//========== MINOSSE IS ALREADY ACTIVATED, START IT AND CONFIGURE CORE SERVICES ==========
						
						var overrideVolume = {
					        'volumeOverride': true,
							'pluginType': 'audio_interface',
				            'pluginName': 'minossedsp',
							'card': self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', 'outputdevice'),
							'overrideMixerType' : 'None',
							'overrideAvoidSoftwareMixer' : true
					    };
						self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'setDeviceVolumeOverride', overrideVolume);
						
						// Delay Minosse start, as it seems to break Volumio if started early (?)
						setTimeout(() => {
							
							exec('/usr/bin/sudo /bin/systemctl start mdsp-core.service', {encoding: 'utf8'},
								function (error, stdout, stderr)
								{
									if (error)
									{
							        	console.log(IDSTR + error);
							      	} else {
										self.configureCoreService();
										exec('/usr/local/bin/mdsp-bf-wrapper1.sh');
										self.configHwCard();
										
										fs.watch(pushMsgPath, function(eventName, filename) {
											self.monitorPushMsg(eventName, filename);
										});
										
										exec('/usr/local/bin/volumio volume ' + self.config.get('initvolume'));
									}
								}
							);
							
						}, minosseDelay);
						
					}
				}
		    }
		);
		
		this.commandRouter.sharedVars.registerCallback('alsa.outputdevice', this.onOutputDeviceChange.bind(this));
		
		// Once the Plugin has successfull started resolve the promise
		defer.resolve();
		
	} catch (err) {
        console.log(IDSTR + err);
        self.commandRouter.pushToastMessage('error', err);
		
        defer.resolve();
	}
	
	return defer.promise;
};

minossedsp.prototype.onStop = function() {
    var self = this;
	const IDSTR = "MinosseDSP::onStop: ";
	const sleepBeforeReboot = 4.5;	// Time in seconds
    var defer=libQ.defer();
	
	console.log(IDSTR + self.getI18nString('PLUGIN_DEACTIVATING'));
	self.commandRouter.pushToastMessage('info', self.getI18nString('PLUGIN_DEACTIVATING'));
	
	// Mute the sound card to avoid unpleasant noises
	execSync('/usr/local/bin/mdsp-amixmute.sh');
	
	sleep(400).then(() => {
		
		// Reset all options to default values
		// Volume Settings section:
		self.config.set('volumeenabled', true);
		self.config.set('volumemax', 30);
		self.config.set('volumemin', 80);
		self.config.set('volumesteps', 2);
		self.config.set('initvolume', 40);
		self.config.set('filteratt', 6);
		// Filters and Coefficients Options section:
		self.config.set('dspchoice', 'dsp_eq_10_band');
		self.config.set('dspeq10band', initeq);
		self.config.set('outchannels', '2.0');
		self.config.set('coeffid', 'undefined');
		// Input Buffer Options section:
		self.config.set('bufferdelay', '1.2');
		
		//execSync('/usr/local/bin/mdsp-voloptvis.sh');
		//execSync('/usr/local/bin/mdsp-voloveroff.sh');
		var overrideVolume = {
	        'volumeOverride': false,
			'pluginType': '',
            'pluginName': '',
			'card': self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', 'outputdevice'),
			'overrideMixerType' : 'Hardware',
			'overrideAvoidSoftwareMixer' : false
	    };
		self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'setDeviceVolumeOverride', overrideVolume);
		
		// Try to set mixer type to Hardware (if any), as Software type would be bypassed by Minosse
		//self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'setConfigParam', {key: 'mixer_type', value: 'Hardware'});
		// Try to set hardware volume controls (if any) to safe levels
		exec('/usr/local/bin/mdsp-amixsafe.sh');
		
		// The following delays need to be synchronized with the one in uninstall.sh
		
		sleep(1000).then(() => {
			
			// Deactivate Minosse core
			const commstr = '/bin/echo \'{"event":"mdsp-deactivate","data":""}\' > ' + core_fifo;
			//console.log(IDSTR + commstr);
			exec(commstr,
				function (error, stdout, stderr)
				{
			    	if (error)
					{
			        	console.log(IDSTR + error);
			      	}
			    }
			);
			
			// Close uninstall modals
			self.commandRouter.closeModals();
			
			sleep(4000).then(() => {
				
				console.log(IDSTR + self.getI18nString('DEACTIVATION_SUCCESS_VOLUME_OFF'));
				self.commandRouter.pushToastMessage('warning', self.getI18nString('DEACTIVATION_SUCCESS_VOLUME_OFF'));
				exec('/bin/sleep ' + sleepBeforeReboot + ' && /usr/bin/sudo /sbin/shutdown -r now');
			
			});
			
		});
		
	});

    // Once the Plugin has successfully stopped resolve the promise
    defer.resolve();

    return libQ.resolve();
};

minossedsp.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};

// Custom Methods -----------------------------------------------------------------------------

minossedsp.prototype.getMinosseConf = function()
{
	var self = this;
	
	if (isMinosseConf == false) {
		
		// Getting configuration
		var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
		this.config = new (require('v-conf'))();
		this.config.loadFile(configFile);
		
		// When you activate Minosse for the first time, config is undefined, so initialize it using UIConfig.json default values
		// Volume Settings section:
		if (typeof self.config.get('volumeenabled') === 'undefined') { self.config.set('volumeenabled', true); }
		if (typeof self.config.get('volumemax') === 'undefined') { self.config.set('volumemax', '30'); }
		if (typeof self.config.get('volumemin') === 'undefined') { self.config.set('volumemin', '80'); }
		if (typeof self.config.get('volumesteps') === 'undefined') { self.config.set('volumesteps', '2'); }
		if (typeof self.config.get('initvolume') === 'undefined') { self.config.set('initvolume', '40'); }
		if (typeof self.config.get('filteratt') === 'undefined') { self.config.set('filteratt', '6'); }
		// Filters and Coefficients Options section:
		if (typeof self.config.get('dspchoice') === 'undefined') { self.config.set('dspchoice', 'dsp_eq_10_band'); }
		if (typeof self.config.get('dspeq10band') === 'undefined') { self.config.set('dspeq10band', initeq); }
		if (typeof self.config.get('outchannels') === 'undefined') { self.config.set('outchannels', '2.0'); }
		if (typeof self.config.get('coeffid') === 'undefined') { self.config.set('coeffid', 'undefined'); }
		// Input Buffer Options section:
		if (typeof self.config.get('bufferdelay') === 'undefined') { self.config.set('bufferdelay', '1.2'); }
		
		self.executeOnPlugin2params('system_controller', 'system', 'setConf', 'startupSound', false);
		
		isMinosseConf = true;
	}
};

minossedsp.prototype.setMixerTypeNone = function() {
	var self = this;
	
	// Set mixer_type to None to allow usage of Minosse volume control
	self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'setConfigParam', {key: 'mixer_type', value: 'None'});
	//self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'setConfigParam', {key: 'volumesteps', value: self.config.get('volumesteps')});
	//self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'setConfigParam', {key: 'volumecurvemode', value: 'linear'});
	self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'setConfigParam', {key: 'mpdvolume', value: false});
	self.commandRouter.executeOnPlugin('music_service', 'mpd', 'setConfigParam', {key: 'volume_normalization', value: false});
};

minossedsp.prototype.removeTrackData = function() {
	var self = this;
	const IDSTR = "MinosseDSP::removeTrackData: ";
	
	try {
		
		const rdata = fs.readFileSync(MDSP_BF_CONF, {encoding: 'utf8'});
		var confjson = JSON.parse(rdata);
		confjson.sampling_rate = "";
		confjson.in_bit_depth = "";
		confjson.unsupported_sr = "";
		
		const wdata = JSON.stringify(confjson);
		fs.writeFileSync(MDSP_BF_CONF, wdata, {encoding: 'utf8'}, (werr) => {
		    if (werr) {
		        console.log(IDSTR + werr);
		    }
		});
		
	} catch (jerr) {
		console.log(IDSTR + jerr);
	}
};

minossedsp.prototype.configureCoreService = function() {
	var self = this;
	const IDSTR = "MinosseDSP::configureCoreService: ";
	
	try {
		
		const rdata = fs.readFileSync(MDSP_BF_CONF, {encoding: 'utf8'});
		var confjson = JSON.parse(rdata);
		confjson.float_bits = "64";
		confjson.audio_type = self.config.get('outchannels');
		confjson.filter_coeff_id = self.config.get('coeffid');
		confjson.in_fifo_delay = self.config.get('bufferdelay');
		
		if (self.config.get('volumeenabled')) {
			var dbsteps = (self.config.get('volumemin') - self.config.get('volumemax')) / 100;	// Volume dB steps
			var val = self.config.get('volumemin') - (self.config.get('initvolume') * dbsteps);
			var attdB = Number(val).toFixed(1);
			confjson.out_volume = attdB;
		} else {
			confjson.out_volume = self.config.get('filteratt');
		}
		
		if (self.config.get('dspchoice') == 'dsp_eq_10_band') {
			confjson.eq_enabled = "true";
		} else {
			confjson.eq_enabled = "false";
		}
		confjson.eq_magnitude = self.config.get('dspeq10band');
		
		const wdata = JSON.stringify(confjson);
		fs.writeFileSync(MDSP_BF_CONF, wdata, {encoding: 'utf8'}, (werr) => {
		    if (werr) {
		        console.log(IDSTR + werr);
		    }
		});
		
	} catch (jerr) {
		console.log(IDSTR + jerr);
	}
};

minossedsp.prototype.eraseCoeffID = function() {
	var self = this;
	const IDSTR = "MinosseDSP::eraseCoeffID: ";
	
	try {
		
		const rdata = fs.readFileSync(MDSP_BF_CONF, {encoding: 'utf8'});
		var confjson = JSON.parse(rdata);
		confjson.filter_coeff_id = "";
		
		const wdata = JSON.stringify(confjson);
		fs.writeFileSync(MDSP_BF_CONF, wdata, {encoding: 'utf8'}, (werr) => {
		    if (werr) {
		        console.log(IDSTR + werr);
		    }
		});
		
	} catch (jerr) {
		console.log(IDSTR + jerr);
	}
};

minossedsp.prototype.configHwCard = function() {
	var self = this;
	const IDSTR = "MinosseDSP::configHwCard: ";
	
	self.commandRouter.volumioStop();
	if (self.config.get('volumeenabled')) {
		// Configure audio card hardware devices (volume, number of channels, etc.)
		console.log(IDSTR + 'Minosse volume is enabled, reconfiguring audio card using mdsp-amixconf.sh');
		execSync('/usr/local/bin/mdsp-amixconf.sh');
	} else {
		// Configure audio card hardware devices (all settings except for volume controls)
		console.log(IDSTR + 'Minosse volume is disabled, reconfiguring audio card using mdsp-amixconfch.sh');
		execSync('/usr/local/bin/mdsp-amixconfch.sh');
	}
	
};

minossedsp.prototype.monitorPushMsg = async function(eventName, filename) {
	var self = this;
	const IDSTR = "MinosseDSP::monitorPushMsg: "
	
	if(filename == pushMsgFile && eventName == 'change'){
		try {
			//### msgfile example:
			//	  {"type":"warning","content":"RECONFIGURING_AUDIO_NO_PCM","extra":""}
			var msgfile = fs.readFileSync(pushMsgPath + pushMsgFile, {encoding: 'utf8'});
			var msgjson = JSON.parse(msgfile);
			if (typeof msgjson.extra === 'undefined') {
				console.log(IDSTR + self.getI18nString(msgjson.content));
				self.commandRouter.pushToastMessage(msgjson.type, self.getI18nString(msgjson.content));
			} else {
				console.log(IDSTR + self.getI18nString(msgjson.content) + msgjson.extra);
				self.commandRouter.pushToastMessage(msgjson.type, self.getI18nString(msgjson.content) + msgjson.extra);
			}
		} catch(err) {
			console.log(IDSTR + err);
		}
	}
	
};

minossedsp.prototype.alsavolume = function (VolumeInteger) {
	var self = this;
	const IDSTR = "MinosseDSP::alsavolume: ";
	var defer = libQ.defer();
	var Volume = {};
	var dbsteps = '';
	var attdB = '';
	var val = '';
	
	dbsteps = (self.config.get('volumemin') - self.config.get('volumemax')) / 100;	// Volume dB steps
	
	switch (VolumeInteger) {
		case 'mute':
			// Mute (simply set volume to zero)
			exec('/usr/local/bin/volumio volume 0');
			break;
		case 'unmute':
			// Unmute
			
			break;
		case 'toggle':
			// Mute or unmute, depending on current state
			
			break;
		case '+':
			exec('/usr/local/bin/mdsp-turnvol-gui.sh ' + self.config.get('volumesteps'));
			break;
		case '-':
			exec('/usr/local/bin/mdsp-turnvol-gui.sh -' + self.config.get('volumesteps'));
			break;
		default:
			// Set the volume with numeric value 0-100
			if (VolumeInteger < 0) {
				VolumeInteger = 0;
			}
			if (VolumeInteger > 100) {
				VolumeInteger = 100;
			}
			switch (VolumeInteger) {
				case 0:
					val = self.config.get('volumemin');
					break;
				case 100:
					val = self.config.get('volumemax');
					break;
				default:
					val = self.config.get('volumemin') - (VolumeInteger * dbsteps);
			}
			attdB = Number(val).toFixed(1);
			Volume.vol = VolumeInteger;
			Volume.mute = false;
			Volume.disableVolumeControl = false;
			defer.resolve(Volume);
			execSync('/usr/local/bin/mdsp-setvol.sh ' + attdB);
			/*
			var msgtype = 'info';
			if (attdB <= 15) {
				msgtype = 'warning'
			}
			console.log(IDSTR + self.getI18nString('VOLUME_DB_MESSAGE') + attdB + ' dB');
			self.commandRouter.pushToastMessage(msgtype, self.getI18nString('VOLUME_DB_MESSAGE') + attdB + ' dB');
			*/
	}
	
	return defer.promise;
};

minossedsp.prototype.retrievevolume = function () {
	var self = this;
	const IDSTR = "MinosseDSP::retrievevolume: ";
	var defer = libQ.defer();
	var Volume = {};
	
	exec('/usr/local/bin/volumio volume',
		function (error, stdout, stderr)
		{
			if (error)
			{
	        	console.log(IDSTR + error);
				Volume.vol = self.config.get('initvolume');
	      	}
			else
			{
				console.log(IDSTR + '"volumio volume" returned ' + stdout);
				if (0 <= stdout && stdout <= 100) {
					Volume.vol = stdout;
				} else {
					Volume.vol = self.config.get('initvolume');
				}
	      	}
			console.log(IDSTR + Volume.vol);
			Volume.mute = false;
			Volume.disableVolumeControl = false;
			defer.resolve(Volume);
	    }
	);
	
	return defer.promise;
};

minossedsp.prototype.getI18nString = function (key) {
	var splitted = key.split('.');

	if (this.i18nStrings) {
  		if (splitted.length == 1) {
			if (this.i18nStrings[key] !== undefined && this.i18nStrings[key] !== '') {
				return this.i18nStrings[key];
			} else return this.i18nStringsDefaults[key];
		} else {
			if (this.i18nStrings[splitted[0]] !== undefined &&
                this.i18nStrings[splitted[0]][splitted[1]] !== undefined &&
				this.i18nStrings[splitted[0]][splitted[1]] !== '') {
				return this.i18nStrings[splitted[0]][splitted[1]];
			} else return this.i18nStringsDefaults[splitted[0]][splitted[1]];
		}
	} else {
		var emptyString = '';
		return emptyString;
	}
};

minossedsp.prototype.loadI18nStrings = function () {
	var self = this;
	const IDSTR = "MinosseDSP::loadI18nStrings: ";
	
	var language_code = this.commandRouter.sharedVars.get('language_code');
	this.i18nStringsDefaults = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
	
	try {
		this.logger.info(IDSTR + 'Loading i18n strings for locale ' + language_code);
	  	this.i18nStrings = fs.readJsonSync(__dirname + '/i18n/strings_' + language_code + '.json');
	} catch (e) {
		this.logger.error(IDSTR + 'Failed to load i18n strings for locale ' + language_code + ': ' + e);
		this.i18nStrings = this.i18nStringsDefaults;
	}
};

minossedsp.prototype.executeOnPlugin2params = function (type, name, method, param1, param2) {
	var self = this;
	const IDSTR = "MinosseDSP::executeOnPlugin2params: ";
	
	this.logger.info(IDSTR + name + ' , ' + method);

	var thisPlugin = this.commandRouter.pluginManager.getPlugin(type, name);

	if (thisPlugin != undefined) {
		if (thisPlugin[method]) {
			return thisPlugin[method](param1, param2);
		} else {
			this.logger.error(IDSTR + 'No method [' + method + '] in plugin ' + name);
		}
	} else return undefined;
};

minossedsp.prototype.VolumeOffReboot = function(v) {
	var self = this;
	const IDSTR = "MinosseDSP::executeOnPlugin2params: ";
	const sleepBeforeReboot = 4.5;	// Time in seconds
	
	self.config.set('volumeenabled', false);
	
	// Restore Volumio volume and reboot
	//execSync('/usr/local/bin/mdsp-voloveroff.sh');
	// Restore Volumio volume options section
	//execSync('/usr/local/bin/mdsp-voloptvis.sh');
	
	// Try to set mixer type to Hardware (if any), as Software type would be bypassed by Minosse
	self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'setConfigParam', {key: 'mixer_type', value: 'Hardware'});
	// Try to set hardware volume controls (if any) to safe levels
	exec('/usr/local/bin/mdsp-amixsafe.sh');
	
	console.log(IDSTR + self.getI18nString('VOLUME_DISABLED_AND_REBOOT'));
	self.commandRouter.pushToastMessage('warning', self.getI18nString('VOLUME_DISABLED_AND_REBOOT'));
	exec('/bin/sleep ' + sleepBeforeReboot + ' && /usr/bin/sudo /sbin/shutdown -r now');
};

// Configuration Methods -----------------------------------------------------------------------------

minossedsp.prototype.getUIConfig = function() {
	var self = this;
	const IDSTR = "MinosseDSP::getUIConfig: ";
    var defer = libQ.defer();
    
    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {
			//console.log(IDSTR + JSON.stringify(uiconf));
			
			// Volume Settings section:
			self.configManager.setUIConfigParam(uiconf, 'sections[3].content[0].value', self.config.get('volumeenabled'));
			self.configManager.setUIConfigParam(uiconf, 'sections[3].content[1].value.value', self.config.get('volumemax'));
			self.configManager.setUIConfigParam(uiconf, 'sections[3].content[1].value.label', self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[3].content[1].options'), self.config.get('volumemax')));
			self.configManager.setUIConfigParam(uiconf, 'sections[3].content[2].value.value', self.config.get('volumemin'));
			self.configManager.setUIConfigParam(uiconf, 'sections[3].content[2].value.label', self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[3].content[2].options'), self.config.get('volumemin')));
			self.configManager.setUIConfigParam(uiconf, 'sections[3].content[3].value.value', self.config.get('volumesteps'));
			self.configManager.setUIConfigParam(uiconf, 'sections[3].content[3].value.label', self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[3].content[3].options'), self.config.get('volumesteps')));
			self.configManager.setUIConfigParam(uiconf, 'sections[3].content[4].value.value', self.config.get('initvolume'));
			self.configManager.setUIConfigParam(uiconf, 'sections[3].content[4].value.label', self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[3].content[4].options'), self.config.get('initvolume')));
			self.configManager.setUIConfigParam(uiconf, 'sections[3].content[5].value.value', self.config.get('filteratt'));
			self.configManager.setUIConfigParam(uiconf, 'sections[3].content[5].value.label', self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[3].content[5].options'), self.config.get('filteratt')));
			
			// Input Delay Options section:
			self.configManager.setUIConfigParam(uiconf, 'sections[4].content[0].value.value', self.config.get('bufferdelay'));
			self.configManager.setUIConfigParam(uiconf, 'sections[4].content[0].value.label', self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[4].content[0].options'), self.config.get('bufferdelay')));
			
			// DSP choice section:
			self.configManager.setUIConfigParam(uiconf, 'sections[0].content[0].value.value', self.config.get('dspchoice'));
			self.configManager.setUIConfigParam(uiconf, 'sections[0].content[0].value.label', self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[0].content[0].options'), self.config.get('dspchoice')));
			if (self.config.get('dspchoice') == 'dsp_eq_10_band') {
				self.configManager.setUIConfigParam(uiconf, 'sections[1].hidden', false);
				self.configManager.setUIConfigParam(uiconf, 'sections[2].hidden', true);
			} else if (self.config.get('dspchoice') == 'dsp_drc') {
				self.configManager.setUIConfigParam(uiconf, 'sections[1].hidden', true);
				self.configManager.setUIConfigParam(uiconf, 'sections[2].hidden', false);
			}
			
			// DRC Options section:
			self.configManager.setUIConfigParam(uiconf, 'sections[2].content[1].value.value', self.config.get('outchannels'));
			self.configManager.setUIConfigParam(uiconf, 'sections[2].content[1].value.label', self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[2].content[1].options'), self.config.get('outchannels')));
			exec('/usr/local/bin/mdsp-getcoefflist.sh',
				function (error, stdout, stderr)
				{
					var firstcoeff = '';
			    	if (error)
					{
			        	console.log(IDSTR + error);
			      	} else {
						var lines = stdout.split('\n');
						for (var j = 0; j < lines.length - 1; j++) {
							//console.log(IDSTR +  j + ' is ' + lines[j]);
							if (lines[j] == '') {
								self.configManager.pushUIConfigParam(uiconf, 'sections[2].content[0].options', {
							        value: 'undefined',
							        label: 'undefined'
						        });
								if (j == 0) { firstcoeff = 'undefined'}
							} else {
								self.configManager.pushUIConfigParam(uiconf, 'sections[2].content[0].options', {
							        value: lines[j],
							        label: lines[j]
						        });
								if (j == 0) { firstcoeff = lines[j]}
							}
						}
						if (self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[2].content[0].options'), self.config.get('coeffid')) == self.config.get('coeffid')) {
							self.configManager.setUIConfigParam(uiconf, 'sections[2].content[0].value.value', self.config.get('coeffid'));
							self.configManager.setUIConfigParam(uiconf, 'sections[2].content[0].value.label', self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[2].content[0].options'), self.config.get('coeffid')));
						} else {
							self.configManager.setUIConfigParam(uiconf, 'sections[2].content[0].value.value', firstcoeff);
							self.configManager.setUIConfigParam(uiconf, 'sections[2].content[0].value.label', self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[2].content[0].options'), firstcoeff));
							// The coeffid value is undefined or inappropriate in the new context (maybe outchannels value was changed), so select the first on the list
							self.config.set('coeffid', firstcoeff);
						}
						
						// Equalizer Options section:
						var eq10var = self.config.get('dspeq10band');
						var eq10array = eq10var.split(',');
						for (var i in eq10array) {
							self.configManager.setUIConfigParam(uiconf, 'sections[1].content[0].config.bars[' + i + '].value', eq10array[i]);
						}
						
						self.configManager.setUIConfigParam(uiconf, 'sections[1].content[1].value', false);
						self.configManager.setUIConfigParam(uiconf, 'sections[1].content[3].value', false);
						
						exec('/usr/local/bin/mdsp-eq-getpsetlist.sh', {encoding: 'utf8'},
							function (error, stdout, stderr)
							{
								var firstpset = '';
						    	if (error)
								{
						        	console.log(IDSTR + error);
						      	} else {
									var lines = stdout.split('\n');
									for (var j = 0; j < lines.length - 1; j++) {
										//console.log(IDSTR +  j + ' is ' + lines[j]);
										if (lines[j] == '') {
											self.configManager.pushUIConfigParam(uiconf, 'sections[1].content[2].options', {
										        value: 'undefined',
										        label: 'undefined'
									        });
											if (j == 0) { firstpset = 'undefined'}
										} else {
											self.configManager.pushUIConfigParam(uiconf, 'sections[1].content[2].options', {
										        value: lines[j].toUpperCase(),
										        label: lines[j].toUpperCase()
									        });
											if (j == 0) { firstpset = lines[j].toUpperCase()}
										}
									}
									
									self.configManager.setUIConfigParam(uiconf, 'sections[1].content[2].value.value', firstpset);
									self.configManager.setUIConfigParam(uiconf, 'sections[1].content[2].value.label', self.getLabelForSelect(self.configManager.getValue(uiconf, 'sections[1].content[2].options'), firstpset));
									
								}
								
								//console.log(IDSTR + JSON.stringify(uiconf));
								defer.resolve(uiconf);
						    }
						);
						
					}
			    }
			);
			
        })

        .fail(function()
        {
            defer.reject(new Error());
        });

	return defer.promise;
};

minossedsp.prototype.getLabelForSelect = function (options, key) {
	var self = this;
	
	var n = options.length;
	for (var i = 0; i < n; i++) {
		if (options[i].value == key) { return options[i].label; }
	}
	return 'Error';
};

minossedsp.prototype.saveVolumeSettings = function (data) {
	var self = this;
	const IDSTR = "MinosseDSP::saveVolumeSettings: ";
	const sleepBeforeReboot = 4.5;	// Time in seconds
	var defer = libQ.defer();
	var prev_volenabled = self.config.get('volumeenabled');
	var revolmax = false;
	if (self.config.get('volumemax') != data['volume_max'].value) {
		revolmax = true;
	}
	var revolmin = false;
	if (self.config.get('volumemin') != data['volume_min'].value) {
		revolmin = true;
	}
	
	self.config.set('volumeenabled', data['volume_enabled']);
	self.config.set('volumemax', data['volume_max'].value);
	self.config.set('volumemin', data['volume_min'].value);
	self.config.set('volumesteps', data['volume_steps'].value);
	//self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'setConfigParam', {key: 'volumesteps', value: self.config.get('volumesteps')});
	self.config.set('initvolume', data['init_volume'].value);
	self.config.set('filteratt', data['filters_attenuation'].value);
	
	this.logger.info(IDSTR + self.config.get('volumeenabled') + ' ' + self.config.get('volumemax') + ' ' + self.config.get('volumemin') + ' ' + self.config.get('volumesteps') + ' ' + self.config.get('initvolume') + ' | ' + self.config.get('filteratt'));
	
	if (prev_volenabled != self.config.get('volumeenabled')) {
		if (self.config.get('volumeenabled')) {
			
			//========== MINOSSE VOLUME HAS JUST BEEN ENABLED ==========
			
			self.setMixerTypeNone();
			// Override Volumio volume and reboot
			//execSync('/usr/local/bin/mdsp-voloveron.sh');
			// Hide Volumio volume options section
			//execSync('/usr/local/bin/mdsp-volopthid.sh');
			
			console.log(IDSTR + self.getI18nString('VOLUME_ENABLED_AND_REBOOT'));
			self.commandRouter.pushToastMessage('warning', self.getI18nString('VOLUME_ENABLED_AND_REBOOT'));
			exec('/bin/sleep ' + sleepBeforeReboot + ' && /usr/bin/sudo /sbin/shutdown -r now');
		} else {
			
			//========== MINOSSE VOLUME HAS JUST BEEN DISABLED ==========
			
			// Sometimes the modal message disappears and the system doesn't reboot, so change 'volumeenabled' value only if the system actually reboots
			self.config.set('volumeenabled', true);
			
			sleep(500).then(() => {
				// Warn the user to be extra cautious because Minosse volume is being disabled
				var volumeOffWarning = {
					title: self.getI18nString('WARNING'),
					message: self.getI18nString('VOLUME_OFF_WARNING'),
					size: 'lg',
					buttons: [
						{
							name: self.getI18nString('CANCEL'),
							class: 'btn btn-warning',
							emit: 'closeModals',
							payload: ''
						},
						{
							name: self.getI18nString('CONTINUE_AND_REBOOT'),
							class: 'btn btn-warning',
							emit: 'callMethod',
							payload: { 'endpoint': 'audio_interface/minossedsp', 'method': 'VolumeOffReboot', 'data': '' }
						}
					]
				};
				console.log(IDSTR + self.getI18nString('VOLUME_OFF_WARNING'));
			    self.commandRouter.broadcastMessage('openModal', volumeOffWarning);
			});
		}
	} else {
		if (self.config.get('volumeenabled')) {
			
			//========== MINOSSE VOLUME IS ENABLED ==========
			
			var dbsteps = ((self.config.get('volumemin') - self.config.get('volumemax')) / 100) * self.config.get('volumesteps');
			//console.log(IDSTR + dbsteps);
			if (revolmax || revolmin) {
				exec('/usr/local/bin/volumio volume',
					function (error, stdout, stderr)
					{
						if (error)
						{
				        	console.log(IDSTR + error);
				      	}
						else
						{
							//console.log(IDSTR + stdout);
							exec('/usr/local/bin/volumio volume ' + stdout);
							console.log(IDSTR + self.getI18nString('VOLUME_SAVE_SETTINGS_AND_REVOL') + Number(dbsteps).toFixed(1) + ' dB');
							self.commandRouter.pushToastMessage('success', self.getI18nString('VOLUME_SAVE_SETTINGS_AND_REVOL') + Number(dbsteps).toFixed(1) + ' dB');
				      	}
				    }
				);
			} else {
				console.log(IDSTR + self.getI18nString('VOLUME_SAVE_SETTINGS') + Number(dbsteps).toFixed(1) + ' dB');
				self.commandRouter.pushToastMessage('success', self.getI18nString('VOLUME_SAVE_SETTINGS') + Number(dbsteps).toFixed(1) + ' dB');
			}
		} else {
			
			//========== MINOSSE VOLUME IS DISABLED ==========
			
			exec('/usr/local/bin/mdsp-setvol.sh ' + self.config.get('filteratt'));
			console.log(IDSTR + self.getI18nString('ATT_SAVE_SETTINGS'));
			self.commandRouter.pushToastMessage('success', self.getI18nString('ATT_SAVE_SETTINGS'));
		}
	}
	
	defer.resolve({});
	return defer.promise;
};

minossedsp.prototype.saveEQoptions = function (data) {
	var self = this;
	const IDSTR = "MinosseDSP::saveEQoptions: ";
	
	if (data['eq_load_preset_switch'] == true) {
		
		//========== THE USER WANTS TO LOAD A PRESET ==========
		
		var psetname = data['eq_load_preset_select'].value;
		var eq10var = execSync('/usr/local/bin/mdsp-eq-loadpset.sh ' + psetname, {encoding: 'utf8'});
		self.config.set('dspeq10band', eq10var);
		console.log(IDSTR + psetname + ' -> ' + self.config.get('dspeq10band'));
		execSync('/usr/local/bin/mdsp-eq-setmagnitude.sh ' + self.config.get('dspeq10band'));
		
		console.log(IDSTR + self.getI18nString('EQ_SETTINGS'));
		self.commandRouter.pushToastMessage('success', self.getI18nString('EQ_SETTINGS'));
		
		// Refresh the configuration panel immediately			
		var respconfig = self.commandRouter.getUIConfigOnPlugin('audio_interface', 'minossedsp', {});
		respconfig.then(function (config) {
			self.commandRouter.broadcastMessage('pushUiConfig', config);
		});
		
	} else if (data['eq_save_preset_switch'] == true) {
		
		//========== THE USER WANTS TO SAVE A PRESET ==========
		
		const eqpresets = ["ACOUSTIC","CLASSICAL","ELECTRONIC","FLAT","PIPPO77","PIPPOSDGSDGD","POP","ROCK"];
		
		var tmpname = data['eq_save_preset_input'];
		
		// Check if the preset name is void
		if (tmpname == "" || tmpname == null || tmpname == undefined) {
			console.log(IDSTR + self.getI18nString('EQ_VOID_NAME'));
			self.commandRouter.pushToastMessage('error', self.getI18nString('EQ_VOID_NAME'));
		} else {
			
			var savename = tmpname.toUpperCase().trim();
			
			// Check if the preset name is letters and numbers only
			if (! /^[A-Za-z0-9\-_]*$/.test(savename)) {
				console.log(IDSTR + self.getI18nString('EQ_INVALID_NAME'));
				self.commandRouter.pushToastMessage('error', self.getI18nString('EQ_INVALID_NAME'));
			} else {
				
				// Check if the name provided is one of the default presets
				if (eqpresets.includes(savename)) {
					console.log(IDSTR + self.getI18nString('EQ_DEFAULT_NAME'));
					self.commandRouter.pushToastMessage('error', self.getI18nString('EQ_DEFAULT_NAME'));
				} else {
					
					self.config.set('dspeq10band', data['dsp_eq_10_band']);
					execSync('/usr/local/bin/mdsp-eq-setmagnitude.sh ' + self.config.get('dspeq10band'));
					console.log(IDSTR + savename + ' ' + self.config.get('dspeq10band'));
					
					exec('/usr/local/bin/mdsp-eq-savepset.sh "' + savename + '" ' + self.config.get('dspeq10band'),
						function (error, stdout, stderr)
						{
							if (error)
							{
					        	console.log(IDSTR + error);
					      	}
							else
							{
								console.log(IDSTR + self.getI18nString('EQ_SAVE_SUCCESS'));
								self.commandRouter.pushToastMessage('success', self.getI18nString('EQ_SAVE_SUCCESS'));
								
								// Refresh the configuration panel immediately			
								var respconfig = self.commandRouter.getUIConfigOnPlugin('audio_interface', 'minossedsp', {});
								respconfig.then(function (config) {
									self.commandRouter.broadcastMessage('pushUiConfig', config);
								});
					      	}
					    }
					);
				}
			}
		}
		
	} else {
		
		//========== THE USER WANTS TO APPLY THE NEW EQUALIZER SETTINGS ==========
		
		self.config.set('dspeq10band', data['dsp_eq_10_band']);
		console.log(IDSTR + self.config.get('dspchoice') + ' ' + self.config.get('dspeq10band'));
		execSync('/usr/local/bin/mdsp-eq-setmagnitude.sh ' + self.config.get('dspeq10band'));
		
		console.log(IDSTR + self.getI18nString('EQ_SETTINGS'));
		self.commandRouter.pushToastMessage('success', self.getI18nString('EQ_SETTINGS'));
		
	}
	
};

minossedsp.prototype.saveInputBufferOptions = function(data) {
    var self = this;
	const IDSTR = "MinosseDSP::saveInputBufferOptions: ";
	
	// Check if bufferdelay is changed
	if (data['buffer_delay'].value != self.config.get('bufferdelay')) {
		
		try {
			
			const rdata = fs.readFileSync(MDSP_BF_CONF, {encoding: 'utf8'});
			var confjson = JSON.parse(rdata);
			confjson.in_fifo_delay = data['buffer_delay'].value;
						
			const wdata = JSON.stringify(confjson);
			fs.writeFile(MDSP_BF_CONF, wdata, {encoding: 'utf8'}, (werr) => {
			    if (werr) {
			        console.log(IDSTR + werr);
			    } else {
					self.config.set('bufferdelay', data['buffer_delay'].value);
					
					console.log(IDSTR + self.getI18nString('BUFFER_OPTIONS_SAVED'));
					self.commandRouter.pushToastMessage('success', self.getI18nString('BUFFER_OPTIONS_SAVED'));
				}
			});
			
		} catch (jerr) {
			console.log(IDSTR + jerr);
		}
		
	}
};

minossedsp.prototype.onOutputDeviceChange = function() {
    var self = this;
	const IDSTR = "MinosseDSP::onOutputDeviceChange: ";
	const sleepTimeout = 1000;		// Time in milliseconds
	
	// It seems that Volumio callbacks this function more than once, so avoid parallel execution using outputDeviceFlag and sleep(sleepTimeout)
	if (outputDeviceFlag) return;
	try {
		outputDeviceFlag = true;
		// Check if the new output device is Loopback and, in case, warn the user to change it
		var data = fs.readFileSync('/etc/asound.conf', {encoding: 'utf8'});
		if (data.includes('Loopback')) {
			
			//========== THE USER SELECTED THE LOOPBACK DEVICE, WARN HIM TO CHANGE IT ==========
			
			// Wait some seconds to avoid multiple callbacks from Volumio
			sleep(sleepTimeout).then(() => {
				
				// Close I2S modal to reboot
				self.commandRouter.closeModals();
				
				// Warn the user that selecting Loopback is not allowed
				var noLoopbackAllowed = {
					title: self.getI18nString('ERROR'),
					message: self.getI18nString('NO_LOOPBACK_ALLOWED'),
					size: 'lg',
					buttons: [
						{
							name: "OK",
							class: 'btn btn-warning',
							emit: 'closeModals',
							payload: ''
						}
					]
				};
				console.log(IDSTR + self.getI18nString('NO_LOOPBACK_ALLOWED'));
			    self.commandRouter.broadcastMessage('openModal', noLoopbackAllowed);
				outputDeviceFlag = false;
			});
		} else {
			
			// Wait some seconds to avoid multiple callbacks from Volumio
			sleep(sleepTimeout).then(() => {
			
				// Get the audio card number
				var ndev = fs.readFileSync('/tmp/mdsp-bf-conf.json', {encoding: 'utf8'});
				var ndevice = JSON.parse(ndev);
				//console.log(IDSTR + ndevice.out_device_number);
				
				// Get the newly selected audio card number (could be in the form of '0' or '0,3')
				var rvalue = self.getAudioCardNumber();
				var value = rvalue;
				if (rvalue.includes(',')) {
					value = rvalue.substring(0, value.indexOf(','));
				}
					
				if (ndevice.out_device_number != value) {
					console.log(IDSTR + 'newly selected output audio card number is ' + value);
					
					// Close I2S modal to reboot
					self.commandRouter.closeModals();
					
					// Count how many hardware devices has the selected audio card
					var amixctls = execSync('amixer -c ' + value + ' scontrols', {encoding: 'utf8'});
					//console.log(IDSTR + amixctls);
					var nhwdev = amixctls.split(/\r\n|\r|\n/).length -1;
					//var nlines = amixctls.split("\n").length - 1;
					console.log(IDSTR + 'newly selected output audio card has ' + nhwdev + ' hardware devices');
					
					// If nhwdev > 0 warn the user to check hardware devices using alsamixer
					if (nhwdev > 0) {
						
						sleep(400).then(() => {
							var hwWarning = {
								title: self.getI18nString('WARNING'),
								message: self.getI18nString('OUTPUT_DEVICE_WARNING_1') + nhwdev + self.getI18nString('OUTPUT_DEVICE_WARNING_2'),
								size: 'lg',
								buttons: [
									{
										name: self.getI18nString('REBOOT'),
										class: 'btn btn-warning',
										emit: 'callMethod',
										payload: { 'endpoint': 'audio_interface/minossedsp', 'method': 'OutputDeviceReboot', 'data': '' }
									}
								]
							};
							console.log(IDSTR + self.getI18nString('OUTPUT_DEVICE_WARNING_1') + nhwdev + self.getI18nString('OUTPUT_DEVICE_WARNING_2'));
						    self.commandRouter.broadcastMessage('openModal', hwWarning);
						});
						
					} else {
						self.OutputDeviceReboot();
					}
					
				}
				outputDeviceFlag = false;
			});
		}
	} catch(err) {
		outputDeviceFlag = false;
		console.log(IDSTR + err);
	}
};

minossedsp.prototype.OutputDeviceReboot = function() {
    var self = this;
	const IDSTR = "MinosseDSP::OutputDeviceReboot: ";
	const sleepTimeout = 1000;		// Time in milliseconds
	const sleepBeforeReboot = 4.5;	// Time in seconds
	
	//if (self.config.get('volumeenabled') || self.config.get('outchannels') != '2.0') {
		sleep(sleepTimeout).then(() => {
			if (self.config.get('volumeenabled')) {
				self.setMixerTypeNone();
			} else {
				// Try to set mixer type to Hardware (if any), as Software type would be bypassed by Minosse
				self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'setConfigParam', {key: 'mixer_type', value: 'Hardware'});
				// Try to set hardware volume controls (if any) to safe levels
				exec('/usr/local/bin/mdsp-amixsafe.sh');
			}
			
			// Remove fftw wisdom files
			exec('/bin/rm -v -f /data/INTERNAL/minossedsp/fftw-wisdom/mdsp-*');
			
			self.config.set('outchannels', '2.0');
			console.log(IDSTR + self.getI18nString('OUTPUT_DEVICE_SUCCESS_AND_REBOOT'));
			self.commandRouter.pushToastMessage('warning', self.getI18nString('OUTPUT_DEVICE_SUCCESS_AND_REBOOT'));
			exec('/bin/sleep ' + sleepBeforeReboot + ' && /usr/bin/sudo /sbin/shutdown -r now');
		});
	//}
};

minossedsp.prototype.saveDSPchoice = function(data) {
    var self = this;
	const IDSTR = "MinosseDSP::saveDSPchoice: ";
	
	if (data['dsp_choice'].value != self.config.get('dspchoice')) {
		
		self.config.set('dspchoice', data['dsp_choice'].value);
		
		if (self.config.get('dspchoice') == 'dsp_eq_10_band') {
			
			//========== THE GRAPHIC EQUALIZER 10 BAND HAS JUST BEEN ENABLED ==========
			
			//self.config.set('dspeq10band', data['dsp_eq_10_band']);
			execSync('/usr/local/bin/mdsp-eq-setmagnitude.sh ' + self.config.get('dspeq10band'));
			
			self.removeTrackData();
			self.configureCoreService();
			exec('/usr/local/bin/mdsp-bf-wrapper1.sh');
			self.configHwCard();
			// Set volume to the initial value
			self.commandRouter.volumiosetvolume(self.config.get('initvolume'));
			
			console.log(IDSTR + self.getI18nString('SWITCHED_TO_EQ'));
			self.commandRouter.pushToastMessage('success', self.getI18nString('SWITCHED_TO_EQ'));
								
		} else if (self.config.get('dspchoice') == 'dsp_drc') {
			
			//========== THE DIGITAL ROOM CORRECTION HAS JUST BEEN ENABLED ==========
			
			self.removeTrackData();
			self.configureCoreService();
			exec('/usr/local/bin/mdsp-bf-wrapper1.sh');
			self.configHwCard();
			// Set volume to the initial value
			self.commandRouter.volumiosetvolume(self.config.get('initvolume'));
			
			console.log(IDSTR + self.getI18nString('SWITCHED_TO_DRC'));
			self.commandRouter.pushToastMessage('success', self.getI18nString('SWITCHED_TO_DRC'));
							
			}
		
		// Refresh the configuration panel immediately			
		var respconfig = self.commandRouter.getUIConfigOnPlugin('audio_interface', 'minossedsp', {});
		respconfig.then(function (config) {
			self.commandRouter.broadcastMessage('pushUiConfig', config);
		});
		
	}
	
};

minossedsp.prototype.saveDRCoptions = function (data) {
	var self = this;
	const IDSTR = "MinosseDSP::saveDRCoptions: ";
	const sleepTimeout = 1000;		// Time in milliseconds
	var defer = libQ.defer();
	var prevcoeff = self.config.get('coeffid');
	
	// Check if outchannels is changed
	if (data['output_channels'].value != self.config.get('outchannels')) {
		
		// Mute the sound card to avoid unpleasant noises
		execSync('/usr/local/bin/mdsp-amixmute.sh');
		
		// Check if the new outchannels is supported by the audio card
		const commstr = '/bin/echo \'{"event":"reconfigure-channels","data":"' + data['output_channels'].value + '"}\' > ' + core_fifo;
		//console.log(IDSTR + commstr);
		exec(commstr);
		// Allow some seconds to do the job
		sleep(sleepTimeout).then(() => {
			
			var chkch = fs.readFileSync(MDSP_BF_CONF, {encoding: 'utf8'});
			var chkchannels = JSON.parse(chkch);
			//console.log(IDSTR + chkchannels.audio_type);
			if (chkchannels.audio_type == data['output_channels'].value) {
				
				//========== THE REQUIRED NUMBER OF CHANNELS IS SUPPORTED BY THE DEVICE ==========
				
				self.config.set('outchannels', data['output_channels'].value);
				
				console.log(IDSTR + self.getI18nString('FILTERS_OPTIONS_SAVED'));
				self.commandRouter.pushToastMessage('success', self.getI18nString('FILTERS_OPTIONS_SAVED'));
				
				self.configureCoreService();
				self.eraseCoeffID();
				exec('/usr/local/bin/mdsp-bf-wrapper1.sh');
				self.configHwCard();
				var cid = execSync('/usr/local/bin/mdsp-getcoeff.sh', {encoding: 'utf8'});
				self.config.set('coeffid', cid);
				
				// Refresh the configuration panel immediately			
				var respconfig = self.commandRouter.getUIConfigOnPlugin('audio_interface', 'minossedsp', {});
				respconfig.then(function (config) {
					self.commandRouter.broadcastMessage('pushUiConfig', config);
					console.log(IDSTR + self.config.get('outchannels') + ' ' + self.config.get('coeffid'));
				});
				
				// Set volume to the initial value
				self.commandRouter.volumiosetvolume(self.config.get('initvolume'));
				// Remove fftw wisdom files
				exec('/bin/rm -v -f /data/INTERNAL/minossedsp/fftw-wisdom/mdsp-*');
				// Unmute the sound card
				execSync('/usr/local/bin/mdsp-amixunmute.sh');
				
			} else {
				
				//========== THE REQUIRED NUMBER OF CHANNELS IS NOT SUPPORTED BY THE DEVICE ==========
				
				// Warn the user that the selected number of channels are not supported by the audio card
				var channelsNotSupported = {
					title: self.getI18nString('ERROR'),
					message: self.getI18nString('CHANNELS_NOT_SUPPORTED'),
					size: 'lg',
					buttons: [
						{
							name: "OK",
							class: 'btn btn-warning',
							emit: 'closeModals',
							payload: ''
						}
					]
				};
				console.log(IDSTR + self.getI18nString('CHANNELS_NOT_SUPPORTED'));
			    self.commandRouter.broadcastMessage('openModal', channelsNotSupported);
				
				// Refresh the configuration panel immediately			
				var respconfig = self.commandRouter.getUIConfigOnPlugin('audio_interface', 'minossedsp', {});
				respconfig.then(function (config) {
					self.commandRouter.broadcastMessage('pushUiConfig', config);
				});
				
				// Unmute the sound card
				execSync('/usr/local/bin/mdsp-amixunmute.sh');
				
			}
			
			defer.resolve({});
			
		});
		
	} else {
	
		self.config.set('coeffid', data['coefficients_id'].value);
		
		// Refresh the configuration panel immediately
		var respconfig = self.commandRouter.getUIConfigOnPlugin('audio_interface', 'minossedsp', {});
		respconfig.then(function (config) {
			self.commandRouter.broadcastMessage('pushUiConfig', config);
			//console.log(IDSTR + self.getI18nString('COEFFICIENTS_OPTIONS_SAVED'));
			//self.commandRouter.pushToastMessage('success', self.getI18nString('COEFFICIENTS_OPTIONS_SAVED'));
			console.log(IDSTR + self.config.get('outchannels') + ' ' + self.config.get('coeffid'));
			
			// Coefficients ID is changed, so reconfigure coefficients
			if (self.config.get('coeffid') != 'undefined' && prevcoeff != self.config.get('coeffid')) {
				exec('/usr/local/bin/mdsp-setcoeff.sh ' + self.config.get('coeffid'));
			}
			
			defer.resolve({});
		});
	
	}
	
	return defer.promise;
};

minossedsp.prototype.makeDonation = function() {
    var self = this;
	const IDSTR = "MinosseDSP::makeDonation: ";
	
	const DONMSG = '<br><center>																									\
			<a href="https://www.paypal.com/donate/?hosted_button_id=3X4ESPGKFDATU">			\
				<img src="albumart?path=%2Fmnt%2FINTERNAL%2Fminossedsp%2Fimg%2FQR_Code.png"		\
				alt="Click or scan to donate" width="250" height="250">							\
			</a>																				\
		</center><br>';
	
	var donationModal = {
		title: self.getI18nString('CLICK_OR_SCAN'),
		message: DONMSG,
		size: 'lg',
		buttons: [
			{
				name: self.getI18nString('CANCEL'),
				class: 'btn btn-warning',
				emit: 'closeModals',
				payload: ''
			}
		]
	};
	self.commandRouter.broadcastMessage('openModal', donationModal);
	
};

// The code of this function was taken from alsa_controller core plugin
minossedsp.prototype.getAudioCardNumber = function() {
    var self = this;
	
	// Get the selected audio card ID number
	var value = self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', 'outputdevice');
	if (value == undefined) {
		value = 0;
	} else if (value == 'softvolume') {
		value = self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', 'softvolumenumber');
	}
	return value;
};

minossedsp.prototype.getConfigurationFiles = function() {
	return ['config.json'];
};

minossedsp.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

minossedsp.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

minossedsp.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};
