'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const net = require('node:net');

const EventEmitter = require('events').EventEmitter;
const io = require('socket.io-client');
const socket = require('socket.io-client/lib/socket');
const reIP = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

module.exports = serialampcontroller;
function serialampcontroller(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

}



serialampcontroller.prototype.onVolumioStart = function() {
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
    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] onStart: config: ' + JSON.stringify(self.config));    
	self.loadI18nStrings(); 
    self.volume = {}; //global Volume-object for exchanging data with volumio
    self.ampStatus = {}; //global Object for storing the status of the amp
    self.ampStatus.volume = self.config.get('startupVolume');        
    self.ampStatus.mute = false;
    self.serialDevices = {};
    self.portOpen = false;
    self.status = 'stop'
    self.ampStatus.power='off';

    self.loadAmpDefinitions() //load amp definitions from file
    .then(_=> self.listSerialDevices()) //initialize list of serial devices available to the system
    .then(_ => self.setActiveAmp()) // set the active amp
    .then(_=> self.activate())
    .then(function(){
            if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] onStart: successfully started plugin');
            defer.resolve();
    })
    .fail(err => {
        self.logger.error('[SERIALAMPCONTROLLER] onStart: ' + err);
        defer.resolve();
    })
    return defer.promise;
};

serialampcontroller.prototype.activate = function () {
    var self = this;
    var defer = libQ.defer();
    //Check if selected interface is physically available and if selected amp supports selected interface
    if (self.selectedInterfaceExists() && self.selectedAmpSupportsInterface()) {
        //Activate Websock listener to react on messages from volumio
        self.activateSocketIO();
        //Open selected interface
        if (self.selectedAmp!==undefined && Object.keys(self.selectedAmp).length>0) {
            if (self.config.get('tcpip') == true) {
                return self.openTcpIp()
            } else {
                return self.openSerialPort()
            }
        } else defer.reject(new Error('Amp not defined yet.'))
        //Activate Parser
        //Activate events
    } else {
        defer.reject(new Error('The selected Interface does not exist or the selected amp does not support it. Check Settings.'))
    }
    return defer.promise;
}

serialampcontroller.prototype.deactivate = function () {
    var self = this;
    var defer = libQ.defer();
    self.closePort();
    if (self.socket !== undefined) self.socket.disconnect();
    self.resetVolumeSettings()
    //Check if selected interface is physically available
    //check if selected amp supports selected interface
    //Activate Websock listener to react on messages from volumio
    //Open selected interface
    //Activate Parser
    //Activate events
}

// Load Amp Definition file and initialize the list of Vendor/Amp for settings
serialampcontroller.prototype.loadAmpDefinitions = function() {
    var self = this;

    var ampDefinitionFile = this.commandRouter.pluginManager.getConfigurationFile(this.context,'ampCommands.json');
    self.ampDefinitions = new(require('v-conf'))();
    self.ampDefinitions.loadFile(ampDefinitionFile);
    // if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] loadAmpDefinitions: loaded AmpDefinitions: ' + JSON.stringify(self.ampDefinitions));
    //Generate list of Amp Names as combination of Vendor + Model
    self.ampVendorModelList = {'RS232':[],'TCPIP':[]};
    for (var n = 0; n < self.ampDefinitions.data.amps.length; n++)
    {
        if (self.ampDefinitions.data.amps[n].interfaces !== undefined) {
            if (self.ampDefinitions.data.amps[n].interfaces.includes('TCP/IP')) {
                self.ampVendorModelList.TCPIP.push(self.ampDefinitions.data.amps[n].vendor + ' - ' + self.ampDefinitions.data.amps[n].model);
            }
            if (self.ampDefinitions.data.amps[n].interfaces.includes('RS232')) {
                self.ampVendorModelList.RS232.push(self.ampDefinitions.data.amps[n].vendor + ' - ' + self.ampDefinitions.data.amps[n].model);
            }
        } else {
            self.ampVendorModelList.RS232.push(self.ampDefinitions.data.amps[n].vendor + ' - ' + self.ampDefinitions.data.amps[n].model);
        }
    };
    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] loadAmpDefinitions: loaded AmpDefinitions for ' + self.ampVendorModelList.RS232.length + '(serial) and '+ self.ampVendorModelList.TCPIP.length  + ' (TCP/IP) Amplifiers.');
    return libQ.resolve();
};

//read devices connected to RPi and store in self.serialDevices
serialampcontroller.prototype.listSerialDevices = function() {
    var self = this;
    var defer = libQ.defer();

    SerialPort.list()
    .then(
        ports => {
            self.serialDevices = ports;
            self.serialDevices = self.serialDevices.filter(function(dev){
                return ((dev.pnpId !== undefined || dev.manufacturer !== undefined) && dev.path !== undefined && dev.path !== "/dev/ttyAMA0"); 
            })
            if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] listSerialDevices: found ' + self.serialDevices.length + ' devices.' + JSON.stringify(self.serialDevices));
            defer.resolve();
        },
        err => {
            self.logger.error('[SERIALAMPCONTROLLER] listSerialDevices: Cannot get list of serial devices - ' + err)
            defer.reject(new Error('Failed to load list serial devices via Serialport.io.'));
        }
    )

    return defer.promise;
};

//Gets called when user changes and saves SerialDevice Settings
serialampcontroller.prototype.updateSerialSettings = function (data) {
    var self = this;
    var defer = libQ.defer();
    
    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] updateSerialSettings: Saving Interface Settings:' + JSON.stringify(data));
    if (data['tcp_ip'] && !reIP.test(data['ip_address'])) {
        self.commandRouter.pushToastMessage('error', self.getI18nString('TOAST_ERROR'), self.getI18nString('TOAST_INVALID_IP'));
        if (self.debugLogging) self.logger.error('[SERIALAMPCONTROLLER] updateSerialSettings: invalid IP address provided, not saving:' + data['ip_address']);
        defer.resolve();
    } else {
        //check if interface settings did change
        if ((self.config.get('tcpip') !== data['tcp_ip']) || (self.config.get('tcpip') && self.config.get('ipaddress') !== data['ip_address']) || (!self.config.get('tcpip')) && (self.config.get('serialInterfaceDev') !== data['serial_interface_dev'].label)) {
            self.deactivate();
            self.resetVolumeSettings()
            .then(_ => {
                self.config.set('tcpip', (data['tcp_ip']));
                self.config.set('ipaddress', (data['ip_address']));
                self.config.set('serialInterfaceDev', (data['serial_interface_dev'].label));
                self.config.set('ampType','...');
                return self.commandRouter.getUIConfigOnPlugin('system_hardware', 'serialampcontroller', {})})
            .then(config => {
                self.commandRouter.broadcastMessage('pushUiConfig', config)})
            .then(_=> {
                defer.resolve();
                self.commandRouter.pushToastMessage('success', self.getI18nString('TOAST_SAVE_SUCCESS'), self.getI18nString('TOAST_SERIAL_SAVE'));
            })
            .fail(err => {
                self.logger.error('[SERIALAMPCONTROLLER] updateSerialSettings: FAILED ' + err);
                defer.reject(err);
            })
        } else {
            if (self.debugLogging) self.logger.error('[SERIALAMPCONTROLLER] updateSerialSettings: nothing changed - do nothing');
            defer.resolve();
        }
    }
    return defer.promise;
};

