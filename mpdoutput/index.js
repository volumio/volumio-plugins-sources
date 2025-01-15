'use strict';
//B@lbuze 2025 January

const libQ = require('kew');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');
const mpdPath = '/etc/mpd.conf';
const logPrefix = 'mpdhttpout ---';
module.exports = mpdhttpoutput;

function mpdhttpoutput(context) {
    const self = this;
    self.context = context;
    self.commandRouter = self.context.coreCommand;
    self.logger = self.commandRouter.logger;
};

mpdhttpoutput.prototype.onVolumioStart = function () {
    var self = this;
    var defer = libQ.defer();
    self.configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
    self.getConf(self.configFile);
    defer.resolve();
    return libQ.resolve();

};

mpdhttpoutput.prototype.getConfigurationFiles = function () {
    return ['config.json'];
};

mpdhttpoutput.prototype.onStart = function () {
    var self = this;
    var defer = libQ.defer();

    setTimeout(function () {
        //   self.patchmpd()
        self.monitorVolumio();
    }, 1100);

    this.commandRouter.sharedVars.registerCallback('alsa.outputdevice', this.patchmpd.bind(this));
    this.commandRouter.sharedVars.registerCallback('alsa.outputdevicemixer', this.patchmpd.bind(this));
    this.commandRouter.sharedVars.registerCallback('alsa.device', this.patchmpd.bind(this));


    defer.resolve('OK')
    return defer.promise;
};

mpdhttpoutput.prototype.onStop = function () {
    var self = this;
    var defer = libQ.defer();
    self.commandRouter.executeOnPlugin('music_service', 'mpd', 'restartMpd', '');

    defer.resolve('OK')
    return defer.promise;
};

mpdhttpoutput.prototype.onRestart = function () {
    var self = this;
    var defer = libQ.defer();
    self.patchmpd()

    defer.resolve('OK')
    return defer.promise;
};

mpdhttpoutput.prototype.getI18nFile = function (langCode) {
    const i18nFiles = fs.readdirSync(path.join(__dirname, 'i18n'));
    const langFile = 'strings_' + langCode + '.json';

    // check for i18n file fitting the system language
    if (i18nFiles.some(function (i18nFile) { return i18nFile === langFile; })) {
        return path.join(__dirname, 'i18n', langFile);
    }
    // return default i18n file
    return path.join(__dirname, 'i18n', 'strings_en.json');
}

