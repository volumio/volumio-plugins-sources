'use strict';

var libQ = require('kew');
var fs = require('fs-extra');
var gpio = require('onoff').Gpio; // .Gpio is a constructor name, required.
var exec = require('child_process').exec;
var net = require('net');

const pluginName = 'IrActivityLed';			// this plugin name string used in messages.
const lircSocket = '/var/run/lirc/lircd'; 	// default location of the lirc unix domain socket.
const ledRootPath = '/sys/class/leds/';		// hardware LED files are kept here.

var ipcSocket;								// listener monitoring lircd unix domain socket.
var led;									// led object, depends on LED type selection in settings

module.exports = IrActivityLedController;

function IrActivityLedController(context) {
	var self = this;

	self.context = context;
	self.commandRouter = self.context.coreCommand;
	self.logger = self.context.logger;
	self.configManager = self.context.configManager;
}

IrActivityLedController.prototype.onVolumioStart = function () {
    var self = this;
	
    var configFile = self.commandRouter.pluginManager.getConfigurationFile(self.context, 'config.json');
	self.config = new (require('v-conf'))(); // this needs to be here to load config, not in global var declarations.
    self.config.loadFile(configFile);
	self.log('Initialized');
	
    return libQ.resolve();
};

IrActivityLedController.prototype.onStart = function () {
    var self = this;
    var defer = libQ.defer();

	self.load18nStrings();  

	ipcSocket = new net.Socket();
	
	self.socketConnect()
		.then(() => self.initLed())			
		.then(() => defer.resolve())
		.fail((err) => {
			self.log(err);
			// ENOENT = Error NO ENTry or Error NO ENTity = No such file or directory. User friendly message on no lirc.
			var msg = err.indexOf('ENOENT') > -1 ? 'lirc socket not found, is IR Remote Controller plugin installed and enabled?' : err; 
			self.commandRouter.pushToastMessage('error', `${pluginName} plugin: ${msg}`);
			defer.reject(err);
		});
	return defer.promise;
};

IrActivityLedController.prototype.onStop = function () {
    var self = this;

	if (ipcSocket) {
		ipcSocket.removeAllListeners();
		ipcSocket.destroy();
		ipcSocket = undefined; // indicate to the connection callback the plugin is disabled. Otherwise connection attempts will continue.
	}
	
    return self.releaseLed();
};


// Establish initial connection to the lircd socket or reconnect to previously closed one and hook up event listeners.
// Uses recursion to make several attempts to (re)connect.
// ir_controller takes a while to start, lirc is restarted in the process. When lirc is restarted socket closes.
// Number of attempts and delay between those are somewhat arbitrary, on Pi 4 lirc settle time is just below 2s.
IrActivityLedController.prototype.socketConnect = function (attempt = 0) {
    var self = this;  
	var defer = libQ.defer();
	
	const maxAttempts = 20;	// this callback will be executed repeatedly until connection is established or max tries exceeded.

	if (attempt >= maxAttempts || !ipcSocket) { // keep track of the reconnect attempts and plugin enabled state.
		const msg = `Connecting to lirc socket failed after ${attempt} attempts`;
		self.log(msg); // when called as stop event handler, defer.reject message is lost, log this separately.
		if(ipcSocket) ipcSocket.removeAllListeners(); // give up, no more attempts.
		return defer.reject(msg);
	}

	ipcSocket.removeAllListeners(); // start clean
	
	const errorHandler = function(err) {
		self.log(err);
		// instead of rejecting the promise launch another attempt after a delay.
		// Calling resolve with a pending promise causes promise to wait on the passed promise.
		setTimeout(() => defer.resolve(self.socketConnect(++attempt, defer)), 300);	// recursion
    };
	
	const connectHandler = function(data) { // 'connect' listener, once. 'connect' is emitted when a socket connection is established.
		self.log('Connected to lirc socket');
		// add permanent error listener required to avoid node crashing on error.
		ipcSocket.on('error', (err) => self.log('lirc socket error: ' + err));
		ipcSocket.off('error', errorHandler); // remove listener that starts new connection attempt.
		ipcSocket.on('data', self.handleIrData.bind(self));	// 'data' is emitted when data is received.
		// add 'close' listener once on successfull connection to reconnect on next closure.
		ipcSocket.once('close', () => {	// 'close' is emitted once the socket is fully closed.
			self.log('lirc socket closed');
			self.socketConnect();
		});
		defer.resolve();
    };
	
	ipcSocket.once('error', errorHandler);
	
	self.log(`lirc socket connect: attempt ${attempt+1} of ${maxAttempts}`);
						
	// if lircd is not active establishing a connection will start it, but without a lirc0 device it will log endless errors.
	runCommand('/bin/systemctl is-active lircd') // check if lircd is running, active = running.
		.then((data) => { // if service is running this command returns 0 and puts 'active' on stdout, otherwise returns error code.
			self.log('lircd service status: ' + data.trim()); // log state for debugging, no point to check value for 'active'.
			ipcSocket.connect(lircSocket, connectHandler); // try to establish connection. DEBUGGING: lircSocket +'1'
		})
		// while lircd is (re)starting, this command fails with an error code causing error handler to start another attempt.
		.fail((err) => errorHandler('lircd service is inactive, skipping connection attempt. ' + err)); 

	return defer.promise;
} 

