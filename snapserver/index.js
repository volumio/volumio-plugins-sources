'use strict';

var libQ = require('kew');
var fs = require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;

var streams = [
{
	"id": "1",
	"name": "main",
	"pipe": "/tmp/snapfifo"
}];

module.exports = snapserver;
function snapserver(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

}

snapserver.prototype.onVolumioStart = function()
{
	var self = this;
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);
    return libQ.resolve();
}

snapserver.prototype.onStart = function() {
    var self = this;
	var defer=libQ.defer();

	if(self.config.get('debug_logging'))
		console.log('[SnapServer] config: ' + JSON.stringify(self.config));
	
	self.restartService(true)
	.fail(function(e)
	{
		self.commandRouter.pushToastMessage('error', "Startup failed", "Could not start the SnapServer plugin in a fashionable manner.");
		self.logger.error("Could not start the SnapServer plugin in a fashionable manner. Error: " + e);
		defer.reject(new error(e));
	});
	defer.resolve();
    return defer.promise;
};

snapserver.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    self.stopService()
	.fail(function(e)
	{
		defer.reject(new error());
	});

    return libQ.resolve();
};

snapserver.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};


// Configuration Methods -----------------------------------------------------------------------------

snapserver.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;
	if(self.config.get('debug_logging'))
		console.log('[SnapServer] config: ' + JSON.stringify(self.config));
		
	// Prettify the labels for chosen codecs
	var codecs = [
	{
		"name": "Flac (lossless compressed)",
		"rate": "flac"
	},
	{
		"name": "PCM (lossless uncompressed)",
		"rate": "pcm"
	},
	{
		"name": "OGG Vorbis (lossy compressed)",
		"rate": "ogg"
	}];
	
    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {
			// Main stream
			uiconf.sections[0].content[0].value = self.config.get('stream_name');
			// 1 = expert settings			
			uiconf.sections[0].content[2].value.value = self.config.get('stream_sample_rate');
			uiconf.sections[0].content[2].value.label = self.config.get('stream_sample_rate') + 'Hz';
			uiconf.sections[0].content[3].value.value = self.config.get('stream_bit_depth');
			uiconf.sections[0].content[3].value.label = self.config.get('stream_bit_depth') + ' bits';
			uiconf.sections[0].content[4].value = self.config.get('stream_channels');
			uiconf.sections[0].content[5].value.value = self.config.get('stream_codec');
			uiconf.sections[0].content[5].value.label = codecs.find(c => c.rate == [self.config.get('stream_codec')]).name;
			
			uiconf.sections[0].content[6].value = self.config.get('enable_debug_logging');
			self.logger.info("1/3 setting groups loaded");	
			
			// Show players
			let mpd = execSync("echo $(sed -n \"/.*type.*\"fifo\"/{n;p}\" /etc/mpd.conf | cut -d '\"' -f2) | grep -q yes; echo $?");
			uiconf.sections[1].content[0].value = (mpd == 1 ? false : true);
			uiconf.sections[1].content[0].description = (mpd == 1 ? "Inactive" : "Active");
			if(self.config.get('enable_debug_logging')) { console.log('mpd: ' + mpd); }
			
			let volspotconnect2 = execSync("cat /data/plugins/music_service/volspotconnect2/volspotconnect2.tmpl | grep -q pipe; echo $?");
			if(self.config.get('enable_debug_logging')) { console.log('volspotconnect2 (ARGS): ' + volspotconnect2); }
			// If the TOML config files exist, one can safely assume they're being used.
			volspotconnect2 = execSync("cat /data/plugins/music_service/volspotconnect2/volspotify.tmpl | grep -q pipe; echo $?");
			if(self.config.get('enable_debug_logging')) { console.log('volspotconnect2 (TOML): ' + volspotconnect2); }
			uiconf.sections[1].content[1].value = (volspotconnect2 == 1 ? false : true);
			uiconf.sections[1].content[1].description = (volspotconnect2 == 1 ? "Inactive" : "Active");
			
			let spop = execSync("cat /data/plugins/music_service/spop/spop.conf.tmpl | grep -q fifo; echo $?");
			uiconf.sections[1].content[2].value = (spop == 1 ? false : true);
			uiconf.sections[1].content[2].description = (spop == 1 ? "Inactive" : "Active");
			if(self.config.get('enable_debug_logging')) { console.log('spop: ' + spop); }
			
			let shairport = execSync("cat /volumio/app/plugins/music_service/airplay_emulation/shairport-sync.conf.tmpl | grep -q ^pipe; echo $?");
			uiconf.sections[1].content[3].value = (shairport == 1 ? false : true);
			uiconf.sections[1].content[3].description = (shairport == 1 ? "Inactive" : "Active");
			if(self.config.get('enable_debug_logging')) { console.log('airplay: ' + shairport); }			
			self.logger.info("2/3 setting groups loaded");
			
			// Show service settings
			uiconf.sections[2].content[0].value = self.config.get('patch_mpd_conf');
			// 1 = expert settings
			uiconf.sections[2].content[2].value.value = self.config.get('mpd_sample_rate');
			uiconf.sections[2].content[2].value.label  = self.config.get('mpd_sample_rate') + 'Hz';
			uiconf.sections[2].content[3].value.value = self.config.get('mpd_bit_depth');
			uiconf.sections[2].content[3].value.label = self.config.get('mpd_bit_depth') + ' bits';
			uiconf.sections[2].content[4].value = self.config.get('mpd_channels');
			uiconf.sections[2].content[5].value = self.config.get('enable_alsa_mpd');
			uiconf.sections[2].content[6].value = self.config.get('enable_fifo_mpd');
			uiconf.sections[2].content[7].value.value = self.config.get('mpd_stream');
			uiconf.sections[2].content[7].value.label = streams.find(c => c.id == [self.config.get('mpd_stream')]).name;
			uiconf.sections[2].content[8].value = self.config.get('enable_volspotconnect_service');
			uiconf.sections[2].content[9].value.value = self.config.get('volspotconnect_stream');
			uiconf.sections[2].content[9].value.label = streams.find(c => c.id == [self.config.get('volspotconnect_stream')]).name;
			uiconf.sections[2].content[10].value = self.config.get('enable_spop_service');
			uiconf.sections[2].content[11].value.value = self.config.get('spop_stream');
			uiconf.sections[2].content[11].value.label = streams.find(c => c.id == [self.config.get('spop_stream')]).name;
			uiconf.sections[2].content[12].value = self.config.get('enable_airplay_service');
			uiconf.sections[2].content[13].value.value = self.config.get('airplay_stream');
			uiconf.sections[2].content[13].value.label = streams.find(c => c.id == [self.config.get('airplay_stream')]).name;			
			self.logger.info("3/3 setting groups loaded");
			
            defer.resolve(uiconf);
        })
        .fail(function(err)
        {
			console.log('An error occurred: ' + err);
            defer.reject(new Error());
        });

    return defer.promise;
};

