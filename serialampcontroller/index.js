'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const EventEmitter = require('events').EventEmitter;
const io = require('socket.io-client');

module.exports = serialampcontroller;
function serialampcontroller(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

}



serialampcontroller.prototype.onVolumioStart = function()
{
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);
    this.messageReceived = new EventEmitter();

    return libQ.resolve();
}

serialampcontroller.prototype.onStart = function() {
    var self = this;
	var defer=libQ.defer();
    //set some important parameters
	self.debugLogging = (self.config.get('logging')==true);
    self.selectedAmp ={} ;
	self.loadI18nStrings(); 
    self.volume = {}; //global Volume-object for exchanging data with volumio
    self.ampStatus = {}; //global Object for storing the status of the amp
    self.ampStatus.volume = self.config.get('startupVolume');        
    self.ampStatus.mute = false;
    self.serialDevices = {};
    //activate websocket
    self.socket = io.connect('http://localhost:3000');
	self.socket.emit('getState');
	self.socket.on('pushState',function(data){
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] on.pushState: ' + JSON.stringify(self.status) + ' - ' + data.status);
        if ((self.status == undefined || self.status.status == 'stop' || self.status.status == 'pause' ) && data.status=='play') {
            //status changed to play
            if (self.config.get('switchInputAtPlay')) {
                self.sendCommand('source',self.config.get('volumioInput'));
            }            
        }
		self.status = data;
	})
    //load amp definitions from file
    self.loadAmpDefinitions()
    //initialize list of serial devices available to the system
    .then(_=> self.listSerialDevices())

// DANN: set active amp, ggf open Port, und port.on(open) und port.on(close) aktivieren und methoden für open/close/reopen definieren
	// Once the Plugin has successfull started resolve the promise
    .then(function(){
            if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] onStart: successfully started plugin');
            defer.resolve();
    })
    .fail(err => {
        self.logger.error('[SERIALAMPCONTROLLER] onStart: FAILED to start plugin: ' + err);
        defer.reject(err);
    })
    return defer.promise;
};

// Load Amp Definition file and initialize the list of Vendor/Amp for settings
serialampcontroller.prototype.loadAmpDefinitions = function() {
    var self = this;

    var ampDefinitionFile = this.commandRouter.pluginManager.getConfigurationFile(this.context,'ampCommands.json');
    self.ampDefinitions = new(require('v-conf'))();
    self.ampDefinitions.loadFile(ampDefinitionFile);
    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] loadAmpDefinitions: loaded AmpDefinitions: ' + JSON.stringify(self.ampDefinitions.data));
    //Generate list of Amp Names as combination of Vendor + Model
    self.ampVendorModelList = [];
    for (var n = 0; n < self.ampDefinitions.data.amps.length; n++)
    {
        self.ampVendorModelList.push(self.ampDefinitions.data.amps[n].vendor + ' - ' + self.ampDefinitions.data.amps[n].model);
    };
    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] loadAmpDefinitions: loaded AmpDefinitions for ' + self.ampVendorModelList.length + ' Amplifiers.');
    return libQ.resolve();
};

serialampcontroller.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    self.socket.off('pushState');
    defer.resolve();

    return defer.promise;
};

serialampcontroller.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};


// Configuration Methods -----------------------------------------------------------------------------

