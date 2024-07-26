'use strict';
/*By balbuze May 2024
*/
var fs = require('fs-extra');
var libFsExtra = require('fs-extra');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var libQ = require('kew');
//const { setFlagsFromString } = require('v8');
//var config = new (require('v-conf'))();
const io = require('socket.io-client');
const path = require('path');
const { basename } = require('path');
const spectrumspath = "INTERNAL/PeppySpectrum/Templates/";
const logPrefix = "PeppySpectrum ---"

// Define the peppyspectrum class
module.exports = peppyspectrum;

function peppyspectrum(context) {
    const self = this;
    self.context = context;
    self.commandRouter = self.context.coreCommand;
    self.logger = self.commandRouter.logger;
    this.context = context;
    this.commandRouter = this.context.coreCommand;
    this.logger = this.context.logger;
    this.configManager = this.context.configManager;
};

peppyspectrum.prototype.onVolumioStart = function () {
    const self = this;
    var configFile = self.commandRouter.pluginManager.getConfigurationFile(self.context, 'config.json');
    self.config = new (require('v-conf'))();
    self.config.loadFile(configFile);
    return libQ.resolve();
};

peppyspectrum.prototype.getConfigurationFiles = function () {
    return ['config.json'];
};

peppyspectrum.prototype.getI18nFile = function (langCode) {
    const i18nFiles = fs.readdirSync(path.join(__dirname, 'i18n'));
    const langFile = 'strings_' + langCode + '.json';

    // check for i18n file fitting the system language
    if (i18nFiles.some(function (i18nFile) { return i18nFile === langFile; })) {
        return path.join(__dirname, 'i18n', langFile);
    }
    // return default i18n file
    return path.join(__dirname, 'i18n', 'strings_en.json');
}
// Plugin methods -----------------------------------------------------------------------------

peppyspectrum.prototype.onStop = function () {
    const self = this;
    let defer = libQ.defer();
    self.logger.info("Stopping peppyspectrum service");
    self.commandRouter.stateMachine.stop().then(function () {
        exec("/usr/bin/sudo /bin/systemctl stop peppyspectrum.service", {
            uid: 1000,
            gid: 1000
        }, function (error, stdout, stderr) { })
        self.socket.off();
    });
    defer.resolve();
    return libQ.resolve();
};

peppyspectrum.prototype.onStart = function () {
    var self = this;
    var defer = libQ.defer();
    self.socket = io.connect('http://localhost:3000');

    // self.modprobedummy()
    self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'updateALSAConfigFile')

        .then(function (e) {
            var pipeDefer = libQ.defer();
            exec("/usr/bin/mkfifo /tmp/peppy_spectrum_fifo" + "; /bin/chmod 666 /tmp/peppy_spectrum_fifo", { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
                if (error) {
                    self.logger.warn("An error occurred when creating myfifosapeppy", error);
                }
                pipeDefer.resolve();
            });

            return Defer.promise;
        });
    defer.resolve();
    setTimeout(function () {
        self.checkIfPlay()

        // self.startpeppyservice()
    }, 2000);
    self.commandRouter.pushToastMessage('success', 'Starting peppyspectrum');
    return defer.promise;
};


//here we load snd-dummy module
peppyspectrum.prototype.modprobedummy = function () {
    const self = this;
    let defer = libQ.defer();
    //self.hwinfo();
    try {
        execSync("/usr/bin/sudo /sbin/modprobe snd-dummy index=6 pcm_substreams=1", {
            uid: 1000,
            gid: 1000
        });
        self.commandRouter.pushConsoleMessage('snd-dummy loaded');
        defer.resolve();
    } catch (err) {
        self.logger.info(logPrefix + 'failed to load snd-dummy' + err);
    }
};


peppyspectrum.prototype.startpeppyservice = function () {
    const self = this;
    let defer = libQ.defer();

    exec("/usr/bin/sudo /bin/systemctl start peppyspectrum.service", {
        uid: 1000,
        gid: 1000
    }, function (error, stdout, stderr) {
        if (error) {
            self.logger.info(logPrefix + 'peppyspectrum failed to start. Check your configuration ' + error);
        } else {
            self.commandRouter.pushConsoleMessage('peppyspectrum Daemon Started');

            defer.resolve();
        }
    });
};