snapserver.prototype.getConfigurationFiles = function() {
	return ['config.json'];
}

snapserver.prototype.setUIConfig = function(data) {
	var self = this;
	//Perform your installation tasks here
};

snapserver.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

snapserver.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};

// Update Config Methods -----------------------------------------------------------------------------

snapserver.prototype.updateServerConfig = function(data) {
	var self = this;
	var defer = libQ.defer();
	
	// Always update snapserver config, there's no neat if-statement possible afaik; it also doesn't break anything (worst case is a playback hiccup of a few seconds)
	self.config.set('stream_name', data['stream_name']);
	self.config.set('stream_sample_rate', data['stream_sample_rate'].value);
	self.config.set('stream_bit_depth', data['stream_bit_depth'].value);
	self.config.set('stream_channels', data['stream_channels']);
	self.config.set('stream_codec', data['stream_codec'].value);
	self.config.set('enable_debug_logging', data['enable_debug_logging']);
	
	self.updateSnapServerConfig()
	.then(function(restart){
		if(self.config.get('enable_debug_logging'))
			self.logger.info('Config saved, restarting service now...');
		self.restartService(false);
		
		defer.resolve(restart);
	});
	
	if(self.config.get('enable_debug_logging'))
		self.logger.info('New config: ' + JSON.stringify(self.config));
	
	self.commandRouter.pushToastMessage('success', "Completed", "Successfully updated server configuration");
	return defer.promise;
};