//Gets called when user selects and saves Amp Type
serialampcontroller.prototype.updateAmpType = function (data) {
    var self = this;
    var defer = libQ.defer();
    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] updateAmpType: Saving Amplifier Settings:' + JSON.stringify(data));
    self.deactivate();
    self.config.set('ampType', data['amp_type'].label);
    self.config.set('volumioInput', "...");
    self.setActiveAmp();
    return self.commandRouter.getUIConfigOnPlugin('system_hardware', 'serialampcontroller', {})
    .then(config => {self.commandRouter.broadcastMessage('pushUiConfig', config)})
    //configure the serial interface and open it
    .then(_ => {
        self.activate();
    })
    .then(_=> {
        defer.resolve();        
        self.commandRouter.pushToastMessage('success', self.getI18nString('TOAST_SAVE_SUCCESS'), self.getI18nString('TOAST_AMP_TYPE_SAVE'));
    })  
    // return defer.promise;
};

//Gets called when user changes and saves AmpSettings
serialampcontroller.prototype.updateAmpSettings = function (data) {
    var self = this;
    var defer = libQ.defer();
    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] updateAmpSettings: Saving Amplifier Settings:' + JSON.stringify(data));
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
    self.commandRouter.getUIConfigOnPlugin('system_hardware', 'serialampcontroller', {})
    .then(config => {self.commandRouter.broadcastMessage('pushUiConfig', config)})
    // //configure the serial interface and open it
    // .then(_ => self.closePort())
    // .then(_ => {
    //     if (self.portType == 'TCPIP') {
    //         return self.openTcpIp()
    //     } else {
    //         return self.openSerialPort()
    //     }
    // })
    //update Volume Settings and announce the updated settings to Volumio
    .then(_ => self.alsavolume(this.config.get('startupVolume')))
    .then(_ => self.initVolumeSettings())
    .then(_=> {
        defer.resolve();        
        self.commandRouter.pushToastMessage('success', self.getI18nString('TOAST_SAVE_SUCCESS'), self.getI18nString('TOAST_AMP_SAVE'));
    })  
    return defer.promise;
};

//Gets called when user changes and saves debug settings
serialampcontroller.prototype.updateDebugSettings = function (data) {
    var self = this;
    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] updateDebugSettings: Saving Debug Settings:' + JSON.stringify(data));
    self.config.set('logging', (data['logging']))
    self.debugLogging = data['logging'];
    ;
    self.commandRouter.pushToastMessage('success', self.getI18nString('TOAST_SAVE_SUCCESS'), self.getI18nString('TOAST_DEBUG_SAVE'));
    return libQ.resolve();
};

serialampcontroller.prototype.activateSocketIO = function () {
    var self = this;
    self.socket = io.connect('http://localhost:3000');
	self.socket.emit('getState');
	self.socket.on('pushState',function(data){
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] on:pushState: ' + JSON.stringify(self.volumioStatus) + ' - ' + data.status);
        if ((self.volumioStatus == undefined || self.volumioStatus.status == 'stop' || self.volumioStatus.status == 'pause' ) && data.status=='play') {
            //status changed to play
            if (self.ampStatus.power == 'standby') {
                self.sendCommand('powerOn')
                .then(_ => self.sendCommand('source',self.config.get('volumioInput')))
            } else if (self.config.get('switchInputAtPlay')) {
                self.sendCommand('source',self.config.get('volumioInput'));
            }
        }
        if (self.volumioStatus!==undefined) {self.volumioStatus = data;}
	})
}

serialampcontroller.prototype.getAmpStatus = function() {
    var self = this;

    //send some requests to determine the current settings of the amp
    if (self.parser!=undefined) {
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] getAmpStatus: sending status requests to Amp');
        self.sendStatusRequest('reqModel');
        self.sendStatusRequest('reqPower');
        self.sendStatusRequest('reqVolume');
        self.sendStatusRequest('reqMute');
        self.sendStatusRequest('reqSource');
    } else {
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] getAmpStatus: listener not yet available');
    }
    return libQ.resolve();
}

serialampcontroller.prototype.setActiveAmp = function() {
    var self = this;
    var tcpIp = false;
    var ampType = '';
    if ((self.config.get('tcpip')!==undefined)) {
        tcpIp = self.config.get('tcpip')
    }
    self.selectedAmp = {}
    ampType = self.config.get('ampType')
    if ((ampType!==undefined) && (ampType!=='...'))  {
        self.selectedAmp = self.ampDefinitions.data.amps.find((amp) => {
            if (tcpIp) {
                return (((amp.vendor + ' - ' + amp.model) == ampType) && (amp.interfaces!==undefined) && (amp.interfaces.includes('TCP/IP')))
            } else {
                return (((amp.vendor + ' - ' + amp.model) == ampType) && ((amp.interfaces==undefined) || (amp.interfaces.includes('RS232'))))
            }
        });
        if (self.selectedAmp !== undefined) {
            //save all possible responses that can be received in an array, currently not yet used
            self.responses = [];
            self.selectedAmp.responses.forEach(obj => {
                self.responses.push(obj.cmd)
            })
            if (self.debugLogging) {
                self.logger.info('[SERIALAMPCONTROLLER] setActiveAmp: ' + JSON.stringify(self.selectedAmp));
                self.logger.info('[SERIALAMPCONTROLLER] setActiveAmp: can send these responses: ' + self.responses);
            }
        } else {
            if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] setActiveAmp: Found no configuration for "' + ampType +'" and interface '+ (tcpIp?"TCP/IP":"RS232"));
            self.selectedAmp = {}
        }
    } else {
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] setActiveAmp: not yet configured');
        self.selectedAmp = {};
    }
}