// Configuration Methods -----------------------------------------------------------------------------
mpdhttpoutput.prototype.getUIConfig = function () {
    var defer = libQ.defer();
    var self = this;

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.getConf(this.configFile);
    self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
        __dirname + '/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function (uiconf) {
            var httpstream = self.config.get('httpstream')
            var value;
            // httpstream section;
            if (!httpstream) {
                uiconf.sections[0].content[0].hidden = true;
                uiconf.sections[0].content[1].hidden = true;
                uiconf.sections[0].content[2].hidden = true;
                uiconf.sections[0].content[3].hidden = true;
                uiconf.sections[0].content[4].hidden = true;
                uiconf.sections[0].content[5].hidden = true;
                uiconf.sections[0].content[6].hidden = true;
                uiconf.sections[0].content[7].hidden = true;
                uiconf.sections[0].content[8].hidden = true;
                uiconf.sections[0].content[9].hidden = true;
            }

            if (httpstream === true) {
                uiconf.sections[0].content.unshift(
                    {
                        "id": "dhttpstream",
                        "element": "button",
                        "label": self.commandRouter.getI18nString('DISABLE_HTTPSTREAM'),
                        "doc": self.commandRouter.getI18nString('DISABLE_HTTPSTREAM_DESC'),
                        "onClick": {
                            "type": "plugin",
                            "endpoint": "audio_interface/mpdoutput",
                            "method": "dhttpstream",
                            "data": []
                        }
                    }
                )
            } else if (httpstream === false) {
                uiconf.sections[0].content.unshift(
                    {
                        "id": "ehttpstream",
                        "element": "button",
                        "label": self.commandRouter.getI18nString('ENABLE_HTTPSTREAM'),
                        "doc": self.commandRouter.getI18nString('ENABLE_HTTPSTREAM_DESC'),
                        "onClick": {
                            "type": "plugin",
                            "endpoint": "audio_interface/mpdoutput",
                            "method": "ehttpstream",
                            "data": []
                        }
                    }
                )
            }

            var servername = self.config.get('servername');
            uiconf.sections[0].content[1].value = servername
            var encoder = self.config.get('encoder');
            uiconf.sections[0].content[2].value.value = encoder
            uiconf.sections[0].content[2].value.label = self.getLabelForSelect(uiconf.sections[0].content[2].options, encoder);
            var bitrate = self.config.get('bitrate');
            uiconf.sections[0].content[3].value.value = bitrate
            uiconf.sections[0].content[3].value.label = self.getLabelForSelect(uiconf.sections[0].content[3].options, bitrate);
            var format = self.config.get('format');
            uiconf.sections[0].content[4].value.value = format
            uiconf.sections[0].content[4].value.label = self.getLabelForSelect(uiconf.sections[0].content[4].options, format);
            var portn = self.config.get('portn');
            uiconf.sections[0].content[5].value = portn
            var httpadd = self.config.get('httpadd');
            uiconf.sections[0].content[6].value = httpadd
            var max_clients = self.config.get('max_clients');
            uiconf.sections[0].content[7].value = max_clients
            var buffer_time = self.config.get('buffer_time');
            uiconf.sections[0].content[8].value = buffer_time
            var outburst_time = self.config.get('outburst_time');
            uiconf.sections[0].content[9].value = outburst_time;



            //Icecast section
            var icestream = self.config.get('icestream')

            if (!icestream) {
                uiconf.sections[1].content[0].hidden = true;
                uiconf.sections[1].content[1].hidden = true;
                uiconf.sections[1].content[2].hidden = true;
                uiconf.sections[1].content[3].hidden = true;
                uiconf.sections[1].content[4].hidden = true;
                uiconf.sections[1].content[5].hidden = true;
                uiconf.sections[1].content[6].hidden = true;
                uiconf.sections[1].content[7].hidden = true;
                uiconf.sections[1].content[8].hidden = true;
                uiconf.sections[1].content[9].hidden = true;
                uiconf.sections[1].content[10].hidden = true;
                uiconf.sections[1].content[11].hidden = true;
                uiconf.sections[1].content[12].hidden = true;
                uiconf.sections[1].content[13].hidden = true;
                uiconf.sections[1].content[14].hidden = true;

            }

            uiconf.sections[1].content[2].hidden = true;


            if (icestream === true) {
                uiconf.sections[1].content.unshift(
                    {
                        "id": "eicestream",
                        "element": "button",
                        "label": self.commandRouter.getI18nString('DISABLE_ICESTREAM'),
                        "doc": self.commandRouter.getI18nString('DISABLE_ICESTREAM_DESC'),
                        "onClick": {
                            "type": "plugin",
                            "endpoint": "audio_interface/mpdoutput",
                            "method": "dicestream",
                            "data": []
                        }
                    }
                )
            } else if (icestream === false) {
                uiconf.sections[1].content.unshift(
                    {
                        "id": "dicestream",
                        "element": "button",
                        "label": self.commandRouter.getI18nString('ENABLE_ICESTREAM'),
                        "doc": self.commandRouter.getI18nString('ENABLE_ICESTREAM_DESC'),
                        "onClick": {
                            "type": "plugin",
                            "endpoint": "audio_interface/mpdoutput",
                            "method": "eicestream",
                            "data": []
                        }
                    }
                )
            }

            var iceservername = self.config.get('iceservername');
            uiconf.sections[1].content[1].value = iceservername
            var icepublishport = self.config.get('icepublishport');
            uiconf.sections[1].content[2].value = icepublishport
            var iceprotocol = self.config.get('iceprotocol');
            uiconf.sections[1].content[3].value.value = iceprotocol
            uiconf.sections[1].content[3].value.label = self.getLabelForSelect(uiconf.sections[1].content[3].options, iceprotocol);
            var icemountp = self.config.get('icemountp');
            uiconf.sections[1].content[4].value = icemountp
            var iceencoder = self.config.get('iceencoder');
            uiconf.sections[1].content[5].value.value = iceencoder
            uiconf.sections[1].content[5].value.label = self.getLabelForSelect(uiconf.sections[1].content[5].options, iceencoder);
            var icebitrate = self.config.get('icebitrate');
            uiconf.sections[1].content[6].value.value = icebitrate
            uiconf.sections[1].content[6].value.label = self.getLabelForSelect(uiconf.sections[1].content[6].options, icebitrate);
            var iceformat = self.config.get('iceformat');
            uiconf.sections[1].content[7].value.value = iceformat
            uiconf.sections[1].content[7].value.label = self.getLabelForSelect(uiconf.sections[1].content[7].options, iceformat);
            var iceuser = self.config.get('iceuser');
            uiconf.sections[1].content[8].value = iceuser
            var icepassword = self.config.get('icepassword');
            uiconf.sections[1].content[9].value = icepassword
            var icestreamname = self.config.get('icestreamname');
            uiconf.sections[1].content[10].value = icestreamname
            var icepublic = self.config.get('icepublic');
            uiconf.sections[1].content[11].value.value = icepublic
            uiconf.sections[1].content[11].value.label = self.getLabelForSelect(uiconf.sections[1].content[11].options, icepublic);
            var iceadd = self.config.get('iceadd');
            uiconf.sections[1].content[12].value = iceadd
            var icedescription = self.config.get('icedescription');
            uiconf.sections[1].content[13].value = icedescription
            var icegenre = self.config.get('icegenre');
            uiconf.sections[1].content[14].value = icegenre
            var iceurl = self.config.get('iceurl');
            uiconf.sections[1].content[15].value = iceurl
            //---End sections

            defer.resolve(uiconf);
        })
        .fail(function (e) {
            self.logger.info('Error: ' + e);
            defer.reject(new Error());
        });

    return defer.promise;
};

