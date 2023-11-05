"use strict";

const { spawn } = require("child_process");

/**
 * CamillaDsp class to handle the external process
 * spawned as child process
 */
let CamillaDsp = function (logger) {

    const cdPath = "/data/plugins/audio_interface/fusiondsp/camilladsp"
    const cdLog = "/tmp/camilladsp.log";
    const cdLogLevel = "debug";
    const cdPortWs = 9876;
    const cdPathConfig = "/data/configuration/audio_interface/fusiondsp/camilladsp.yml";

    let run = false;
    let camilla = null;
    let abortController = null;
    let self = this;

    /**
     * Listener for SIGTERM signal, installed on class creation
     * to terminate camilladsp process in case of killall/kill -SIGTERM
     */
    let listenerTerm = function() {

        this.stop();

    };

    /**
     * Listener sent on camilladsp process termination.
     * The process may terminate either because FIFO has been closed (hence
     * we need to respawn the process immediately) or because of an error.
     * In case of error, we wait for a second to avoid hogging CPU
     */
    let listenerClose = function(code, signal) {

        let timeout = 0;

        logger.debug("close event");

        if (run === false)
            return;

        if (code > 0)
            timeout = 1000;

        logger.debug(`camilladsp close event, exit code ${code}, signal ${signal}`);
        logger.debug(`respawn in ${timeout} ms`);

        setTimeout(function() {

            if (run === false)
                return;

            self.start();

        }, timeout);

    };

    /**
     * Listener for "exit" process: here process is terminated but
     * stdio is not yet closed (and we may still not have an exit code)
     */
    let listenerExit = function(code, signal) {

        camilla = null;

        logger.debug(`camilladsp exit event, exit code ${code}, signal ${signal}`);

    };

    /**
     * Public function to spawn the camilladsp process and keep it
     * running in the background
     */
    this.start = function() {

        let args;

        if (camilla !== null)
            return;

        args = [
            "-p",
            cdPortWs,
            "-o",
            cdLog,
            "-l",
            cdLogLevel,
            cdPathConfig
        ];

        camilla = spawn(cdPath, args);

        camilla.on("exit", listenerExit);
        camilla.on("close", listenerClose);

        run = true;

        logger.info("camilladsp service started and running in background");

    };

    /**
     * Public function to terminate the camilladsp process and stop
     * it from respawning
     */
    this.stop = function() {

        if (camilla === null)
            return;

        run = false;

        camilla.kill();
        camilla = null;

        logger.info("camilladsp service terminated");

    }

    // Install the signal handler on SIGTERM to kill the child process
    // and avoid dangling processes
    process.on("SIGTERM", listenerTerm);

};

module.exports = { CamillaDsp };

