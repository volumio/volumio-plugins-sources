// Copyright 2025 HEM Sp. z o.o.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// This file is part of an implementation of Ferrum Streaming Control Technology™,
// which is subject to additional terms found in the LICENSE-FSCT.md file.

'use strict';

var libQ = require('kew');
var fs = require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
const {LogLevelFilter, setLogLevel, initSystemdLogger, FsctService, NodePlayer, PlayerStatus, CurrentTextMetadata} = require("@hemspzoo/fsct-lib");


module.exports = FerrumStreamingControlTechnology;

function FerrumStreamingControlTechnology(context) {
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

FerrumStreamingControlTechnology.prototype.updateStateOnPlayer = function (state) {
    player.setStatus(getStatus(state));
    player.setTimeline(getTimelineInfo(state));
    player.setText(CurrentTextMetadata.Title, state["title"]);
    player.setText(CurrentTextMetadata.Author, state["artist"]);
    player.setText(CurrentTextMetadata.Album, state["album"]);
}

FerrumStreamingControlTechnology.prototype.onVolumioStart = function () {
    var self = this;
    var configFile = this.commandRouter.pluginManager.getConfigurationFile(this.context, 'config.json');
    this.config = new (require('v-conf'))();
    this.config.loadFile(configFile);

    try {
        initSystemdLogger("fsct-plugin");
        setLogLevel(LogLevelFilter.Info);
    }
    catch (e) {
        self.logger.error(e);
    }

    return libQ.resolve();
}

FerrumStreamingControlTechnology.prototype.onStart = function () {
    var self = this;
    var defer = libQ.defer();

    fsctService.runFsct(player)
        .then(function () {
                var state = self.commandRouter.volumioGetState();
                self.updateStateOnPlayer(state);
                self.logger.info("FSCT Started");
                defer.resolve();
        })
        .catch((err) => {
            self.logger.error(err);
            defer.reject(err);
        });

    return defer.promise;
};

FerrumStreamingControlTechnology.prototype.onStop = function () {
    var self = this;
    var defer = libQ.defer();

    try {
        fsctService.stopFsct();
    }
    catch (e) {
        self.logger.error(e);
    }

    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();
    self.logger.info('FSCT Stopped');

    return libQ.resolve();
};

FerrumStreamingControlTechnology.prototype.onRestart = function () {
    var self = this;
    // Optional, use if you need it
};


// Configuration Methods -----------------------------------------------------------------------------

FerrumStreamingControlTechnology.prototype.getUIConfig = function () {
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

FerrumStreamingControlTechnology.prototype.getConfigurationFiles = function () {
    return ['config.json'];
}

FerrumStreamingControlTechnology.prototype.setUIConfig = function (data) {
    var self = this;
    //Perform your installation tasks here
};

FerrumStreamingControlTechnology.prototype.getConf = function (varName) {
    var self = this;
    //Perform your installation tasks here
};

FerrumStreamingControlTechnology.prototype.setConf = function (varName, varValue) {
    var self = this;
    //Perform your installation tasks here
};

FerrumStreamingControlTechnology.prototype.pushState = function (state) {
    var self = this;

    self.updateStateOnPlayer(state);
};