mpdhttpoutput.prototype.monitorVolumio = function () {
    const self = this;

    // Define the log entry to monitor
    const LOG_ENTRY = 'info: BOOT COMPLETED';

    // Spawn the journalctl process
    const journalctl = spawn('journalctl', ['-f']);

    // Create an interface to read the output line by line
    const rl = readline.createInterface({
        input: journalctl.stdout,
        terminal: false
    });

    // Listen for each line of output
    rl.on('line', (line) => {
        if (line.includes(LOG_ENTRY)) {
            self.logger.info(logPrefix + 'Boot completed detected! Patching mpd now!');
            // Replace the following line with the action you want to trigger
            this.patchmpd();

            // Close the readline interface and kill the journalctl process
            rl.close();
            journalctl.kill();
        }
    });
};

mpdhttpoutput.prototype.getVolumioState = function () {
    const self = this;
    var defer = libQ.defer();
    let state = self.commandRouter.volumioGetState();
    if (state.status != "pause") {
        self.commandRouter.volumioPause();
    }
    self.logger.info(logPrefix + ' Volumio set on pause')
    defer.resolve();
    return defer.promise;
};

mpdhttpoutput.prototype.ehttpstream = function () {
    const self = this;
    self.config.set('httpstream', true)
    self.logger.info(logPrefix + "TRUE");
    self.patchmpd();
    self.refreshUI();

};

mpdhttpoutput.prototype.dhttpstream = function () {
    const self = this;
    self.config.set('httpstream', false)
    self.logger.info(logPrefix + "FALSE");
    self.refreshUI();
    self.patchmpd();

};

