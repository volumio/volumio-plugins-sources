'use strict';

var libQ = require('kew');
var fs = require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
const {LogLevel, initLogger, FsctService, NodePlayer, PlayerStatus, CurrentTextMetadata} = require("@hemspzoo/fsct-lib");


module.exports = ferrumStreamingControlTechnology;

function ferrumStreamingControlTechnology(context) {
    var self = this;

    this.context = context;
    this.commandRouter = this.context.coreCommand;
    this.logger = this.context.logger;
    this.configManager = this.context.configManager;

}

var player = new NodePlayer()
var fsctService = new FsctService();

function getStatus (state) {
    switch (state["status"]) {
        case "play":
            return PlayerStatus.Playing;
        case "pause":
            return PlayerStatus.Paused;
        case "stop":
            return PlayerStatus.Stopped;
        default:
            return PlayerStatus.Unknown;
    }
}

function getTimelineInfo(state) {
    const position = state.seek;
    const duration = state.duration;
    const status = state.status || "stop";
    const rate = status === "play" ? 1.0 : 0.0;
    if (position === undefined || duration === undefined) return null;

    return {
        position: position / 1000.0,
        duration: duration,
        rate: rate,
    };
}

ferrumStreamingControlTechnology.prototype.updateStateOnPlayer = function (state) {
    player.setStatus(getStatus(state));
    player.setTimeline(getTimelineInfo(state));
    player.setText(CurrentTextMetadata.Title, state["title"]);
    player.setText(CurrentTextMetadata.Author, state["artist"]);
    player.setText(CurrentTextMetadata.Album, state["album"]);
}

ferrumStreamingControlTechnology.prototype.onVolumioStart = function () {
    var self = this;
    var configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
    this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);

    try {
        initLogger(LogLevel.Info);
    }
    catch (e) {
        console.error(e);
    }

    return libQ.resolve();
}

ferrumStreamingControlTechnology.prototype.onStart = function () {
    var self = this;
    var defer = libQ.defer();

    fsctService.runFsct(player)
        .then(function () {
                var state = self.commandRouter.volumioGetState();
                self.updateStateOnPlayer(state);
                defer.resolve();
            },
            function (err) {
                console.error(err);
                defer.reject(err);
            });
    return defer.promise;
};

ferrumStreamingControlTechnology.prototype.onStop = function () {
    var self = this;
    var defer = libQ.defer();

    try {
        fsctService.stopFsct();
    }
    catch (e) {
        console.error(e);
    }

    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();

    return libQ.resolve();
};

ferrumStreamingControlTechnology.prototype.onRestart = function () {
    var self = this;
    // Optional, use if you need it
};


// Configuration Methods -----------------------------------------------------------------------------

ferrumStreamingControlTechnology.prototype.getUIConfig = function () {
    var defer = libQ.defer();
    var self = this;

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname + '/i18n/strings_' + lang_code + '.json',
        __dirname + '/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function (uiconf) {


            defer.resolve(uiconf);
        })
        .fail(function () {
            defer.reject(new Error());
        });

    return defer.promise;
};

ferrumStreamingControlTechnology.prototype.getConfigurationFiles = function () {
    return ['config.json'];
}

ferrumStreamingControlTechnology.prototype.setUIConfig = function (data) {
    var self = this;
    //Perform your installation tasks here
};

ferrumStreamingControlTechnology.prototype.getConf = function (varName) {
    var self = this;
    //Perform your installation tasks here
};

ferrumStreamingControlTechnology.prototype.setConf = function (varName, varValue) {
    var self = this;
    //Perform your installation tasks here
};

ferrumStreamingControlTechnology.prototype.pushState = function (state) {
    var self = this;
    self.logger.debug('FSCT API:pushState');

    // var latestState = self.commandRouter.volumioGetState();
    self.updateStateOnPlayer(state);
};