snapserver.prototype.updateSnapServerConfig = function ()
{
	var self = this;
	var defer = libQ.defer();
	
	let stream = "pipe:///tmp/snapfifo?name=";
	stream = (self.config.get('stream_name') == undefined ? stream + 'Volumio' : stream + self.config.get('stream_name')) + '\\&mode=read';

	let format = self.config.get('stream_sample_rate') + ':' + self.config.get('stream_bit_depth') + ':' + self.config.get('stream_channels');
	let full_format = (format == undefined || format == '48000:16:2' ? '' : '\\&sampleformat=' + format);
	
	let codec = (self.config.get('stream_codec') == undefined || self.config.get('stream_codec') == 'flac') ? '' : '\\&codec=' + self.config.get('stream_codec');
	let full_stream = stream + full_format + codec;
	
	if(fs.existsSync('/etc/snapserver.conf'))
	{
		if(self.config.get('enable_debug_logging')) { self.logger.info('snapserver.conf | ' + stream); }			
		self.streamEdit("^source", "source = " + stream, __dirname + "/templates/snapserver.conf", false);
		self.streamEdit("^sampleformat", "sampleformat = " + format, __dirname + "/templates/snapserver.conf", false);
		self.streamEdit("^codec", "codec = " + self.config.get('stream_codec'), __dirname + "/templates/snapserver.conf", false);		
	}
	else
	{	
		if(self.config.get('enable_debug_logging')) { self.logger.info('systemd unit | ' + full_stream); }			
		self.streamEdit("^SNAPSERVER_OPTS", "SNAPSERVER_OPTS=\"-s " + full_stream + "\"", __dirname + "/default/snapserver", false);
	}
	defer.resolve();
	
	return defer.promise;
};

snapserver.prototype.updatePlayerConfigs = function(data) {
	var self = this;
	var defer = libQ.defer();
	
	if(self.config.get('enable_debug_logging')) { self.logger.info('Updating player configs for use with SnapServer...'); }
	self.config.set('patch_mpd_conf', data['patch_mpd_conf']);
	self.config.set('mpd_sample_rate', data['mpd_sample_rate'].value);
	self.config.set('mpd_bit_depth', data['mpd_bit_depth'].value);
	self.config.set('mpd_channels', data['mpd_channels']);
	self.config.set('enable_alsa_mpd', data['enable_alsa_mpd']);
	self.config.set('enable_fifo_mpd', data['enable_fifo_mpd']);
	self.config.set('mpd_stream', data['mpd_stream'].value);
	if(data['patch_mpd_conf']) { self.updateMpdConfig(); } // Only patch when necessary
	self.config.set('enable_volspotconnect_service', data['enable_volspotconnect_service']);
	self.config.set('volspotconnect_stream', data['volspotconnect_stream'].value);
	self.config.set('enable_spop_service', data['enable_spop_service']);
	self.config.set('spop_stream', data['spop_stream'].value);
	self.updateSpotifyConfig(data['enable_volspotconnect_service'], data['enable_spop_service']);
	self.config.set('enable_airplay_service', data['enable_airplay_service']);
	self.config.set('airplay_stream', data['airplay_stream'].value);
	self.updateShairportConfig(data['enable_airplay_service']);
	
	var responseData = {
	title: 'Configuration required',
	message: 'Changes have been made to the music services, you need to save the settings in, or restart the corresponding plugin again for the changes to take effect. In the case of changes to MPD, a restart is advised.',
	size: 'lg',
	buttons: [{
				name: self.commandRouter.getI18nString('COMMON.CONTINUE'),
				class: 'btn btn-info',
				emit: '',
				payload: ''
			}
		]
	}
	self.commandRouter.broadcastMessage("openModal", responseData);
	
	return defer.promise;
};

snapserver.prototype.updateMpdConfig = function() {
	var self = this;
	var defer = libQ.defer();
	
	// Because of complex replacements, a script is used for patching purposes
	self.generateMpdUpdateScript()
	.then(function(executeScript)
        {
			self.executeShellScript(__dirname + '/mpd_switch_to_fifo.sh');
			defer.resolve(execScript);
        });
	self.commandRouter.pushToastMessage('success', "Completed", "Successfully updated MPD config");
	
	return defer.promise;
};