mpdhttpoutput.prototype.eicestream = function () {
    const self = this;
    self.config.set('icestream', true)
    self.logger.info(logPrefix + "TRUE");
    self.refreshUI();
    self.patchmpd();

};

mpdhttpoutput.prototype.dicestream = function () {
    const self = this;
    self.config.set('icestream', false)
    self.logger.info(logPrefix + "FALSE");
    self.refreshUI();
    self.patchmpd();

};

mpdhttpoutput.prototype.refreshUI = function () {
    const self = this;
    setTimeout(function () {
        var respconfig = self.commandRouter.getUIConfigOnPlugin('audio_interface', 'mpdoutput', {});
        respconfig.then(function (config) {
            self.commandRouter.broadcastMessage('pushUiConfig', config);
        });
        // self.commandRouter.closeModals();
    }, 1100);
}

mpdhttpoutput.prototype.getLabelForSelect = function (options, key) {
    var n = options.length;
    for (var i = 0; i < n; i++) {
        if (options[i].value === key) { return options[i].label; }
    }
    return 'VALUE NOT FOUND BETWEEN SELECT OPTIONS!';
};

mpdhttpoutput.prototype.setUIConfig = function (data) {
    var self = this;
    var defer = libQ.defer();
    var uiconf = fs.readJsonSync(__dirname + '/UIConfig.json');
    return libQ.resolve();
};

mpdhttpoutput.prototype.getConf = function (configFile) {
    var self = this;
    self.config = new (require('v-conf'))();
    self.config.loadFile(configFile);
};

mpdhttpoutput.prototype.setConf = function (conf) {
    var self = this;
    fs.writeJsonSync(self.configFile, JSON.stringify(conf));
};

mpdhttpoutput.prototype.updateConfig = function (data) {
    var self = this;
    var defer = libQ.defer();
    if (data['servername'] === self.config.get("icestreamname")) {
        self.commandRouter.pushToastMessage('error', "Port for Httpd and Icecast must be different!");
        defer.reject(new Error("Port for Httpd and Icecast must be different!"));
        return defer.promise;
    };

    if (data['portn'] === self.config.get("icepublishport")) {
        self.commandRouter.pushToastMessage('error', "Httpd stream name and Icecast stream name must be different!");
        defer.reject(new Error("Name for Httpd stream and Icecast stream name must be different!"));
        return defer.promise;
    };
    // Set the configuration values
    self.config.set('servername', data['servername']);
    self.config.set('encoder', data['encoder'].value);
    self.config.set('bitrate', data['bitrate'].value);
    self.config.set('format', data['format'].value);
    self.config.set('portn', data['portn']);
    self.config.set('max_clients', data['max_clients']);
    self.config.set('buffer_time', data['buffer_time']);
    self.config.set('outburst_time', data['outburst_time']);
    self.config.set('always_on', 'yes');
    self.config.set('httpadd', data['httpadd']);
    self.logger.info(logPrefix + 'Received data for http:', data);

    self.patchmpd()
        .then(function () {
            defer.resolve();
        })
        .fail(function (err) {
            defer.reject(new Error('Failed to update MPD configuration: ' + err));
        });

    return defer.promise;
};