serialampcontroller.prototype.getConfigurationFiles = function() {
	return ['config.json','ampCommands.json'];
}

serialampcontroller.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    self.deactivate()
    // // self.socket.off('pushState');
    // self.closePort()
    // .then(_ => {
    //     // self.resetVolumeSettings();
    //     defer.resolve();
    // })
    // .fail(err => {
    //     if (self.debugLogging) self.logger.error('[SERIALAMPCONTROLLER] onStop: failed to stop plugin: ' + err); 
    //     defer.resolve()       
    // })
    // return defer.promise;
    return defer.resolve();
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

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    var tcpIp = self.config.get('tcpip');
    if (tcpIp == undefined) tcpIp = false;
    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {
            //serial_interface section
            var serialFromConfig = self.config.get('serialInterfaceDev')
            selected = 0;
            let devLabel = '';
            uiconf.sections[0].content[0].value = tcpIp;
            var ip = self.config.get('ipaddress');
            if (ip == undefined) ip = '127.0.0.1'
            uiconf.sections[0].content[2].value = ip;
            for (var n = 0; n < self.serialDevices.length; n++)
            {
                if (self.serialDevices[n].pnpId != undefined) {
                    devLabel = self.serialDevices[n].pnpId
                } else if (self.serialDevices[n].manufacturer != undefined){
                    devLabel = self.serialDevices[n].manufacturer
                } else {
                    self.logger.error('[SERIALAMPCONTROLLER] getUIConfig: serialDevice has no pnpId and no Manufacturer name.');
                }
                self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[1].options', {
                    value: n+1,
                    label: devLabel
                });
                if (devLabel == serialFromConfig) {
                    selected = n+1;
                }
            };
            if (selected > 0) {
                uiconf.sections[0].content[1].value.value = selected;
                uiconf.sections[0].content[1].value.label = serialFromConfig;                
            } 

            // amp_type section
            var ampFromConfig = self.config.get('ampType');
            selected = 0;
            // filter amps by interface
            var usableModels = [];
            if (tcpIp) {
                usableModels = self.ampVendorModelList.TCPIP
            } else {
                usableModels = self.ampVendorModelList.RS232
            }
            if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] getUIConfig: interface: ' + (tcpIp?'TCP/IP':'RS232') + '; amps: ' + JSON.stringify(usableModels) + 'selected: ' + ampFromConfig);
            for (var n = 0; n < usableModels.length; n++)
            {
                self.configManager.pushUIConfigParam(uiconf, 'sections[1].content[0].options', {
                    value: n+1,
                    label: usableModels[n]
                });
                if (usableModels[n] === ampFromConfig) {
                    selected = n+1;
                }
            };
            if (selected >= 0) {
                uiconf.sections[1].content[0].value.value = selected;
                uiconf.sections[1].content[0].value.label = ampFromConfig;                
            }
            // amp_settings section
            //populate input selector drop-down
            if (ampFromConfig !== "..." && self.selectedAmp !== undefined && self.selectedAmp.sources !== undefined) {
                selected = 0;
                for (var n = 0; n < self.selectedAmp.sources.length; n++)
                {
                    self.configManager.pushUIConfigParam(uiconf, 'sections[2].content[0].options', {
                        value: n+1,
                        label: self.selectedAmp.sources[n]
                    });
                    if (self.config.get('volumioInput')==self.selectedAmp.sources[n]) {
                        selected = n+1;
                    }
                };       
                if (selected > 0) {
                    uiconf.sections[2].content[0].value.value = selected;
                    uiconf.sections[2].content[0].value.label = self.config.get('volumioInput');                
                }
            } 
            //min, max and start volume
			uiconf.sections[2].content[1].value = (self.config.get('minVolume'));
			uiconf.sections[2].content[2].value = (self.config.get('maxVolume'));
			uiconf.sections[2].content[3].value = (self.config.get('startupVolume'));
			uiconf.sections[2].content[4].value = (self.config.get('volumeSteps'));
			uiconf.sections[2].content[5].value = (self.config.get('mapTo100')==true);
			uiconf.sections[2].content[6].value = (self.config.get('pauseWhenMuted')==true);
			uiconf.sections[2].content[7].value = (self.config.get('pauseWhenInputChanged')==true);
			uiconf.sections[2].content[8].value = (self.config.get('switchInputAtPlay')==true);
			uiconf.sections[2].content[9].value = (self.config.get('startAtPowerup')==true);

             // uiconf.sections[1].content[2].
			uiconf.sections[3].content[0].value = (self.config.get('logging')==true)
            // debug_settings section
            defer.resolve(uiconf);
        })
        .fail(function(err)
        {
            self.logger.error('[SERIALAMPCONTROLLER] getUIConfig: failed: ' + err);
            defer.reject(new Error());
        });

    return defer.promise;
};

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

//function for attaching parser to the port
serialampcontroller.prototype.attachParser = function (){
    var self = this;

    const parserOptions = {};
    parserOptions.delimiter = self.selectedAmp.delimiter;
    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] attachParser: Port is now open. Connecting Parser with delimiter: ' + parserOptions.delimiter);
    // pipe the port to a parser
    self.parser = self.port.pipe(new ReadlineParser(parserOptions));
    //attach a listener to the parser output
    self.parser.on('data', data => {
        if (self.debugLogging) self.logger.info("[SERIALAMPCONTROLLER] [parser:data]: Listener received: " + data);
        if (typeof(data) == 'string' && self.selectedAmp !== undefined && self.selectedAmp.responses !== undefined && self.selectedAmp.responses.length > 0) {
            var cmdFound = false;
            self.selectedAmp.responses.forEach(response => {
                let match = data.match(new RegExp(response.rx,'i'));
                if (match !==null) {
                    cmdFound = true;
                    if (match.length==1){
                        if (self.debugLogging) self.logger.info("[SERIALAMPCONTROLLER] parser:data: call processResponse with: " + response.cmd[0]);
                        self.processResponse(response.cmd[0])
                    } else {
                        for (let i = 1; i < match.length; i++){
                            if (self.debugLogging) self.logger.info("[SERIALAMPCONTROLLER] parser:data: call processResponse with: " + response.cmd[i-1],match[i]);
                            self.processResponse(response.cmd[i-1],match[i])
                        }
                    }
                } 
            })
            if (self.debugLogging && !cmdFound) self.logger.info('[SERIALAMPCONTROLLER] parser:data: no matching regex for: ' + data);
        } else {
            self.logger.error("[SERIALAMPCONTROLLER] parser:data: do not have any information, what to do with message: " + data + "is the 'ampCommands.json' complete?");
        }
    });
}