IrActivityLedController.prototype.handleIrData = function(data) {
    var self = this;
	
	self.log('ir command received: ' + data);

	if(!led || led.isBlinking) return;
	led.isBlinking = 1;

	self.log('Starting to blink LED');

	led.blink()
		//.then(() => self.log('after call'))
		.fail((err) => self.log(err))
		.fin(() => setTimeout(() => { if(led) led.isBlinking = 0; }, 500)); // block next blinking 500ms past blinking duration
};

function blinkSysLed(cycle = 0, state = led.defaultBrightness) {
	if(!led) return libQ.reject('quitting blinking, led value: ' + led); // plugin may be disabled during blinking.
	var defer = libQ.defer();

	//var foo = cycle >= 4 ? 'brightness1' : 'brightness'; // ${foo} : DEBUGGING: simulate failure in the middle of the resursion

	(cycle == 0 ? writeFile(`${led.path}/trigger`, 'none') : libQ.resolve()) // set trigger to none on first cycle
		.then(() => writeFile(`${led.path}/brightness`, (~state & 0xff).toString()))		// write inverted state. Debugging: ${foo}	
		.then(() => cycle >= led.cycles ? // Calling resolve with a pending promise causes promise to wait on the passed promise
			defer.resolve(writeFile(`${led.path}/trigger`, led.defaultMode.toString())) : 	// restore trigger on last run			
			setTimeout(() => defer.resolve(blinkSysLed(++cycle, ~state & 0xff)), led.delay))	// recursion
		.fail((err) => defer.reject(err));
		
	return defer.promise;
};

function blinkGpioLed(cycle = 0, state) {
	if(!led) return libQ.reject('quitting blinking, led value: ' + led); // plugin may be disabled during blinking.
	var defer = libQ.defer();

	// read initial state on first cycle. Use Promise instead of libQ (onoff functions returns that)
	(cycle == 0 ? state = led.read() : Promise.resolve()) 
		.then(() => led.write(state ^ 1)) // write inverted state
		//.then(() => cycle >= 3 ? Promise.reject('artificial failure') : Promise.resolve()) // DEBUGGING
		.then(() => cycle >= led.cycles ?
			defer.resolve() : // done blinking. setInterval delays first execution, using timeout instead.
			setTimeout(() => defer.resolve(blinkGpioLed(++cycle, state ^ 1)), led.delay))	// recursion	
		.catch((err) => defer.reject(err));
	
	return defer.promise;
};