peppyspectrum.prototype.restartpeppyservice = function () {
    const self = this;
    let defer = libQ.defer();
    exec("/usr/bin/sudo /bin/systemctl restart peppyspectrum.service", {
        uid: 1000,
        gid: 1000
    }, function (error, stdout, stderr) {
        if (error) {
            self.logger.info(logPrefix + 'peppyspectrum failed to start. Check your configuration ' + error);
        } else {
            self.commandRouter.pushConsoleMessage('peppyspectrum Daemon Started');

            defer.resolve();
        }
    });
};

peppyspectrum.prototype.stopeppyservice = function () {
    const self = this;
    let defer = libQ.defer();

    exec("/usr/bin/sudo /bin/systemctl stop peppyspectrum.service", {
        uid: 1000,
        gid: 1000
    }, function (error, stdout, stderr) {
        if (error) {
            self.logger.info(logPrefix + 'peppyspectrum failed to stop!! ' + error);
        } else {
            self.commandRouter.pushConsoleMessage('peppyspectrum Daemon Stop');

            defer.resolve();
        }
    });
};


peppyspectrum.prototype.onRestart = function () {
    const self = this;
};

peppyspectrum.prototype.onInstall = function () {
    const self = this;
    //	//Perform your installation tasks here
};

peppyspectrum.prototype.onUninstall = function () {
    const self = this;
    //Perform your installation tasks here
};

peppyspectrum.prototype.checkIfPlay = function () {
    const self = this;
    self.socket.on('pushState', function (data) {
        self.logger.info(logPrefix + 'peppyspectrum status ' + data.status);

        if (data.status === "play") {
            self.startpeppyservice()
        } else if ((data.status === "pause") || (data.status === "stop")) {
            self.stopeppyservice()
        }
    })
};