serialampcontroller.prototype.selectedInterfaceExists = function(){
    var self = this;
    if ((self.config.get('tcpip')!==undefined) &&  (self.config.get('tcpip')==true)){
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] selectedInterfaceExists: TCP/IP selected. Expect network connection to exist.');
        return true; //system should always have a network card, so return true
    } else {
        if ((self.config.get('serialInterfaceDev')!==undefined) && (self.config.get('serialInterfaceDev')!=='...')) {
            //lookup the path to the selected device
            self.serialInterfaceDev = undefined;
            self.serialInterfaceDev = self.serialDevices.filter(dev => {
                return (dev.pnpId === self.config.get('serialInterfaceDev') || dev.manufacturer === self.config.get('serialInterfaceDev'))
            });
            if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] selectedInterfaceExists: ' + self.config.get('serialInterfaceDev') + ' in ' + JSON.stringify(self.serialDevices) + '?: ' + (self.serialInterfaceDev !== undefined));
            return (self.serialInterfaceDev !== undefined);
        }
    }
}

serialampcontroller.prototype.selectedAmpSupportsInterface = function(){
    var self = this;
    var tcpip = ((self.config.get('tcpip')!==undefined) &&  (self.config.get('tcpip')==true))
    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] selectedAmpSupportsInterface: ' + (tcpip?'TCP/IP':'RS232') + ' in ' + (JSON.stringify(self.selectedAmp.interfaces) || '[]'));
    if (tcpip){
        return (self.selectedAmp.interfaces!==undefined &&
                self.selectedAmp.interfaces.includes('TCP/IP') &&
                self.selectedAmp.tcpport!==undefined)
    } else {
        return (self.selectedAmp.interfaces==undefined || self.selectedAmp.interfaces.includes('RS232'))
    }
}

//configure serial interface according to ampDefinition file
serialampcontroller.prototype.openSerialPort = function (){
    var self = this;
    var defer = libQ.defer();
    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] openSerialPort: starting');
    if ((self.config.get('serialInterfaceDev')!==undefined) && 
        (self.config.get('serialInterfaceDev')!=='...') &&
        (Object.keys(self.selectedAmp).length > 0))  {
            //SerialPort and Amp selected, now check if all settings are defined
            if (self.selectedAmp.baudRate!==undefined &&
                    self.selectedAmp.dataBits!==undefined &&
                    self.selectedAmp.stopBits!==undefined &&
                    self.selectedAmp.parity!==undefined &&
                    self.selectedAmp.rtscts!==undefined &&
                    self.selectedAmp.xon!==undefined &&
                    self.selectedAmp.xoff!==undefined &&
                    self.selectedAmp.xany!==undefined && 
                    self.selectedAmp.delimiter!==undefined) {
                //define the configuration of the serial interface
                self.serialOptions = {autoOpen: false, lock: false, endOnClose: true};
                self.serialOptions.baudRate = self.selectedAmp.baudRate;
                self.serialOptions.dataBits = self.selectedAmp.dataBits;
                self.serialOptions.stopBits = self.selectedAmp.stopBits;
                self.serialOptions.parity = self.selectedAmp.parity;
                self.serialOptions.rtscts = self.selectedAmp.rtscts;
                self.serialOptions.xon = self.selectedAmp.xon;
                self.serialOptions.xoff = self.selectedAmp.xoff;
                self.serialOptions.xany = self.selectedAmp.xany;

                //lookup the path to the selected device
                if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] openSerialPort: check for ' + self.config.get('serialInterfaceDev') + ' in ' + JSON.stringify(self.serialDevices));
                self.serialInterfaceDev = self.serialDevices.filter(dev => {
                    return (dev.pnpId === self.config.get('serialInterfaceDev') || dev.manufacturer === self.config.get('serialInterfaceDev'))
                });
                if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] openSerialPort: connect to ' + JSON.stringify(self.serialInterfaceDev) +' configured with: ' + JSON.stringify(self.serialOptions) + ' at ' + self.serialInterfaceDev[0].path);
                self.serialOptions.path = self.serialInterfaceDev[0].path;
                self.port = new SerialPort(self.serialOptions);
                if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] openSerialPort: Now trying to open port');
                self.port.on('close', ()=>{
                    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] serial port [event:close]: Port is now closed.');
                });
                self.port.on('error', err => {
                    self.logger.error('[SERIALAMPCONTROLLER] serial port [event:error]: Port generated an error: ' + err);
                });
                self.port.on('open', ()=>{
                    self.attachParser()
                    //determine the current settings of the amp
                    self.getAmpStatus()
                    // //update Volume Settings and announce the updated settings to Volumio
                    .then(_ => self.alsavolume(this.config.get('startupVolume')))
                    .then(_ => self.initVolumeSettings());
                });
                self.port.open(err=>{
                    if (err) {
                        self.logger.error('[SERIALAMPCONTROLLER] openSerialPort: could not open port: ' + err.message);
                    } else {
                        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] openSerialPort: Connection established.');
                        defer.resolve();
                    }
                })
            } else {
                self.logger.error('[SERIALAMPCONTROLLER] openSerialPort: AmpCommands.js has insufficient interface parameters for ' + self.selectedAmp.vendor + " - " + self.selectedAmp.model);
                defer.resolve();
            }
    } else {
        self.serialInterfaceDev = '';
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] openSerialPort: Configuration incomplete. Interface or Amp not configured yet.');
        defer.resolve('');
    }
    return defer.promise
};

//Callback for closing TCP-IP Socket
serialampcontroller.prototype.onTcpClose = function(){
    var self = this;
    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] onTcpClose: Port has closed, removing listeners.');
    //try to reconnect
    self.reconnectTCP();
}

