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
const meterspath = "INTERNAL/PeppyMeterBasic/Templates/";
const logPrefix = "PeppyMeterBasic ---"

// Define the peppymeterbasic class
module.exports = peppymeterbasic;

function peppymeterbasic(context) {
    const self = this;
    self.context = context;
    self.commandRouter = self.context.coreCommand;
    self.logger = self.commandRouter.logger;
    this.context = context;
    this.commandRouter = this.context.coreCommand;
    this.logger = this.context.logger;
    this.configManager = this.context.configManager;
};

peppymeterbasic.prototype.onVolumioStart = function () {
    const self = this;
    var configFile = self.commandRouter.pluginManager.getConfigurationFile(self.context, 'config.json');
    self.config = new (require('v-conf'))();
    self.config.loadFile(configFile);
    return libQ.resolve();
};

peppymeterbasic.prototype.getConfigurationFiles = function () {
    return ['config.json'];
};

peppymeterbasic.prototype.getI18nFile = function (langCode) {
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

peppymeterbasic.prototype.onStop = function () {
    const self = this;
    let defer = libQ.defer();
    self.logger.info("Stopping peppymeterbasic service");
    self.commandRouter.stateMachine.stop().then(function () {
        exec("/usr/bin/sudo /bin/systemctl stop peppymeterbasic.service", {
            uid: 1000,
            gid: 1000
        }, function (error, stdout, stderr) { })
        self.socket.off();
    });
    defer.resolve();
    return libQ.resolve();
};

peppymeterbasic.prototype.onStart = function () {
    var self = this;
    var defer = libQ.defer();
    self.socket = io.connect('http://localhost:3000');

    // self.modprobedummy()
    self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'updateALSAConfigFile')

        .then(function (e) {
            var pipeDefer = libQ.defer();
            exec("/usr/bin/mkfifo /tmp/basic_peppy_meter_fifo" + "; /bin/chmod 666 /tmp/basic_peppy_meter_fifo", { uid: 1000, gid: 1000 }, function (error, stdout, stderr) {
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
    self.commandRouter.pushToastMessage('success', 'Starting peppymeterbasic');
    return defer.promise;
};


peppymeterbasic.prototype.startpeppyservice = function () {
    const self = this;
    let defer = libQ.defer();

    exec("/usr/bin/sudo /bin/systemctl start peppymeterbasic.service", {
        uid: 1000,
        gid: 1000
    }, function (error, stdout, stderr) {
        if (error) {
            self.logger.info(logPrefix + 'peppymeterbasic failed to start. Check your configuration ' + error);
        } else {
            self.commandRouter.pushConsoleMessage('peppymeterbasic Daemon Started');

            defer.resolve();
        }
    });
};

peppymeterbasic.prototype.restartpeppyservice = function () {
    const self = this;
    let defer = libQ.defer();
    exec("/usr/bin/sudo /bin/systemctl restart peppymeterbasic.service", {
        uid: 1000,
        gid: 1000
    }, function (error, stdout, stderr) {
        if (error) {
            self.logger.info(logPrefix + 'peppymeterbasic failed to start. Check your configuration ' + error);
        } else {
            self.commandRouter.pushConsoleMessage('peppymeterbasic Daemon Started');

            defer.resolve();
        }
    });
};

peppymeterbasic.prototype.stopeppyservice = function () {
    const self = this;
    let defer = libQ.defer();

    exec("/usr/bin/sudo /bin/systemctl stop peppymeterbasic.service", {
        uid: 1000,
        gid: 1000
    }, function (error, stdout, stderr) {
        if (error) {
            self.logger.info(logPrefix + 'peppymeterbasic failed to stop!! ' + error);
        } else {
            self.commandRouter.pushConsoleMessage('peppymeterbasic Daemon Stop');

            defer.resolve();
        }
    });
};


peppymeterbasic.prototype.onRestart = function () {
    const self = this;
};

peppymeterbasic.prototype.onInstall = function () {
    const self = this;
    //	//Perform your installation tasks here
};

peppymeterbasic.prototype.onUninstall = function () {
    const self = this;
    //Perform your installation tasks here
};

peppymeterbasic.prototype.checkIfPlay = function () {
    const self = this;
    self.socket.on('pushState', function (data) {
        self.logger.info(logPrefix + 'peppymeterbasic status ' + data.status);

        if (data.status === "play") {
            self.startpeppyservice()
        } else if ((data.status === "pause") || (data.status === "stop")) {
            self.stopeppyservice()
        }
    })
};



peppymeterbasic.prototype.getUIConfig = function () {
    const self = this;
    const defer = libQ.defer();
    var lang_code = this.commandRouter.sharedVars.get('language_code');
    self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
        __dirname + '/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function (uiconf) {
            let meterfolder;
            var showsize = self.config.get("showsize")
            var autosize = self.config.get("auutosize")

            var valuescreen = self.config.get('screensize');
            self.configManager.setUIConfigParam(uiconf, 'sections[0].content[0].value.value', valuescreen);
            self.configManager.setUIConfigParam(uiconf, 'sections[0].content[0].value.label', valuescreen);


            const directoryPath = '/data/INTERNAL/PeppyMeterBasic/Templates/';

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


            var valuemeter;
            valuemeter = self.config.get('meter');
            self.configManager.setUIConfigParam(uiconf, 'sections[1].content[0].value.value', valuemeter);
            self.configManager.setUIConfigParam(uiconf, 'sections[1].content[0].value.label', valuemeter);

            try {
                if ((valuescreen == '320x240') || (valuescreen == '480x320') || (valuescreen == '800x480') || (valuescreen == '1280x400')) {
                    meterfolder = '/data/plugins/user_interface/peppymeterbasic/BasicPeppyMeter/'
                } else {
                    meterfolder = '/data/INTERNAL/PeppyMeterBasic/Templates/'
                }

                fs.readFile(meterfolder + valuescreen + '/meters.txt', function (err, idata) {
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
                    let allfilter = 'random,' + matches;
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
                        let listf = fs.readFileSync('/data/plugins/user_interface/peppymeterbasic/meterslist.txt', "utf8");
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


peppymeterbasic.prototype.getAdditionalConf = function (type, controller, data) {
    const self = this;
    return self.commandRouter.executeOnPlugin(type, controller, 'getConfigParam', data);
}

peppymeterbasic.prototype.refreshUI = function () {
    const self = this;

    setTimeout(function () {
        var respconfig = self.commandRouter.getUIConfigOnPlugin('user_interface', 'peppymeterbasic', {});
        respconfig.then(function (config) {
            self.commandRouter.broadcastMessage('pushUiConfig', config);
        });
        self.commandRouter.closeModals();
    }, 100);
}

peppymeterbasic.prototype.getLabelForSelect = function (options, key) {
    var n = options.length;
    for (var i = 0; i < n; i++) {
        if (options[i].value == key)
            return options[i].label;
    }
    return 'VALUE NOT FOUND BETWEEN SELECT OPTIONS!';
};

peppymeterbasic.prototype.savepeppy = function (data) {
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
    var myMeterSize
    let autovalue
    // var metersize=self.config.get('metersize')
    var metersizef

    if (hasOpeningParenthesis(screensize)) {

        autovalue = screensize.split('x')//.slice(0, 3)

        console.log('aaaaaaaaaaa ' + autovalue)
        self.logger.info(logPrefix + autovalue[0] + autovalue[1])// + autovalue[2])


    } else {
        myNumberx = '';
        myNumbery = '';
        metersizef = 30

    }
    if ((screensize === '320x240') || (screensize === '480x320') || (screensize === '800x480') || (screensize === '1280x400')) {
        myNumberx = '';
        myNumbery = '';
        metersizef = 30
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
        metersizef = parseInt(autovalue[1].split('+')[1], 10);

        //screenwidth = autovalue[0]
        //screenheight = autovalue[1].split('+').split("-")[0]
        //metersizef = autovalue[2].split('-')[0]
        self.logger.info(logPrefix + screenwidth + screenheight + metersizef)
        myNumberx = parseInt(screenwidth, 10);
        myNumbery = parseInt(screenheight, 10);
        myMeterSize = parseInt(metersizef, 10);

        var truex = (typeof myNumberx === 'number' && isFinite(myNumberx))
        var truey = (typeof myNumbery === 'number' && isFinite(myNumbery))
        var trues = (typeof myMeterSize === 'number' && isFinite(myMeterSize))

        if (truex && truey && trues) {
            // console.log('The variable is a finite number.' + myNumberx + " " + myNumbery + " " + myMeterSize);
        } else if (((!truex && !truey && !trues)) || (size == undefined)) {
          //  console.log('The variable is not a finite number.');
            self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('METER_FOLDER_NAME'));
            myNumberx = '480'
            myNumbery = '240'
            metersizef = 30;
        }
    }
    if (isNaN(metersizef)) {
        metersizef = 30;
    }

    self.config.set('screensize', screensize);
    self.config.set('meter', 'random');
    self.config.set('screenwidth', myNumberx);
    self.config.set('screenheight', myNumbery);

    var storedmetersize = self.config.get("metersize")
    //  myMetersize = self.config.get("metersize")

    //console.log("metersizef " + typeof parseInt(metersizef, 10) + "  storedmetersize " + typeof storedmetersize)
    if (parseInt(metersizef, 10) !== storedmetersize) {

        if (metersizef == undefined) {
            metersizef = 30
            self.config.set('metersize', myMeterSize)
        }
        self.commandRouter.pushToastMessage('success', self.commandRouter.getI18nString('NBARCHANGE') + metersizef);

        setTimeout(function () {
            self.updateasound()
            //  .then(function (updateasound) {
        }, 2000);
        self.config.set('metersize', metersizef);

        //})
    }

    //self.savepeppyconfig();
    //self.restartpeppyservice()
    self.refreshUI()
        .then(function (e) {
            self.commandRouter.pushToastMessage('success', "peppymeterbasic Configuration updated");
            defer.resolve({});
        })
        .fail(function (e) {
            defer.reject(new Error('error'));
            self.commandRouter.pushToastMessage('error', "failed to start. Check your config !");
        })
    return defer.promise;

};


peppymeterbasic.prototype.savepeppy1 = function (data) {
    const self = this;

    const defer = libQ.defer();
    self.config.set('meter', data['meter'].value);

    self.savepeppyconfig();
    self.restartpeppyservice()
        .then(function (e) {
            self.commandRouter.pushToastMessage('success', "peppymeterbasic Configuration updated");
            defer.resolve({});
        })
        .fail(function (e) {
            defer.reject(new Error('error'));
            self.commandRouter.pushToastMessage('error', "failed to start. Check your config !");
        })
    return defer.promise;

};


peppymeterbasic.prototype.savepeppy2 = function (data) {
    const self = this;

    const defer = libQ.defer();

    self.config.set('debuglog', data['debuglog']);

    self.savepeppyconfig();
    self.restartpeppyservice()

        .then(function (e) {
            self.commandRouter.pushToastMessage('success', "peppymeterbasic Configuration for debug log updated");
            defer.resolve({});
        })
        .fail(function (e) {
            defer.reject(new Error('error'));
            self.commandRouter.pushToastMessage('error', "failed to start. Check your config !");
        })
    return defer.promise;

};


//here we save the asound.conf file config
peppymeterbasic.prototype.buildasound = function () {
    const self = this;

    const defer = libQ.defer();
    var metersize = self.config.get("metersize")
    try {

        fs.readFile(__dirname + "/peppy_in.peppy_out.6.conf.tmpl", 'utf8', function (err, data) {
            if (err) {
                defer.reject(new Error(err));
                return console.log(err);
            }

            const conf1 = data.replace("${metersize}", metersize)

            fs.writeFile("/data/plugins/user_interface/peppymeterbasic/asound/peppy_in.peppy_out.6.conf", conf1, 'utf8', function (err) {
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

peppymeterbasic.prototype.updateasound = function () {
    var self = this;
    var defer = libQ.defer();
    //self.socket.emit('pause')

    self.buildasound()
        .then(function () {
            return self.commandRouter.executeOnPlugin('audio_interface', 'alsa_controller', 'updateALSAConfigFile');
        }).then(function () {
            self.commandRouter.pushToastMessage('success', 'meter size applied');
            defer.resolve();
        }).fail(function () {
            self.commandRouter.pushToastMessage('error', 'a problem occurred');
            defer.reject();
        });

    return defer.promise;

};

peppymeterbasic.prototype.savepeppyconfig = function () {
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
                screensize = (/*µ'/data/INTERNAL/PeppyMeterBasic/Templates/' +*/ self.config.get("screensize"))
                screenwidth = self.config.get("screenwidth")
                screenheight = self.config.get("screenheight")
                basefolder = ('/data/INTERNAL/PeppyMeterBasic/Templates')
            }


            var meter = self.config.get('meter')
            if (meter == 'random') {
                meter = 'random'
            }

            var metersize = self.config.get("metersize")

            var debuglog = self.config.get('debuglog')
            if (debuglog) {
                var debuglogd = 'True'
            }
            else if (debuglogd = 'False');

            self.logger.info(logPrefix + "--------------------meter" + meter)
            self.logger.info(logPrefix + "--------------------$basefolder" + basefolder)
            self.logger.info(logPrefix + "--------------------screensize" + screensize)
            self.logger.info(logPrefix + "--------------------screenwidth" + screenwidth)
            self.logger.info(logPrefix + "--------------------screenheight" + screenheight)
            self.logger.info(logPrefix + "--------------------metersize" + metersize)

            const conf1 = data.replace("${meter}", meter)
                .replace("${basefolder}", basefolder)
                .replace("${screensize}", screensize)
                .replace("${screenwidth}", screenwidth)
                .replace("${screenheight}", screenheight)
                .replace("${metersize}", metersize)
                .replace("${debuglog}", debuglogd)


            fs.writeFile("/data/plugins/user_interface/peppymeterbasic/BasicPeppyMeter/config.txt", conf1, 'utf8', function (err) {
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

peppymeterbasic.prototype.dlmeter = function (data) {
    const self = this;
    let zipfile = data["zipfile"].value// + ".zip"
    ///self.config.set('debuglog', data['debuglog']);


    return new Promise(function (resolve, reject) {
        try {
            let modalData = {
                title: self.commandRouter.getI18nString('METER_INSTALL_TITLE'),
                message: self.commandRouter.getI18nString('METER_INSTALL_WAIT'),
                size: 'lg'
            };
            //self.commandRouter.pushToastMessage('info', 'Please wait while installing ( up to 30 seconds)');
            self.commandRouter.broadcastMessage("openModal", modalData);

            let cp3 = execSync('/usr/bin/wget -P /tmp https://github.com/balbuze/Meter-peppymeter/raw/main/Zipped-folders/' + zipfile + '.zip');
          //  let cp9 = execSync('sudo chmod -R 766 /data/' + meterspath)
           // let cp5 = execSync('miniunzip -o /tmp/' + zipfile + '.zip -d /data/' + meterspath);
            let cp5 = execSync('miniunzip -o /tmp/' + zipfile + '.zip -d /data/' + meterspath+' && sudo chmod -R 777 /data/' + meterspath);

            self.logger.info(logPrefix + 'message miniunzip -o /tmp/' + zipfile + '.zip -d /data/' + meterspath);


            self.refreshUI();

        } catch (err) {
            self.logger.error(logPrefix + ' An error occurs while downloading or installing Meters');
            self.commandRouter.pushToastMessage('error', 'An error occurs while downloading or installing Meter');
        }
      //  self.config.set('zipfile', zipfile);
      let cp6 = execSync('/bin/rm /tmp/' + zipfile + '.zip*');
        resolve();
    });
};

peppymeterbasic.prototype.updatelist = function (data) {
    const self = this;
    let path = 'https://github.com/balbuze/Meter-peppymeter/raw/main';
    let name = 'meterslist.txt';
    let defer = libQ.defer();
    var destpath = ' \'/data/plugins/user_interface/peppymeterbasic';
    // self.config.set('importeq', namepath)
    var toDownload = (path + '/' + name + '\'');
    self.logger.info(logPrefix + ' wget \'' + toDownload)
    try {
        execSync("/usr/bin/wget \'" + toDownload + " -O" + destpath + "/meterslist.txt\'", {
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

peppymeterbasic.prototype.setUIConfig = function (data) {
    const self = this;

};

peppymeterbasic.prototype.getConf = function (varName) {
    const self = this;
    //Perform your installation tasks here
};


peppymeterbasic.prototype.setConf = function (varName, varValue) {
    const self = this;
};