peppyspectrum.prototype.getUIConfig = function () {
    const self = this;
    const defer = libQ.defer();
    var lang_code = this.commandRouter.sharedVars.get('language_code');
    self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
        __dirname + '/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function (uiconf) {
            let spectrumfolder;
            var showsize = self.config.get("showsize")
            var autosize = self.config.get("auutosize")

            var valuescreen = self.config.get('screensize');
            self.configManager.setUIConfigParam(uiconf, 'sections[0].content[0].value.value', valuescreen);
            self.configManager.setUIConfigParam(uiconf, 'sections[0].content[0].value.label', valuescreen);


            const directoryPath = '/data/INTERNAL/PeppySpectrum/Templates/';

            // Use a Promise for asynchronous operations
            function readDirectory() {
                return new Promise((resolve, reject) => {
                    fs.readdir(directoryPath, (err, files) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        const folders = files.filter(file => fs.statSync(`${directoryPath}/${file}`).isDirectory());
                        resolve(folders);
                    });
                });
            }

            // Call the function
            readDirectory()
                .then(folders => {
                    //   console.log('Folders in the directory:', folders);

                    let allfolder = '320x240,480x320,800x480,1280x400,' + folders;
                    //   self.logger.info('list is ' + allfilter)
                    var litems = allfolder.split(',');

                    for (let a in litems) {
                        //    console.log('Text between brackets:', litems[a]);

                        self.configManager.pushUIConfigParam(uiconf, 'sections[0].content[0].options', {
                            value: litems[a],
                            label: litems[a]
                        });

                    }

                })


                .catch(err => console.error('Error reading directory:', err));

            uiconf.sections[1].content[1].hidden = true;
            uiconf.sections[1].content[2].hidden = true;
            uiconf.sections[1].content[3].hidden = true;

            var screenwidth = self.config.get('screenwidth')
            uiconf.sections[1].content[1].value = screenwidth;
            uiconf.sections[1].content[1].attributes = [
                {
                    placeholder: screenwidth,
                    min: 0,
                    max: 3500
                }
            ];


            var screenheight = self.config.get('screenheight')
            uiconf.sections[1].content[2].value = screenheight;
            uiconf.sections[1].content[2].attributes = [
                {
                    placeholder: screenheight,
                    min: 0,
                    max: 3500
                }
            ];


            var valuespectrum;
            valuespectrum = self.config.get('spectrum');
            self.configManager.setUIConfigParam(uiconf, 'sections[1].content[0].value.value', valuespectrum);
            self.configManager.setUIConfigParam(uiconf, 'sections[1].content[0].value.label', valuespectrum);

            try {
                if ((valuescreen == '320x240') || (valuescreen == '480x320') || (valuescreen == '800x480') || (valuescreen == '1280x400')) {
                    spectrumfolder = '/data/plugins/user_interface/peppyspectrum/PeppySpectrum/'
                } else {
                    spectrumfolder = '/data/INTERNAL/PeppySpectrum/Templates/'
                }

                fs.readFile(spectrumfolder + valuescreen + '/spectrum.txt', function (err, idata) {
                    if (err) {
                        console.error('Error reading the file:', err);
                        self.configManager.pushUIConfigParam(uiconf, 'sections[1].content[0].options', {
                            value: 'no config!',
                            label: 'no config!'
                        });
                        //   return defer.reject(err); // Reject the promise in case of an error
                    }

                    const regex = /\[(.*?)\]/g;
                    let match;
                    const matches = [];
                    while ((match = regex.exec(idata)) !== null) {
                        matches.push(match[1]);
                    }
                    let allfilter = 'Random,' + matches;
                    self.logger.info(logPrefix + 'list is ' + allfilter)
                    var litems = allfilter.split(',');

                    for (let a in litems) {
                        // console.log('Text between brackets:', litems[a]);

                        self.configManager.pushUIConfigParam(uiconf, 'sections[1].content[0].options', {
                            value: litems[a],
                            label: litems[a]
                        });
                    }
                    uiconf.sections[2].content[0].value = self.config.get('debuglog');
                    uiconf.sections[2].hidden = true;



                    //-----------section 4---------
                    var value = self.config.get('zipfile');
                    self.configManager.setUIConfigParam(uiconf, 'sections[3].content[0].value.value', value);
                    self.configManager.setUIConfigParam(uiconf, 'sections[3].content[0].value.label', value);


                    try {
                        let listf = fs.readFileSync('/data/plugins/user_interface/peppyspectrum/spectrumslist.txt', "utf8");
                        var result = (listf.split('\n'));
                        let i;
                        for (i = 0; i < result.length; i++) {
                            var preparedresult = result[i].split(".")[0];
                            self.logger.info(logPrefix + preparedresult)

                            self.configManager.pushUIConfigParam(uiconf, 'sections[3].content[0].options', {
                                value: preparedresult,
                                label: i + 1 + ' ' + preparedresult
                            });
                        }


                    } catch (err) {
                        self.logger.error(logPrefix + ' failed to read downloadedlist.txt' + err);
                    }

                    // Resolve the promise after the file reading and processing are complete
                    defer.resolve(uiconf);
                });
            } catch (e) {
                self.logger.error(logPrefix+'Cannot read file: ' + e);
                defer.reject(e); // Reject the promise in case of an error
            }
        })
        .fail(function () {
            defer.reject(new Error());
        });
    return defer.promise;
};


peppyspectrum.prototype.getAdditionalConf = function (type, controller, data) {
    const self = this;
    return self.commandRouter.executeOnPlugin(type, controller, 'getConfigParam', data);
}

peppyspectrum.prototype.refreshUI = function () {
    const self = this;

    setTimeout(function () {
        var respconfig = self.commandRouter.getUIConfigOnPlugin('user_interface', 'peppyspectrum', {});
        respconfig.then(function (config) {
            self.commandRouter.broadcastMessage('pushUiConfig', config);
        });
        self.commandRouter.closeModals();
    }, 100);
}

peppyspectrum.prototype.getLabelForSelect = function (options, key) {
    var n = options.length;
    for (var i = 0; i < n; i++) {
        if (options[i].value == key)
            return options[i].label;
    }
    return 'VALUE NOT FOUND BETWEEN SELECT OPTIONS!';
};