serialampcontroller.prototype.closePort = function () {
    var self = this;
    var defer = libQ.defer();

    if (self.port !== undefined) {
        if (self.port instanceof net.Socket) { //open TCP/IP port needs to be closed
            if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] closePorts: closing TCP/IP');
            self.port.unpipe();
            self.port.resume();
            self.port.removeAllListeners();
            self.waitingForReconnect = false;
            self.port.end(() => {
                if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] closePorts: closed TCP/IP socket');     
                self.port = undefined;   
                defer.resolve()
            })
        } else if (self.port instanceof SerialPort) { //open Serialport needs to be closed
            if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] closePorts: closing RS232');     
            // self.parser.removeAllListeners();
            self.port.unpipe();
            self.port.resume();
            self.port.removeAllListeners();
            if (self.port.isOpen) {
                self.port.close(error => {
                    if (error) {
                        defer.reject(error)
                    } else {
                        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] closePorts: closed serial port');
                        let {_pool, ...rest} = self.port;
                        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] closePorts: remaining config: ' + JSON.stringify(rest));
                        self.port.destroy();
                        defer.resolve();
                    }
                });
            } else {
                self.port = undefined;   
                defer.resolve();
            }            
        }
    } else {
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] closePorts: port is undefined');
        defer.resolve()
    }
    return defer.promise;
}
serialampcontroller.prototype.reconnectTCP = function (params) {
 var self = this;
    if ((self.port==undefined || self.port.readyState == undefined) || (self.port.readyState == '') || (self.port.readyState == 'closed'))
        if (!self.waitingForReconnect) {
            self.waitingForReconnect = true;
            setTimeout(()=>{
                if (self.waitingForReconnect) {
                    self.waitingForReconnect = false;
                    self.port = net.createConnection({port: self.netOptions.port, host: self.netOptions.ip},() => {
                        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] openTcpIp: Connected to: ' + self.netOptions.ip + ':' + self.netOptions.port);
                    });
                    self.port.setKeepAlive(true, 1000);
                    if (self.port.listenerCount('close') == 0) self.port.on('close', self.onTcpClose.bind(self));
                    if (self.port.listenerCount('error') == 0) self.port.on('error', self.onTcpError.bind(self));
                    if (self.port.listenerCount('ready') == 0) self.port.on('ready', self.connectTcpIp.bind(self));
                }
            }, 5000)
        }    
}

//Callback for error on TCP-IP Socket
serialampcontroller.prototype.onTcpError = function(err){
    var self = this;
    if(err.message.indexOf('ECONNREFUSED') > -1) {
        self.logger.error('[SERIALAMPCONTROLLER] onTcpError: Connection refused, trying to reconnect in 5 seconds.');
        //do recconect
        self.reconnectTCP();
    } else {
        self.logger.error('[SERIALAMPCONTROLLER] onTcpError: Port generated an error: ' + err);
    }
}

serialampcontroller.prototype.connectTcpIp = function() {
    var self = this;
    self.attachParser()
    //determine the current settings of the amp
    self.getAmpStatus()
    // //update Volume Settings and announce the updated settings to Volumio
    .then(_ => self.alsavolume(this.config.get('startupVolume')))
    .then(_ => self.initVolumeSettings());

}

//configure tcp-ip according to ampDefinition file
serialampcontroller.prototype.openTcpIp = function (){
    var self = this;
    var defer = libQ.defer();
    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] openTcpIp: starting');
    if ((self.config.get('tcpip')!==undefined) && 
        (self.config.get('tcpip')==true) &&
        (Object.keys(self.selectedAmp).length > 0))  {
            //SerialPort and Amp selected, now check if all settings are defined
            if (self.selectedAmp.interfaces!==undefined &&
                    self.selectedAmp.interfaces.includes('TCP/IP') &&
                    self.selectedAmp.tcpport!==undefined) {
                //define the configuration of the serial interface
                self.netOptions = {}
                self.netOptions.ip = self.config.get('ipaddress')
                self.netOptions.port = self.selectedAmp.tcpport;

                if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] openTcpIp: connect to ' + self.netOptions.ip +' on port: ' + self.netOptions.port);
                self.port = net.createConnection({port: self.netOptions.port, host: self.netOptions.ip},() => {
                    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] openTcpIp: Connected to: ' + self.netOptions.ip + ':' + self.netOptions.port);
                });
                self.port.setKeepAlive(true, 1000);
                if (self.port.listenerCount('close') == 0) self.port.on('close', self.onTcpClose.bind(self));
                if (self.port.listenerCount('error') == 0) self.port.on('error', self.onTcpError.bind(self));
                if (self.port.listenerCount('ready') == 0) self.port.on('ready', self.connectTcpIp.bind(self));
                defer.resolve();
            } else {
                self.logger.error('[SERIALAMPCONTROLLER] openTcpIp: AmpCommands.js has no TCP/IP parameters for ' + self.selectedAmp.vendor + " - " + self.selectedAmp.model);
                defer.resolve();
            }
    } else {
        self.serialInterfaceDev = '';
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] openTcpIp: Configuration still incomplete. No interface configured yet.');
        defer.resolve('');
    }
    return defer.promise;
};