mpdhttpoutput.prototype.updateConfigIce = function (data) {
    var self = this;
    var defer = libQ.defer();
    if (data['icestreamname'] === self.config.get("servername")) {
        self.commandRouter.pushToastMessage('error', "Port for Httpd and Icecast must be different!");
        defer.reject(new Error("Port for Httpd and Icecast must be different!"));
        return defer.promise;
    };

    if (data['icepublishport'] === self.config.get("portn")) {
        self.commandRouter.pushToastMessage('error', "Httpd stream name and Icecast stream name must be different!");
        defer.reject(new Error("Name for Httpd stream and Icecast stream name must be different!"));
        return defer.promise;
    };
    // Set the configuration values

    self.config.set('iceservername', data['iceservername']);
    self.config.set('icepublishport', data['icepublishport']);
    self.config.set('iceprotocol', data['iceprotocol'].value);
    self.config.set('icemountp', data['icemountp']);
    self.config.set('iceencoder', data['iceencoder'].value);
    self.config.set('icebitrate', data['icebitrate'].value);
    self.config.set('iceformat', data['iceformat'].value);
    self.config.set('iceuser', data['iceuser']);
    self.config.set('icepassword', data['icepassword']);
    self.config.set('icestreamname', data['icestreamname']);
    self.config.set('icepublic', data['icepublic'].value);
    self.config.set('iceadd', data['iceadd']);
    self.config.set('icedescription', data['icedescription']);
    self.config.set('icegenre', data['icegenre']);
    self.config.set('iceurl', data['iceurl']);
    self.logger.info(logPrefix + 'Received data for icecast:', data);

    self.patchmpd()
        .then(function () {
            defer.resolve();
        })
        .fail(function (err) {
            defer.reject(new Error('Failed to update MPD configuration: ' + err));
        });

    return defer.promise;
};