serialampcontroller.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;
    var selected = 0;
    var lbl = "";

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.logger.info('[SERIALAMPCONTROLLER] getUIConfig  -  1 -');
    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {
            //serial_interface section
    self.logger.info('[SERIALAMPCONTROLLER] getUIConfig  -  2 -');
            var serialFromConfig = self.config.get('serialInterfaceDev')
            selected = 0;
            for (var n = 0; n < self.serialDevices.length; n++)
            {
                self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[0].options', {
                    value: n+1,
                    label: self.serialDevices[n].pnpId
                });
                if (self.serialDevices[n].pnpId == serialFromConfig) {
                    selected = n+1;
                }
            };
            if (selected > 0) {
                uiconf.sections[0].content[0].value.value = selected;
                uiconf.sections[0].content[0].value.label = serialFromConfig;                
            }
    self.logger.info('[SERIALAMPCONTROLLER] getUIConfig  -  3 -');

            // amp_settings section
            var ampFromConfig = self.config.get('ampType');
            selected = 0;
            for (var n = 0; n < self.ampVendorModelList.length; n++)
            {
                self.configManager.pushUIConfigParam(uiconf, 'sections[1].content[0].options', {
                    value: n+1,
                    label: self.ampVendorModelList[n]
                });
                if (self.ampVendorModelList[n] == ampFromConfig) {
                    selected = n+1;
                }
            };
            if (selected > 0) {
                uiconf.sections[1].content[0].value.value = selected;
                uiconf.sections[1].content[0].value.label = ampFromConfig;                
            }
    self.logger.info('[SERIALAMPCONTROLLER] getUIConfig  -  4 -');
            //populate input selector drop-down
            if (ampFromConfig != "...") {
                selected = 0;
                // for (var n = 0; n < self.selectedAmp.sources.length; n++)
                // {
                //     self.configManager.pushUIConfigParam(uiconf, 'sections[1].content[1].options', {
                //         value: n+1,
                //         label: self.selectedAmp.sources[n]
                //     });
                //     if (self.config.get('volumioInput')==self.selectedAmp.sources[n]) {
                //         selected = n+1;
                //     }
                // };       
                if (selected > 0) {
                    uiconf.sections[1].content[1].value.value = selected;
                    uiconf.sections[1].content[1].value.label = self.config.get('volumioInput');                
                }
            } else {
                //deactivate
            }
    self.logger.info('[SERIALAMPCONTROLLER] getUIConfig  -  5 -');
            //min, max and start volume
			uiconf.sections[1].content[2].value = (self.config.get('minVolume'));
			uiconf.sections[1].content[3].value = (self.config.get('maxVolume'));
			uiconf.sections[1].content[4].value = (self.config.get('startupVolume'));
			uiconf.sections[1].content[5].value = (self.config.get('volumeSteps'));
			uiconf.sections[1].content[6].value = (self.config.get('mapTo100')==true);
			uiconf.sections[1].content[7].value = (self.config.get('pauseWhenMuted')==true);
			uiconf.sections[1].content[8].value = (self.config.get('pauseWhenInputChanged')==true);
			uiconf.sections[1].content[9].value = (self.config.get('switchInputAtPlay')==true);
			uiconf.sections[1].content[10].value = (self.config.get('startAtPowerup')==true);

             // uiconf.sections[1].content[2].
			uiconf.sections[2].content[0].value = (self.config.get('logging')==true)
            // debug_settings section
            defer.resolve(uiconf);
        })
        .fail(function()
        {
            self.logger.error('[SERIALAMPCONTROLLER] getUIConfig: failed');
            defer.reject(new Error());
        });

    return defer.promise;
};

serialampcontroller.prototype.getConfigurationFiles = function() {
	return ['config.json'];
}

serialampcontroller.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

serialampcontroller.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

serialampcontroller.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};

//Gets called when user changes and saves debug settings
serialampcontroller.prototype.updateDebugSettings = function (data) {
    var self = this;
    var defer = libQ.defer();
    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] updateDebugSettings: Saving Debug Settings:' + JSON.stringify(data));
    self.config.set('logging', (data['logging']))
    self.debugLogging = data['logging'];
    defer.resolve();
    self.commandRouter.pushToastMessage('success', self.getI18nString('TOAST_SAVE_SUCCESS'), self.getI18nString('TOAST_DEBUG_SAVE'));
    return defer.promise;
};


//read devices connected to RPi and store in self.serialDevices
serialampcontroller.prototype.listSerialDevices = function() {
    var self = this;
    var defer = libQ.defer();

    SerialPort.list().then(
        ports => {
            if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] listSerialDevices: ' + JSON.stringify(ports));
            self.serialDevices = ports;
            self.serialDevices = self.serialDevices.filter(function(dev){
                return (dev.pnpId !== "undefined" && dev.path !== "/dev/ttyAMA0"); 
            })
            if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] listSerialDevices: found ' + self.serialDevices.length + ' devices.' + JSON.stringify(self.serialDevices));
            defer.resolve();
        },
        err => {
            self.logger.error('[SERIALAMPCONTROLLER] listSerialDevices: Cannot get list of serial devices - ' + err)
            defer.reject();
        }
    )

    return defer.promise;
};