// //send commands to the amp
serialampcontroller.prototype.sendCommand  = function(...cmd) {
    var self = this;
    var defer = libQ.defer();

    var cmdString = '';
    if (self.debugLogging) self.logger.info("[SERIALAMPCONTROLLER] sendCommand: send " + cmd);
    if (self.selectedAmp != undefined && self.selectedAmp.commands != undefined && self.selectedAmp.sources != undefined && self.selectedAmp.sourceCmd != undefined) {
        switch (cmd[0]) {
            case  "powerOn": 
                if (self.ampStatus.Powering != 'up') cmdString = cmdString + self.selectedAmp.commands.powerOn;
                self.ampStatus.Powering = 'up';
                break;
            case  "powerToggle": 
                if (self.ampStatus.Powering == '') cmdString = cmdString = cmdString + self.selectedAmp.commands.powerToggle;
                if (self.ampStatus.power == 'on' && self.ampStatus.Powering == '' ) {
                    self.ampStatus.Powering = 'down'
                } else if (self.ampStatus.power == 'standby' && self.ampStatus.Powering == '') {
                    self.ampStatus.Powering = 'up'
                }
                break;
            case  "volUp": 
                cmdString = cmdString + self.selectedAmp.commands.volUp;
                break;
            case  "volDown": 
                cmdString = cmdString + self.selectedAmp.commands.volDown;
                break;
            case  "volValue": 
                cmdString = cmdString + self.selectedAmp.commands.volValue;
                var count = (cmdString.match(/#/g) || []).length;
                if (count > 0) {
                    var re = new RegExp("#".repeat(count));
                    cmdString = cmdString.replace(re,parseInt(cmd[1]).toString().padStart(count,"0"));
                } else {
                    self.logger.info('[SERIALAMPCONTROLLER] sendCommand: volValue command string has no ## characters. Do not know how to send volume value.')
                    cmdString = '';
                }
                break;
            case  "mute": 
                cmdString = cmdString + self.selectedAmp.commands.mute;
                break;
            case  "muteOn": 
                cmdString = cmdString + self.selectedAmp.commands.muteOn;
                break;
            case  "muteOff": 
                cmdString = cmdString + self.selectedAmp.commands.muteOff;
                break;
            case  "source": 
                if (cmd[1]!=='...') {
                    self.logger.info('[SERIALAMPCONTROLLER] sendCommand: switch to source: ' + cmd[1]);
                    cmdString =  self.selectedAmp.sourceCmd[self.selectedAmp.sources.indexOf(cmd[1])];
                }
                break;
            default:
                break;
        }
    }
    if (self.port !== undefined && cmdString!==''){
        if (self.debugLogging) self.logger.info("[SERIALAMPCONTROLLER] sendCommand: now sending cmdString: " + cmdString);
        self.port.write(cmdString,'ascii',function(err) {
            if (err) {
                self.logger.error('[SERIALAMPCONTROLLER] sendCommand: Could not send command to serial interface "' + cmdString + '": ' + err)
                defer.reject()
            }
            if (self.debugLogging) self.logger.info("[SERIALAMPCONTROLLER] sendCommand: sent cmdString: " + cmdString);
            defer.resolve();
        });
    }
    return defer.promise;
}


// process Responses received from Amp, trigger actions and update volumio 
serialampcontroller.prototype.processResponse = function(response, ...args) {
    var self = this;
    switch (response) {
        case "respPowerOn":
            if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] processResponse: Amp signaled PowerOn. Previous state is: ' + self.ampStatus.power);
            if (self.ampStatus.Powering == 'up') self.ampStatus.Powering = ''
            setTimeout(() => {
                self.initVolumeSettings()
                .then(_ => {
                    if (self.config.get('startAtPowerup')) {
                        self.sendCommand('source',self.config.get('volumioInput'));
                        self.socket.emit('play');
                    }
                    self.messageReceived.emit('power', 'on');
                    self.ampStatus.power='on';
                })                
            }, 10000);
            break;
        case "respPowerOff":
            if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] processResponse: Amp signaled PowerOff');            
            if (self.ampStatus.Powering == 'down') self.ampStatus.Powering = ''
            self.socket.emit('pause'); //stops volumio if amp is powered down
            self.messageReceived.emit('power', 'standby');
            self.ampStatus.power='standby';
            break;
        case "respMuteOff":
            if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] processResponse: Amp signaled MuteOff');            
            if (self.config.get('pauseWhenMuted')) {
                self.socket.emit('play');
            }
            self.ampStatus.mute = false;
            self.commandRouter.volumioupdatevolume(self.getVolumeObject());
            self.messageReceived.emit('mute', false);
            break;
        case "respMuteOn":
            if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] processResponse: Amp signaled MuteOn');            
            if (self.config.get('pauseWhenMuted')) {
                self.socket.emit('pause');
            }
            self.ampStatus.mute = true;
            self.commandRouter.volumioupdatevolume(self.getVolumeObject());
            self.messageReceived.emit('mute', true);
            break;
        case 'respVolume':
            if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] processResponse: Amp signaled volume is ' + args[0]);
            self.ampStatus.volume = parseInt(args[0]);
            self.commandRouter.volumioupdatevolume(self.getVolumeObject());
            self.messageReceived.emit('volume', args[0]);
            break;
        case 'respSource':
            if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] processResponse: Amp signaled source is ' + args[0]);
            if (self.config.get('pauseWhenInputChanged')) {
                var idx = self.selectedAmp.sources.indexOf(self.config.get('volumioInput'));
                if ((self.selectedAmp.sourceRespPostfix[idx] == args[0])) {
                    if (self.ampStatus.source!=args[0]) self.socket.emit('play');
                } else {
                    self.socket.emit('pause');
                }
            }
            self.ampStatus.source = args[0];         
            self.messageReceived.emit('source', args[0]);
            break;
        default:
            if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] processResponse: unhandled response "' + response +'"');
            break;
    }
    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] processResponse: Amp Status is now ' + JSON.stringify(self.ampStatus));
};

//update the volumio Volume Settings, mainly makes this an Override plugin
serialampcontroller.prototype.initVolumeSettings = function() {
	var self = this;
    var defer = libQ.defer();

    //Prepare the data for updating the Volume Settings
    //first read the audio-device information, since we won't configure this 
    if (self.selectedAmp !==undefined && Object.keys(self.selectedAmp).length >0 &&
        ((self.port instanceof SerialPort && self.serialInterfaceDev != undefined) || (self.port instanceof net.Socket)) && 
        self.parser != undefined) {
        var volSettingsData = {
            'pluginType': 'system_hardware',
            'pluginName': 'serialampcontroller',
            'volumeOverride': true
        };
        volSettingsData.device = self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', 'outputdevice');
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] initVolumeSettings: getAlsaCards ' + JSON.stringify(volSettingsData.device));
        let alsaCards = self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getAlsaCards', '');
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] initVolumeSettings: getAlsaCards ' + JSON.stringify(alsaCards));
        if (alsaCards!=undefined) {
            let card = alsaCards.filter(element => element.id == volSettingsData.device)
            if (card.length > 0) {
                volSettingsData.name = card[0].name
                // volSettingsData.alsacard = card[0].alsacard
            } else {
                volSettingsData.name = '';
            }
        } else {
            volSettingsData.name = '';
        }
        volSettingsData.devicename = self.config.get('ampType');
        volSettingsData.mixer = '';
        volSettingsData.mixertype = 'None';
        volSettingsData.maxvolume = self.config.get('maxVolume');
        volSettingsData.volumecurve = '';
        volSettingsData.volumesteps = self.config.get('volumeSteps');
        volSettingsData.currentmute = self.volume.mute;
        self.commandRouter.volumioUpdateVolumeSettings(volSettingsData)
        .then(_ => {
            defer.resolve();
        })
        .fail(err => {
            self.logger.error("[SERIALAMPCONTROLLER] initVolumeSettings: volumioUpdateVolumeSettings failed:" + err );
            defer.reject(err)
        })            
    } else {
        if (self.debugLogging) self.logger.info("[SERIALAMPCONTROLLER] initVolumeSettings: Amp, serial Interface not yet set or listener not yet active.");
        defer.resolve();
    }
    return defer.promise;
};