snapserver.prototype.generateMpdUpdateScript = function()
{
	var self = this;
	var defer = libQ.defer();
	
	fs.readFile(__dirname + "/templates/mpd_switch_to_fifo.template", 'utf8', function (err, data) {
		if (err) {
			defer.reject(new Error(err));
		}

		let tmpconf = data.replace("${SAMPLE_RATE}", self.config.get('mpd_sample_rate'));
		tmpconf = tmpconf.replace("${BIT_DEPTH}", self.config.get('mpd_bit_depth'));
		tmpconf = tmpconf.replace("${CHANNELS}", self.config.get('mpd_channels'));
		tmpconf = tmpconf.replace(/ENABLE_ALSA/g, self.config.get('enable_alsa_mpd') == true ? "yes" : "no");
		tmpconf = tmpconf.replace(/ENABLE_FIFO/g, self.config.get('enable_fifo_mpd') == true ? "yes" : "no");
		
		fs.writeFile(__dirname + "/mpd_switch_to_fifo.sh", tmpconf, 'utf8', function (err) {
			if (err)
			{
				self.commandRouter.pushConsoleMessage('Could not write the script with error: ' + err);
				defer.reject(new Error(err));
			}
			else 
				defer.resolve();
		});
	});
	
	if(self.config.get('mpd_stream') == "1")
	{
		if(self.config.get('enable_debug_logging')) { self.logger.info('Set pipe to: snapfifo'); }
		self.streamEdit("[ tab]\\+path", "\ \ \ \ path\ \ \ \ \ \ \ \ \ \ \ \ \"/tmp/snapfifo\"", "/etc/mpd.conf", false);
	}
	else
	{
		if(self.config.get('enable_debug_logging')) { self.logger.info('Set pipe to: snapfifo2'); }
		self.streamEdit("[ tab]\\+path", "\ \ \ \ path\ \ \ \ \ \ \ \ \ \ \ \ \"/tmp/snapfifo2\"", "/etc/mpd.conf", false);
	}
		
	self.restartMpd();
	return defer.promise;
};

snapserver.prototype.restartMpd = function (callback) {
  var self = this;

  if (callback) {
    exec('/usr/bin/sudo /bin/systemctl restart mpd.service ', {uid: 1000, gid: 1000},
      function (error, stdout, stderr) {
        self.commandRouter.executeOnPlugin('music_service', 'mpd', 'mpdEstablish');
        callback(error);
      });
  } else {
    exec('/usr/bin/sudo /bin/systemctl restart mpd.service ', {uid: 1000, gid: 1000},
      function (error, stdout, stderr) {
        if (error) {
          self.logger.error('Cannot restart MPD: ' + error);
        } else {
		  self.commandRouter.executeOnPlugin('music_service', 'mpd', 'mpdEstablish');
        }
      });
  }
};

snapserver.prototype.updateShairportConfig = function(enable) {
	var self = this;

	if (enable === true)
	{
		self.streamEdit("alsa", "pipe =", "/volumio/app/plugins/music_service/airplay_emulation/shairport-sync.conf.tmpl", false);
		self.streamEdit("output_device", "name = \"" +  streams.find(c => c.id == [self.config.get('airplay_stream')]).pipe + "\";", "/volumio/app/plugins/music_service/airplay_emulation/shairport-sync.conf.tmpl", false);
	}
	else
	{
		//self.streamEdit("pipe", "alsa", "/volumio/app/plugins/music_service/airplay_emulation/shairport-sync.conf.tmpl", false);
		// The config item 'name' is ambiguous, therefore it can't be rolled back like this.
		//self.streamEdit("name", "output_device = \"${device}\";", "/volumio/app/plugins/music_service/airplay_emulation/shairport-sync.conf.tmpl", false);
		
		execSync("sed '/^pipe/,/name/s/name/output_device/' /volumio/app/plugins/music_service/airplay_emulation/shairport-sync.conf.tmpl");
		self.streamEdit("pipe", "alsa", "/volumio/app/plugins/music_service/airplay_emulation/shairport-sync.conf.tmpl", false);
		
		// Better to create a backup of the original config and restore it.
		self.restoreShairportConfig();
	}
	
	return true;
};

snapserver.prototype.updateSpotifyConfig = function(volspotconnect2, spop) {
	var self = this;
	var defer = libQ.defer();
	
	if(volspotconnect2 === true)
	{
		// Legacy implementation
		self.streamEdit("--device ${outdev}", "--backend pipe --device " +  streams.find(c => c.id == [self.config.get('volspotconnect_stream')]).pipe + " ${normalvolume} \\\\", "/data/plugins/music_service/volspotconnect2/volspotconnect2.tmpl", false);
		// New implementation > TOML
		self.streamEdit("device =", "device = \\x27" +  streams.find(c => c.id == [self.config.get('volspotconnect_stream')]).pipe + "\\x27", "/data/plugins/music_service/volspotconnect2/volspotify.tmpl", false);
		self.streamEdit("backend", "backend = \\x27pipe\\x27", "/data/plugins/music_service/volspotconnect2/volspotify.tmpl", false);
		
	}
	else	
	{
		self.streamEdit("--backend", "--device ${outdev}", "/data/plugins/music_service/volspotconnect2/volspotconnect2.tmpl", false);
		self.streamEdit("device = ", "device = \\x27${outdev}\\x27", "/data/plugins/music_service/volspotconnect2/volspotify.tmpl", false);
		self.streamEdit("backend", "backend = \\x27alsa\\x27", "/data/plugins/music_service/volspotconnect2/volspotify.tmpl", false);
	}
	
	if(spop === true)
	{
		// Edit SPOP config, can be written neater, but this makes it more clear.
		self.streamEdit("output_type", "output_type = raw", "/data/plugins/music_service/spop/spop.conf.tmpl", false);
		self.streamEdit("output_name", "output_name = " + streams.find(c => c.id == [self.config.get('spop_stream')]).pipe, "/data/plugins/music_service/spop/spop.conf.tmpl", false);
	}
	else
	{
		self.streamEdit("output_type", "output_type = alsa", "/data/plugins/music_service/spop/spop.conf.tmpl", false);
		self.streamEdit("output_name", "output_name = ${outdev}", "/data/plugins/music_service/spop/spop.conf.tmpl", false);		
	}

	return defer.promise;
};