peppyspectrum.prototype.savepeppy = function (data) {
    const self = this;

    const defer = libQ.defer();
    function hasOpeningParenthesis(screensize) {
        return screensize.includes('x');
    }
    var screensize = (data['screensize'].value);

    var screenwidth// = data["screenwidth"]
    var screenheight// = data["screenheight"]
    var myNumberx
    var myNumbery
    var mySpectrumSize
    let autovalue
    // var spectrumsize=self.config.get('spectrumsize')
    var spectrumsizef

    if (hasOpeningParenthesis(screensize)) {

        autovalue = screensize.split('x')//.slice(0, 3)

        console.log('aaaaaaaaaaa ' + autovalue)
        self.logger.info(logPrefix + autovalue[0] + autovalue[1])// + autovalue[2])


    } else {
        myNumberx = '';
        myNumbery = '';
        spectrumsizef = 30

    }
    if ((screensize === '320x240') || (screensize === '480x320') || (screensize === '800x480') || (screensize === '1280x400')) {
        myNumberx = '';
        myNumbery = '';
        spectrumsizef = 30
    } else {

        var sizef = autovalue[0]

        var size = sizef//.slice(0, -1)
        // Split the string by comma and convert each element to integer
        var sizen = sizef.split(',').map(function (value) {
            return parseInt(value, 10);
        });

        // Extract width and height (assuming valid format)
        screenwidth = parseInt(autovalue[0], 10);
        screenheight = parseInt(autovalue[1].split('+')[0], 10); // Extract height before '+'

        // Extract the value after '+' (assuming it's 34)
        spectrumsizef = parseInt(autovalue[1].split('+')[1], 10);

        //screenwidth = autovalue[0]
        //screenheight = autovalue[1].split('+').split("-")[0]
        //spectrumsizef = autovalue[2].split('-')[0]
        self.logger.info(logPrefix + screenwidth + screenheight + spectrumsizef)
        myNumberx = parseInt(screenwidth, 10);
        myNumbery = parseInt(screenheight, 10);
        mySpectrumSize = parseInt(spectrumsizef, 10);

        var truex = (typeof myNumberx === 'number' && isFinite(myNumberx))
        var truey = (typeof myNumbery === 'number' && isFinite(myNumbery))
        var trues = (typeof mySpectrumSize === 'number' && isFinite(mySpectrumSize))

        if (truex && truey && trues) {
            // console.log('The variable is a finite number.' + myNumberx + " " + myNumbery + " " + mySpectrumSize);
        } else if (((!truex && !truey && !trues)) || (size == undefined)) {
          //  console.log('The variable is not a finite number.');
            self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('SPECTRUM_FOLDER_NAME'));
            myNumberx = '480'
            myNumbery = '240'
            spectrumsizef = 30;
        }
    }
    if (isNaN(spectrumsizef)) {
        spectrumsizef = 30;
    }

    self.config.set('screensize', screensize);
    self.config.set('spectrum', 'Random');
    self.config.set('screenwidth', myNumberx);
    self.config.set('screenheight', myNumbery);

    var storedspectrumsize = self.config.get("spectrumsize")
    //  mySpectrumsize = self.config.get("spectrumsize")

    //console.log("spectrumsizef " + typeof parseInt(spectrumsizef, 10) + "  storedspectrumsize " + typeof storedspectrumsize)
    if (parseInt(spectrumsizef, 10) !== storedspectrumsize) {

        if (spectrumsizef == undefined) {
            spectrumsizef = 30
            self.config.set('spectrumsize', mySpectrumSize)
        }
        self.commandRouter.pushToastMessage('success', self.commandRouter.getI18nString('NBARCHANGE') + spectrumsizef);

        setTimeout(function () {
            self.updateasound()
            //  .then(function (updateasound) {
        }, 2000);
        self.config.set('spectrumsize', spectrumsizef);

        //})
    }

    //self.savepeppyconfig();
    //self.restartpeppyservice()
    self.refreshUI()
        .then(function (e) {
            self.commandRouter.pushToastMessage('success', "peppyspectrum Configuration updated");
            defer.resolve({});
        })
        .fail(function (e) {
            defer.reject(new Error('error'));
            self.commandRouter.pushToastMessage('error', "failed to start. Check your config !");
        })
    return defer.promise;

};