// initialize LED selected in the config
IrActivityLedController.prototype.initLed = function() {
    var self = this;
	var defer = libQ.defer();

	if (self.config.get('output') == 'gpio') {
		self.log('initializing GPIO LED');
		led = new gpio(self.config.get('gpionum'), 'out');
		led.blink = blinkGpioLed; // circular ref since blink functions use led object for params. Works ok.
		defer.resolve();
	}
	else {
		self.log('initializing built-in LED');
		led = {};
		led.path = ledRootPath + self.config.get('output');
		led.blink = blinkSysLed;	
		runCommand(`/usr/bin/sudo /bin/chmod a+rw ${led.path}/brightness ${led.path}/trigger`)	// set permissions
			.then(() => readFile(`${led.path}/brightness`)) 	// read default brightness value 
			.then((value) => led.defaultBrightness = value.trim())// store default brightness (normally 255)
			.then(() => readFile(`${led.path}/trigger`)) 	// read default trigger (depends on LED)
			.then((value) => led.defaultMode = value.match(/(?<=\[)[^\][]*(?=])/g)) // get bracketed selection from trigger options
			.then(() => defer.resolve())
			.fail((err) => defer.reject(err));			
	}
	
	// common blinking parameters
	led.isBlinking = 0; // indicate current blinking state to avoid overlapping calls
	led.delay = self.config.get('interval') / 2;	// half blink period
	led.cycles = self.config.get('cycles') * 2 - 1; // number of flip state cycles, 2 per blink cycle
	
	return defer.promise;
};

// unexport LED gpio or restore buit-in LED state and file permissions.
// If plugin is disabled while connecting to a socket or blinking (long async processes), attempt is made to terminate those.
// One cycle can still execute after plugin disabling and a race condition may occur when restoring the default state.
IrActivityLedController.prototype.releaseLed  = function() {
    var self = this;
	var defer = libQ.defer();

	if(!led) return libQ.resolve();

	if (led.unexport) { // only gpio LED has unexport
		self.log('releasing GPIO LED');
		try {
			led.unexport(); // something else may have unexported this GPIO, fatal error. Unexport is synchronous.
			defer.resolve();
		} catch(err) {
			//self.log('releasing GPIO LED: ' + err);
			defer.reject(err);
		}
		led = undefined; //gpio object should not be used after unexport.
		//defer.resolve();
	}
	else {
		self.log('releasing built-in LED');
		writeFile(`${led.path}/brightness`, led.defaultBrightness.toString()) // if plugin is disabled during blinking, restore
			.then(() => writeFile(`${led.path}/trigger`, led.defaultMode.toString())) // race still can happen during blinking.
			.then(() => runCommand(`/usr/bin/sudo /bin/chmod u=rw,go=r ${led.path}/brightness ${led.path}/trigger`)) // restore permissions (normally 644)
			.then(() => defer.resolve())
			.fail((err) => defer.reject(err))
			.fin(() => led = undefined); // indicate plugin state to the blinker function
	}
	return defer.promise;
};

// Promisified Helper Methods -----------------------------------------------------------------------------

// Execute shell command. Rejects on error in favor of stderr. stderr is not used or exposed.
function runCommand(cmd) {
	var defer = libQ.defer();
	exec(cmd, { uid: 1000, gid: 1000 }, defer.makeNodeResolver());
	return defer.promise;
}

function readFile(file) {
	var defer = libQ.defer();
	fs.readFile(file, 'utf8', defer.makeNodeResolver());
	return defer.promise;
}

function writeFile(file, data) {
	var defer = libQ.defer();
	fs.writeFile(file, data, 'utf8', defer.makeNodeResolver());
	return defer.promise;
}

// Output to log. Everything is logged as info. TODO: log as errors too.
IrActivityLedController.prototype.log = function(s) {
	var self = this;
	self.logger.info(`[${pluginName}] ${s}`); 
}

// Settings Methods -----------------------------------------------------------------------------