serialampcontroller.prototype.resetVolumeSettings = function() {
	var self = this;
    var defer = libQ.defer();

    //Prepare the data for resetting the Volume Settings
    //first read the audio-device information, since we won't configure this 
    if (self.selectedAmp !=undefined && self.serialInterfaceDev != undefined && self.parser != undefined) {
        var volSettingsData = {};
        volSettingsData.device = self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getConfigParam', 'outputdevice');
        volSettingsData.mixer = '';
        volSettingsData.devicename = '';
        volSettingsData.mixertype = 'None';
        volSettingsData.maxvolume = 100;
        volSettingsData.volumecurve = 'logarithmic';
        volSettingsData.volumesteps = 1;
        volSettingsData.currentmute = true;
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] resetVolumeSettings: getAlsaCards ' + JSON.stringify(volSettingsData.device));
        let alsaCards = self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'getAlsaCards', '');
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] resetVolumeSettings: getAlsaCards ' + JSON.stringify(alsaCards));
        if (alsaCards!=undefined) {
            let card = alsaCards.filter(element => element.id == volSettingsData.device)
            if (card.length > 0) {
                volSettingsData.name = card[0].name
            } else {
                volSettingsData.name = '';
            }
        } else {
            volSettingsData.name = '';
        }
        self.commandRouter.volumioUpdateVolumeSettings(volSettingsData)
        .then(resp => {
            if (self.debugLogging) self.logger.info("[SERIALAMPCONTROLLER] resetVolumeSettings: " + JSON.stringify(volSettingsData) + ' ' + resp);
            defer.resolve();
        })
        .fail(err => {
            self.logger.error("[SERIALAMPCONTROLLER] resetVolumeSettings: volumioUpdateVolumeSettings failed:" + err );
            defer.reject(err)
        })
    } else {
        if (self.debugLogging) self.logger.info("[SERIALAMPCONTROLLER] resetVolumeSettings: Volume settings have been reset.");
        defer.resolve();
    }
    return defer.promise;
};

//update the volumio Volume Settings, mainly makes this an Override plugin
serialampcontroller.prototype.updateVolumeSettings = function(data) {
	var self = this;
    var defer = libQ.defer();

    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] updateVolumeSettings: received ' + JSON.stringify(data));
    return self.retrievevolume();
};


//used to send status requests to the amp. If the requested messageType is not available, 
//the functions just plots an error message and returns
serialampcontroller.prototype.sendStatusRequest = function(messageType) {
    var self = this;
    var cmdString = '';

    switch (messageType) {
        case "reqPower":
            cmdString = self.selectedAmp.statusRequests.reqPower;
            break;
        case "reqSource":
            cmdString = self.selectedAmp.statusRequests.reqSource;
            break;
        case "reqVolume":
            cmdString = self.selectedAmp.statusRequests.reqVolume;
            break;
        case "reqMute":
            cmdString = self.selectedAmp.statusRequests.reqMute;
            break;
        case "reqModel":
            cmdString = self.selectedAmp.statusRequests.reqModel;
            break;    
        default:
            break;
    };
    if (self.port!==undefined && cmdString!=='') {
        self.port.write(cmdString,'ascii',function(err) {
            if (err) {
                self.logger.error('[SERIALAMPCONTROLLER] sendStatusRequest: Failed to send: "' + cmdString + '" ' + err);
            }
            if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] sendStatusRequest: Sent command for "' + messageType + '": ' + cmdString);
        });
    }
}