peppyspectrum.prototype.savepeppy1 = function (data) {
    const self = this;

    const defer = libQ.defer();
    self.config.set('spectrum', data['spectrum'].value);

    self.savepeppyconfig();
    self.restartpeppyservice()
        .then(function (e) {
            self.commandRouter.pushToastMessage('success', "peppyspectrum Configuration updated");
            defer.resolve({});
        })
        .fail(function (e) {
            defer.reject(new Error('error'));
            self.commandRouter.pushToastMessage('error', "failed to start. Check your config !");
        })
    return defer.promise;

};


peppyspectrum.prototype.savepeppy2 = function (data) {
    const self = this;

    const defer = libQ.defer();

    self.config.set('debuglog', data['debuglog']);

    self.savepeppyconfig();
    self.restartpeppyservice()

        .then(function (e) {
            self.commandRouter.pushToastMessage('success', "peppyspectrum Configuration for debug log updated");
            defer.resolve({});
        })
        .fail(function (e) {
            defer.reject(new Error('error'));
            self.commandRouter.pushToastMessage('error', "failed to start. Check your config !");
        })
    return defer.promise;

};


//here we save the asound.conf file config
peppyspectrum.prototype.buildasound = function () {
    const self = this;

    const defer = libQ.defer();
    var spectrumsize = self.config.get("spectrumsize")
    try {

        fs.readFile(__dirname + "/peppy_in.peppy_out.6.conf.tmpl", 'utf8', function (err, data) {
            if (err) {
                defer.reject(new Error(err));
                return console.log(err);
            }

            const conf1 = data.replace("${spectrumsize}", spectrumsize)

            fs.writeFile("/data/plugins/user_interface/peppyspectrum/asound/peppy_in.peppy_out.6.conf", conf1, 'utf8', function (err) {
                if (err)
                    defer.reject(new Error(err));
                else defer.resolve();
            });

        });
        //   self.refreshUI()

    } catch (err) {

    }
    return defer.promise;
};

peppyspectrum.prototype.updateasound = function () {
    var self = this;
    var defer = libQ.defer();
    //self.socket.emit('pause')

    self.buildasound()
        .then(function () {
            return self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'updateALSAConfigFile');
        }).then(function () {
            self.commandRouter.pushToastMessage('success', 'spectrum size applied');
            defer.resolve();
        }).fail(function () {
            self.commandRouter.pushToastMessage('error', 'a problem occurred');
            defer.reject();
        });

    return defer.promise;

};

peppyspectrum.prototype.savepeppyconfig = function () {
    const self = this;

    const defer = libQ.defer();
    try {

        fs.readFile(__dirname + "/config.txt.tmpl", 'utf8', function (err, data) {
            if (err) {
                defer.reject(new Error(err));
                return console.log(err);
            }
            var autosize = self.config.get('autosize')

            var screensize = self.config.get('screensize')
            if ((screensize == '320x240') || (screensize == '480x320') || (screensize == '800x480') || (screensize == '1280x400')) {
                var screenwidth = self.config.get("screenwidth")
                var screenheight = self.config.get("screenheight")
                var basefolder = ''

            } else {
                screensize = (/*µ'/data/INTERNAL/PeppySpectrum/Templates/' +*/ self.config.get("screensize"))
                screenwidth = self.config.get("screenwidth")
                screenheight = self.config.get("screenheight")
                basefolder = ('/data/INTERNAL/PeppySpectrum/Templates')
            }


            var spectrum = self.config.get('spectrum')
            if (spectrum == 'Random') {
                spectrum = ''
            }

            var spectrumsize = self.config.get("spectrumsize")

            var debuglog = self.config.get('debuglog')
            if (debuglog) {
                var debuglogd = 'True'
            }
            else if (debuglogd = 'False');

            self.logger.info(logPrefix + "--------------------spectrum" + spectrum)
            self.logger.info(logPrefix + "--------------------$basefolder" + basefolder)
            self.logger.info(logPrefix + "--------------------screensize" + screensize)
            self.logger.info(logPrefix + "--------------------screenwidth" + screenwidth)
            self.logger.info(logPrefix + "--------------------screenheight" + screenheight)
            self.logger.info(logPrefix + "--------------------spectrumsize" + spectrumsize)

            const conf1 = data.replace("${spectrum}", spectrum)
                .replace("${basefolder}", basefolder)
                .replace("${screensize}", screensize)
                .replace("${screenwidth}", screenwidth)
                .replace("${screenheight}", screenheight)
                .replace("${spectrumsize}", spectrumsize)
                .replace("${debuglog}", debuglogd)


            fs.writeFile("/data/plugins/user_interface/peppyspectrum/PeppySpectrum/config.txt", conf1, 'utf8', function (err) {
                if (err)

                    defer.reject(new Error(err));
                else defer.resolve();
                self.logger.error(logPrefix+"Error writing config " + err);

            });

        });
        self.refreshUI()

    } catch (err) {

    }
    return defer.promise;
};