IrActivityLedController.prototype.saveSettings = function (data) {
    var self = this;

    try {
		if (isNaN(data['gpionum']) || data['gpionum'] < 0 || data['gpionum'] > 200) {
			throw new Error (self.getI18nString('GPIONUM_LBL') + self.getI18nString('ERROR_OUT_OF_RANGE_TITLE') + '. ' + self.getI18nString('ERROR_OUT_OF_RANGE_MESSAGE') + '0 - 200' );
		}
				
		if (self.config.get('output') != 'gpio' && !fs.existsSync(ledRootPath + self.config.get('output'))) {
			throw new Error(self.getI18nString('OUTPUT_LBL') + self.getI18nString('ERROR_NOT_FOUND_TITLE'));
		}
		
		if (isNaN(data['interval']) || data['interval'] < 10 || data['interval'] > 500) {
			throw new Error (self.getI18nString('INTERVAL_LBL') + self.getI18nString('ERROR_OUT_OF_RANGE_TITLE') + '. ' + self.getI18nString('ERROR_OUT_OF_RANGE_MESSAGE') + '10 - 500' );
		}
		
		if (isNaN(data['cycles']) || data['cycles'] < 1 || data['cycles'] > 50) {
			throw new Error (self.getI18nString('CYCLES_LBL') + self.getI18nString('ERROR_OUT_OF_RANGE_TITLE') + '. ' + self.getI18nString('ERROR_OUT_OF_RANGE_MESSAGE') + '1 - 50' );
		}
		
		self.config.set('output', data['output']['value']);
		self.config.set('gpionum', data['gpionum']);
		self.config.set('interval', data['interval']); // numeric params do not need ['value']
		self.config.set('cycles', data['cycles']);

		self.releaseLed()	// release LED before creating a new one
			.then(() => self.initLed())
			.then(() => self.commandRouter.pushToastMessage('success', self.getI18nString('SUCCESS_TITLE'), 
				self.getI18nString('SUCCESS_MESSAGE')))
			.fail((err) => self.commandRouter.pushToastMessage('error', self.getI18nString('ERROR_MESSAGE'), err.toString()));
    } catch(err) { // some errors require toString() to be properly displayed by the toast msg.
		self.commandRouter.pushToastMessage('error', self.getI18nString('ERROR_MESSAGE'), err.toString());
    }
};

IrActivityLedController.prototype.load18nStrings = function () {
    var self = this;

    try {
        var language_code = this.commandRouter.sharedVars.get('language_code');
        self.i18nStrings = fs.readJsonSync(__dirname + '/i18n/strings_' + language_code + '.json');
    } catch (e) {
        self.i18nStrings = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
    }

    self.i18nStringsDefaults = fs.readJsonSync(__dirname + '/i18n/strings_en.json');
};

IrActivityLedController.prototype.getI18nString = function (key) {
    var self = this;

    if (self.i18nStrings[key] !== undefined)
        return self.i18nStrings[key];
    else
        return self.i18nStringsDefaults[key];
};

// Configuration Methods -----------------------------------------------------------------------------

// helper method to get the label for specified key from UIConfig json options.
function getLabelForSelect(options, key) { 
	for (let i = 0; i < options.length; i++) {
		if (options[i].value === key) {
			return options[i].label;
		}
	}
	return 'Value not found';
}

IrActivityLedController.prototype.getUIConfig = function () {
    var self = this;
	var defer = libQ.defer();

    const lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {
            uiconf.sections[0].content[0].value.value = self.config.get('output', 'led1'); // default value ensures settings work on fresh install
            uiconf.sections[0].content[0].value.label = getLabelForSelect(self.configManager.getValue(uiconf, 'sections[0].content[0].options'), self.config.get('output', 'PWR')); // get label instead of value
			uiconf.sections[0].content[1].value = self.config.get('gpionum', 21); // default value ensures settings work on fresh install
            //uiconf.sections[0].content[1].value.label = self.config.get('gpionum', 21).toString();
            uiconf.sections[0].content[2].value = self.config.get('interval', 70);
			uiconf.sections[0].content[3].value = self.config.get('cycles', 3);
            defer.resolve(uiconf);
        })
        .fail(function(err)
        {
            self.logger.error(`Failed to parse UI Configuration page for plugin ${pluginName}: ${err}`); 
			defer.reject(err);
        });

    return defer.promise;
};

IrActivityLedController.prototype.getConfigurationFiles = function () {
	return ['config.json'];
};

IrActivityLedController.prototype.updateUIConfig = function () {
	var self = this;

	self.commandRouter.getUIConfigOnPlugin('system_hardware', 'iractivityled', {})
		.then(function (uiconf) {
			self.commandRouter.broadcastMessage('pushUiConfig', uiconf);
		});
	self.commandRouter.broadcastMessage('pushUiConfig');
};