//override the alsavolume function to send volume commands to the amp
serialampcontroller.prototype.alsavolume = function (VolumeInteger) {
	var self = this;
    var defer = libQ.defer();
    
    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] alsavolume: Set volume "' + VolumeInteger + '" ' + self.parser )
    if (self.selectedAmp!=undefined && (self.port instanceof net.Socket || self.serialInterfaceDev!=undefined) && self.parser != undefined) {
        switch (VolumeInteger) {
            case 'mute':
            // Mute
                if (self.selectedAmp.commands.muteOn != undefined) {
                    //amp supports dedicated mute on command
                    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] alsavolume: send dedicated muteOn.');
                    defer.resolve(self.waitForAcknowledge('mute'));
                    self.sendCommand('muteOn');
                } else if (self.selectedAmp.commands.mute != undefined) {
                    //amp only supports toggle mute command
                    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] alsavolume: send toggle mute.');
                    if (!self.ampStatus.mute) {
                        defer.resolve(self.waitForAcknowledge('mute'));
                        self.sendCommand('mute');
                    }
                } else {
                    //amp supports no mute command so we just put volume to defined min Vol
                    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] alsavolume: send Volume=min to mimic mute.');
                    if (self.ampStatus.volume>self.config.get('minVolume')) {
                        self.ampStatus.premutevolume = self.ampStatus.volume;
                        defer.resolve(self.waitForAcknowledge('volume'));
                        self.sendCommand('volValue',self.config.get('minVolume'))
                    }
                }
                break;
            case 'unmute':
            // Unmute (inverse of mute)
                if (self.selectedAmp.commands.muteOff != undefined) {
                    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] alsavolume: send dedicated muteOff.');
                    defer.resolve(self.waitForAcknowledge('mute'));
                    self.sendCommand('muteOff')
                } else if (self.selectedAmp.commands.mute != undefined) {
                    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] alsavolume: send toggle mute.');
                    if (self.ampStatus.mute) {
                        defer.resolve(self.waitForAcknowledge('mute'));
                        self.sendCommand('mute')
                    }
                } else {
                    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] alsavolume: set Volume to premute value.');
                    if (self.ampStatus.volume==self.config.get('minVolume')) {
                        defer.resolve(self.waitForAcknowledge('volume'));
                        self.sendCommand('volValue',self.ampStatus.premutevolume)
                    }
                }
                break;
            case 'toggle':
            // Toggle mute
                if (self.selectedAmp.commands.mute != undefined) {
                    //amp supports toggle function
                    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] alsavolume: send toggle mute.');
                    defer.resolve(self.waitForAcknowledge('mute'));
                    self.sendCommand('mute')
                } else if (self.selectedAmp.commands.muteOn != undefined && self.selectedAmp.commands.muteOff != undefined) {
                    //amp only supports dedicated mute and off functions
                    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] alsavolume: send dedicated muteOn/Off based on current state.');
                    defer.resolve(self.waitForAcknowledge('mute'));
                    if (self.volume.mute) {
                        self.sendCommand('muteOff')
                    } else {
                        self.sendCommand('muteOn')
                    }
                } else {
                    //amp supports no mute function
                    if (Volume.mute) {
                        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] alsavolume: set volume to 0 or premute value, depending on state.');
                        self.volume.vol = self.volume.premutevolume;
                        if (self.config.get('mapTo100')) {
                            //calculate the equivalent volume on a 0...100 scale
                            self.ampVolume = parseInt(self.volume.vol * (self.config.get('maxVolume')-self.config.get('minVolume'))/100+self.config.get('minVolume'));
                        } else {
                            self.ampVolume = self.volume.vol;
                        }
                        defer.resolve(self.waitForAcknowledge('volume'));
                        self.sendCommand('volValue',self.ampVolume)
                    } else {
                        self.volume.premutevolume = self.volume.vol;
                        defer.resolve(self.waitForAcknowledge('volume'));
                        self.sendCommand('volValue',self.config.get('minVolume'))
                    }
                }
                break;
            case '+':
            //increase volume by 1 step
                if (self.ampStatus.volume < self.config.get('maxVolume')) {
                    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] alsavolume: increase volume by single step.');
                    if (self.selectedAmp.commands.volUp != undefined) {
                        //amp supports stepwise volume increase
                        defer.resolve(self.waitForAcknowledge('volume'));
                        self.sendCommand('volUp')
                    } else {
                        //amp only supports sending of absolute volume
                        defer.resolve(self.waitForAcknowledge('volume'));
                        self.sendCommand('volValue',Math.min(parseInt(self.volume.vol + self.config.get('volumeSteps')),self.config.get('maxVolume')))
                    }
                }
                break;
            case '-':
            // decrease volume by 1 step
                if (self.ampStatus.volume > self.config.get('minVolume')) {
                    if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] alsavolume: decrease volume by single step.');
                    if (self.selectedAmp.commands.volDown != undefined) {
                        //amp supports stepwise volume decrease
                        defer.resolve(self.waitForAcknowledge('volume'));
                        self.sendCommand('volDown')
                    } else {
                        //amp only supports sending of absolute volume
                        defer.resolve(self.waitForAcknowledge('volume'));
                        self.sendCommand('volValue', Math.max(parseInt(self.volume.vol - self.config.get('volumeSteps')),self.config.get('minVolume')))
                    }
                }
            break;
            default:
            //set volume to integer
                if (self.config.get('mapTo100')) {
                    VolumeInteger = self.config.get('minVolume') + VolumeInteger/100 * (self.config.get('maxVolume') - self.config.get('minVolume') );
                } else {
                    VolumeInteger = Math.min(VolumeInteger,self.config.get('maxVolume'));
                    VolumeInteger = Math.max(VolumeInteger,self.config.get('minVolume'));
                }
                if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] alsavolume: set volume to integer value ' + VolumeInteger);
                defer.resolve(self.waitForAcknowledge('volume'));
                self.sendCommand('volValue',VolumeInteger);
                break;   
        };
        
    } else {
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] alsavolume: either Serial Interface, listener or Ampconfig missing');
        defer.resolve();
    }
    return defer.promise;
};

serialampcontroller.prototype.waitForAcknowledge = function(eventType) {
    var self = this;
    var defer = libQ.defer();

    self.messageReceived.once(eventType,(response) => {
        //check if response is correct, if yes, resolve the promise
        defer.resolve(self.getVolumeObject())
    })
    return defer.promise;
}

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
    }
    catch (e) {
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] loadI18nStrings: ' + language_code + ' not found. Fallback to en');
        self.i18nStrings = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
    }

    self.i18nStringsDefaults = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
};

serialampcontroller.prototype.getVolumeObject = function() {
    // returns the current amplifier settings in an object that volumio can use
    var volume = {};
    var defer = libQ.defer();
    var self = this;

    volume.mute = self.ampStatus.mute;
    volume.currentDisableVolumeControl = false;
    if (self.config.get('mapTo100')) {
        //calculate the equivalent volume on a 0...100 scale
        volume.vol = parseInt(((self.ampStatus.volume-self.config.get('minVolume'))/(self.config.get('maxVolume')-self.config.get('minVolume'))*100))
        //user can still set values outside allowed window on the amp directly
        volume.vol = Math.min(100,volume.vol);
        volume.vol = Math.max(0,volume.vol);
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] getVolumeObject: ' + JSON.stringify(volume));
        return libQ.resolve(volume)
        .then(function (volume) {
          defer.resolve(volume);
          self.commandRouter.volumioupdatevolume(volume);
        });
    } else {
        volume.vol = self.ampStatus.volume;
        volume.vol = Math.min(100,volume.vol);
        volume.vol = Math.max(0,volume.vol);
        if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] getVolumeObject: ' + JSON.stringify(volume));
        return libQ.resolve(volume)
        .then(function (volume) {
          defer.resolve(volume);
          self.commandRouter.volumioupdatevolume(volume);
        });
    }
    return defer.promise;
};

serialampcontroller.prototype.volumioupdatevolume = function() {
    var self = this;
    return self.commandRouter.volumioupdatevolume(self.getVolumeObject());
};

serialampcontroller.prototype.retrievevolume = function () {
    var self = this;
	if (self.debugLogging) self.logger.info('[SERIALAMPCONTROLLER] retrieveVolume: ');
    return self.getVolumeObject();
}