peppyspectrum.prototype.dlspectrum = function (data) {
    const self = this;
    let zipfile = data["zipfile"].value// + ".zip"
    ///self.config.set('debuglog', data['debuglog']);


    return new Promise(function (resolve, reject) {
        try {
            let modalData = {
                title: self.commandRouter.getI18nString('SPECTRUM_INSTALL_TITLE'),
                message: self.commandRouter.getI18nString('SPECTRUM_INSTALL_WAIT'),
                size: 'lg'
            };
            //self.commandRouter.pushToastMessage('info', 'Please wait while installing ( up to 30 seconds)');
            self.commandRouter.broadcastMessage("openModal", modalData);

            let cp3 = execSync('/usr/bin/wget -P /tmp https://github.com/balbuze/Spectrum-peppyspectrum/raw/main/Zipped-folders/' + zipfile + '.zip');
          //  let cp9 = execSync('sudo chmod -R 766 /data/' + spectrumspath)
           // let cp5 = execSync('miniunzip -o /tmp/' + zipfile + '.zip -d /data/' + spectrumspath);
            let cp5 = execSync('miniunzip -o /tmp/' + zipfile + '.zip -d /data/' + spectrumspath+' && sudo chmod -R 777 /data/' + spectrumspath);

            self.logger.info(logPrefix + 'message miniunzip -o /tmp/' + zipfile + '.zip -d /data/' + spectrumspath);


            self.refreshUI();

        } catch (err) {
            self.logger.error(logPrefix + ' An error occurs while downloading or installing Spectrums');
            self.commandRouter.pushToastMessage('error', 'An error occurs while downloading or installing Spectrum');
        }
      //  self.config.set('zipfile', zipfile);
      let cp6 = execSync('/bin/rm /tmp/' + zipfile + '.zip*');
        resolve();
    });
};

peppyspectrum.prototype.updatelist = function (data) {
    const self = this;
    let path = 'https://github.com/balbuze/Spectrum-peppyspectrum/raw/main';
    let name = 'spectrumslist.txt';
    let defer = libQ.defer();
    var destpath = ' \'/data/plugins/user_interface/peppyspectrum';
    // self.config.set('importeq', namepath)
    var toDownload = (path + '/' + name + '\'');
    self.logger.info(logPrefix + ' wget \'' + toDownload)
    try {
        execSync("/usr/bin/wget \'" + toDownload + " -O" + destpath + "/spectrumslist.txt\'", {
            uid: 1000,
            gid: 1000
        });
        self.commandRouter.pushToastMessage('info', self.commandRouter.getI18nString('LIST_SUCCESS_UPDATED'))
        self.refreshUI();
        defer.resolve();
    } catch (err) {
        self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('LIST_FAIL_UPDATE'))
        self.logger.error(logPrefix + ' failed to  download file ' + err);
    }
    return defer.promise;
}

peppyspectrum.prototype.setUIConfig = function (data) {
    const self = this;

};

peppyspectrum.prototype.getConf = function (varName) {
    const self = this;
    //Perform your installation tasks here
};


peppyspectrum.prototype.setConf = function (varName, varValue) {
    const self = this;
};