// General functions ---------------------------------------------------------------------------------

snapserver.prototype.executeShellScript = function (scriptName)
{
	var self = this;
	var defer = libQ.defer();

	var command = "/bin/sh " + scriptName;	
	exec(command, {uid:1000, gid:1000}, function (error, stout, stderr) {
		if(error)
		{
			console.log(stderr);
			self.commandRouter.pushConsoleMessage('Could not execute script {' + scriptName + '} with error: ' + error);
		}

		self.commandRouter.pushConsoleMessage('Successfully executed script {' + scriptName + '}');
		//fs.unlinkSync(scriptName)
		defer.resolve();
	});

	
	return defer.promise;
};

snapserver.prototype.streamEdit = function (pattern, value, inFile, append)
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
			console.log(stderr);

		defer.resolve();
	});
	
	return defer.promise;
};

snapserver.prototype.restoreShairportConfig = function ()
{
	var self = this;
	var defer = libQ.defer();
	let command = "/bin/cp /volumio/app/plugins/music_service/airplay_emulation/shairport-sync.conf.tmpl.bak /volumio/app/plugins/music_service/airplay_emulation/shairport-sync.conf.tmpl";
	exec(command, {uid:1000, gid:1000}, function (error, stout, stderr) {
		if(error)
			console.log(stderr);

		defer.resolve();
	});
	
	return defer.promise;
};

snapserver.prototype.isValidJSON = function (str) 
{
	var self = this;
    try 
	{
        JSON.parse(JSON.stringify(str));
    } 
	catch (e) 
	{
		self.logger.error('Could not parse JSON, error: ' + e + '\nMalformed JSON msg: ' + JSON.stringify(str));
        return false;
    }
    return true;
};


// Service Control -----------------------------------------------------------------------------------

snapserver.prototype.restartService = function (boot)
{
	var self = this;
	var defer=libQ.defer();

	var command = "/usr/bin/sudo /bin/systemctl restart snapserver";		
	if(!boot)
	{
		if(self.config.get('enable_debug_logging'))
			self.logger.info('Reloading daemon, for changes to take effect');
		command = "/usr/bin/sudo /bin/systemctl daemon-reload && /usr/bin/sudo /bin/systemctl restart snapserver";
	}
	
	exec(command, {uid:1000,gid:1000}, function (error, stdout, stderr) {
		if (error !== null) {
			self.commandRouter.pushConsoleMessage('The following error occurred while starting SnapServer: ' + error);
			self.commandRouter.pushToastMessage('error', "Restart failed", "Restarting SnapServer failed with error: " + error);
			defer.reject();
		}
		else {
			self.commandRouter.pushConsoleMessage('SnapServer started');
			if(boot == false)
				self.commandRouter.pushToastMessage('success', "Restarted SnapServer", "Restarted SnapServer for the changes to take effect.");
			
			defer.resolve();
		}
	});

	return defer.promise;
};

snapserver.prototype.stopService = function ()
{
	var self = this;
	var defer=libQ.defer();

	var command = "/usr/bin/sudo /bin/systemctl stop snapserver";
	exec(command, {uid:1000,gid:1000}, function (error, stdout, stderr) {
		if (error !== null) {
			self.commandRouter.pushConsoleMessage('The following error occurred while stopping SnapServer: ' + error);
			self.commandRouter.pushToastMessage('error', "Stopping service failed", "Stopping SnapServer failed with error: " + error);
			defer.reject();
		}
		else {
			self.commandRouter.pushConsoleMessage('SnapServer stopped');
			self.commandRouter.pushToastMessage('success', "Stopping", "Stopped SnapServer.");
			defer.resolve();
		}
	});

	return defer.promise;
};