//Gets called when user changes and saves SerialDevice Settings
serialampcontroller.prototype.updateSerialSettings = function (data) {
    var self = this;
    var defer = libQ.defer();
    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] updateSerialSettings: Saving Serial Settings:' + JSON.stringify(data));
    self.config.set('serialInterfaceDev', (data['serial_interface_dev'].label));
    // self.closeSerialInterface()
    // .then(_=>{self.openSerialPort()})
    // .then(_ => {self.attachListener()})
    // .then(_=> {self.updateVolumeSettings()})
    // .then(_=> {
        defer.resolve();
        self.commandRouter.pushToastMessage('success', self.getI18nString('TOAST_SAVE_SUCCESS'), self.getI18nString('TOAST_SERIAL_SAVE'));
    // })
    // .fail(err => {
    //     self.logger.error('[SERIALAMPCONTROLLER] updateSerialSettings: FAILED ' + err);
    //     defer.reject(err);
    // })
    return defer.promise;
};

//Gets called when user changes and saves AmpSettings
serialampcontroller.prototype.updateAmpSettings = function (data) {
    var self = this;
    var defer = libQ.defer();
    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] updateAmpSettings: Saving Amplifier Settings:' + JSON.stringify(data));
    self.config.set('ampType', data['amp_type'].label);
    self.config.set('volumioInput', data['volumio_input'].label);
    self.config.set('minVolume', parseInt(data['min_volume']));
    self.config.set('maxVolume', parseInt(data['max_volume']));
    self.config.set('startupVolume',  parseInt(data['startup_volume']));
    self.config.set('volumeSteps', parseInt(data['volume_steps']));
    self.config.set('mapTo100', (data['map_to_100']));
    self.config.set('pauseWhenMuted', (data['pause_when_muted']));
    self.config.set('pauseWhenInputChanged', (data['pause_when_input_changed']));
    self.config.set('switchInputAtPlay', (data['switch_input_at_play']));
    self.config.set('startAtPowerup', (data['start_at_powerup']));
    // self.setActiveAmp()
    // .then(_=> self.commandRouter.getUIConfigOnPlugin('system_controller', 'serialampcontroller', {}))
    // .then(config => {self.commandRouter.broadcastMessage('pushUiConfig', config)})
    // .then(_=> self.closeSerialInterface())
    // .then(_=> self.openSerialPort())
    // .then(_ => self.attachListener())
    // .then(_=> self.updateVolumeSettings())
    // .then(_=> self.volumioupdatevolume(self.getVolumeObject()))
    // .then(_=> {
        defer.resolve();        
        self.commandRouter.pushToastMessage('success', self.getI18nString('TOAST_SAVE_SUCCESS'), self.getI18nString('TOAST_AMP_SAVE'));
    // })  
    return defer.promise;
};

// Retrieve a string
serialampcontroller.prototype.getI18nString = function (key) {
    var self = this;

    if (self.i18nStrings[key] !== undefined) {
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] getI18nString("'+key+'"):'+ self.i18nStrings[key]);
        return self.i18nStrings[key];
    } else {
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] getI18nString("'+key+'")'+ self.i18nStringsDefaults[key]);
        return self.i18nStringsDefaults['SERIALAMPCONTROL'][key];
    };
}
// A method to get some language strings used by the plugin
serialampcontroller.prototype.loadI18nStrings = function() {
    var self = this;

    try {
        var language_code = this.commandRouter.sharedVars.get('language_code');
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] loadI18nStrings: '+__dirname + '/i18n/strings_' + language_code + ".json");
        self.i18nStrings = fs.readJsonSync(__dirname + '/i18n/strings_' + language_code + ".json");
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] loadI18nStrings: loaded: '+JSON.stringify(self.i18nStrings));
    }
    catch (e) {
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] loadI18nStrings: ' + language_code + ' not found. Fallback to en');
        self.i18nStrings = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
    }

    self.i18nStringsDefaults = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
};