mpdhttpoutput.prototype.patchmpd = function () {
    var self = this;
    var defer = libQ.defer();
    let Config;
    let configRegex;

    // http config
    var shttpstream = self.config.get("httpstream");
    var sname = self.config.get("servername");
    var sencoder = self.config.get("encoder");
    var sbitrate = self.config.get("bitrate") * 1000;
    var sformat = self.config.get("format");
    var sportn = self.config.get("portn");
    var shttpadd = self.config.get("httpadd");
    var smax_clients = self.config.get("max_clients");
    var sbuffer_time = self.config.get("buffer_time");
    var soutburst_time = self.config.get("outburst_time");
    var salways_on = self.config.get("always_on");

    // icecast config
    var sicestream = self.config.get("icestream");
    var siceservername = self.config.get("iceservername");
    var siceprotocol = self.config.get("iceprotocol");
    var siceencoder = self.config.get("iceencoder");
    var sicebitrate = self.config.get("icebitrate") * 1000;
    var siceformat = self.config.get("iceformat");
    var sicemountp = self.config.get("icemountp");
    var siceuser = self.config.get("iceuser");
    var siceurl = self.config.get("iceurl");
    var sicepassword = self.config.get("icepassword");
    var sicestreamname = self.config.get("icestreamname");
    var sicepublicport = self.config.get("icepublishport");
    var siceadd = self.config.get("iceadd");
    var sicedescription = self.config.get("icedescription");
    var sicegenre = self.config.get("icegenre");
    var sicepublic = self.config.get("icepublic");

    const prefix = `######Begin Mpdoutput conf
`;
    const suffix = `######End Mpdoutput conf
`;


    if (shttpstream) {
        if (shttpadd) {
            if (smax_clients !== '') {
                smax_clients = "max_clients     \"" + smax_clients + "\"";
            }
            if (sbuffer_time !== '') {
                sbuffer_time = "buffer_time     \"" + sbuffer_time + "\"";
            }
            if (soutburst_time !== '') {
                soutburst_time = "outburst_time   \"" + soutburst_time + "\"";
            }
            if (salways_on) {
                salways_on = "always_on    \"yes\"";
            }
        }
        if (!shttpadd) {
            var smax_clients = '';
            var sbuffer_time = '';
            var soutburst_time = '';
        }

        var Config1 = `
# Config audio HTTP output
audio_output {
    type            "httpd"
    name            "${sname}"
    encoder         "${sencoder}"                # "lame " or "vorbis" or "opus"
    port            "${sportn}"
    bitrate         "${sbitrate}"                   # do not define if quality is d$
    format          "${sformat}"
    ${smax_clients}         # Maximum number of simultaneous clients
    ${sbuffer_time}         # Buffer time in milliseconds (optional)
    ${soutburst_time}         # Outburst time in milliseconds (optional)
    always_on "yes"
    tags "yes"
}

`;
        Config = Config1;
    }
    if (sicestream) {
        if (siceadd) {
            if (sicegenre !== '') {
                sicegenre = "genre     \"" + sicegenre + "\"";
            }
            if (sicedescription !== '') {
                sicedescription = "description     \"" + sicedescription + "\"";
            }
            if (siceurl !== '') {
                siceurl = "url   \"" + siceurl + "\"";
            }
        }
        if (!siceadd) {
            var sicegenre = '';
            var sicedescription = '';
            var siceurl = '';
        }

        var Config2 = `
# Config audio Icecast output
audio_output {
    type            "shout"
    host            "${siceservername}"
    protocol        "${siceprotocol}"
    encoder         "${siceencoder}"                # "lame " or "vorbis" or "opus"
    port            "${sicepublicport}"
    mount           "${sicemountp}"
    bitrate         "${sicebitrate}"                   # do not define if quality is d$
    format          "${siceformat}"
    password        "${sicepassword}"
    user            "${siceuser}"        # Icecast source username (default is "source")
    name            "${sicestreamname}"
    public          "${sicepublic}"            # Advertise the stream publicly
    ${sicedescription}                        # Stream description
    ${sicegenre}                        # Stream genre
    ${siceurl}
    #metadata_charset "UTF-8"          # Charset for stream metadata
}

`;
        Config = `${Config2}`;
    }

    if (shttpstream && sicestream) {
        Config = `${Config1} ${Config2}`;
    }

    if (!shttpstream && !sicestream) {
        self.commandRouter.pushToastMessage('error', 'Nothing to do! Enable at least one stream!');
        Config = '';

    }

    const rConfig = `${prefix}${Config}${suffix}`;

    // Read the mpd.conf file
    fs.readFile(mpdPath, 'utf8', (err, fileData) => {
        if (err) {
            self.logger.error(logPrefix + 'Error reading mpd.conf file:', err);
            defer.resolve();
            return;
        }

        // Escape special characters in prefix and suffix
        const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Create the regular expression using the RegExp constructor
        configRegex = new RegExp(`${escapedPrefix}[\\s\\S]*${escapedSuffix}`);

        // Check if the configuration already exists
        if (configRegex.test(fileData)) {
            // Replace the existing configuration
            const newData = fileData.replace(configRegex, rConfig);

            // Write the modifications to the mpd.conf file
            fs.writeFile(mpdPath, newData, 'utf8', (err) => {
                if (err) {
                    self.logger.error('Error writing to mpd.conf file:', err);
                    defer.reject(err);
                    return;
                }
                self.logger.info(logPrefix + 'Configuration successfully replaced in mpd.conf.');
                self.getVolumioState();
                setTimeout(function () {
                    self.commandRouter.executeOnPlugin('music_service', 'mpd', 'restartMpd', '');
                    self.commandRouter.pushToastMessage('success', self.commandRouter.getI18nString('PATCHMPD_OK'));
                    defer.resolve(); // Resolve the promise after the timeout
                }, 2100);
            });
        } else {
            // Add the configuration to the file
            const newData = fileData + rConfig;

            // Write the modifications to the mpd.conf file
            fs.writeFile(mpdPath, newData, 'utf8', (err) => {
                if (err) {
                    self.logger.error(logPrefix + 'Error writing to mpd.conf file:', err);
                    defer.reject(err);
                    return;
                }
                self.getVolumioState();
                self.logger.info(logPrefix + 'Configuration successfully added to mpd.conf.');
                setTimeout(function () {
                    self.commandRouter.executeOnPlugin('music_service', 'mpd', 'restartMpd', '');
                    self.commandRouter.pushToastMessage('success', self.commandRouter.getI18nString('PATCHMPD_OK'));
                    defer.resolve(); // Resolve the promise after the timeout
                }, 2100);
            });
        }
    });

    return defer.promise;
};