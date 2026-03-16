'use strict';
const express = require('express');
const RdkProg = require('./prog');
const Radiko = require('./radiko');
const cron = require('node-cron');
const IcyMetadata = require('icy-metadata');

class JpRadio {
  constructor(port, logger, acct = null) {
    this.app = express();
    this.server = null;
    this.port = port || 9000;
    this.logger = logger;
    this.acct = acct;

    this.task = cron.schedule('0 3,9,15 * * *', async () => {
      await this.#pgupdate();
    }, false);

    this.prg = null;
    this.rdk = null;

    this.app.get('/radiko/', (req, res) => {
      res.send('Hello, world. You\'re at the radiko_app index.');
    });
    
    this.app.get('/radiko/:stationID', async (req, res) => {
      let station = req.params['stationID'];
    
      if (this.rdk.stations.has(station)) {
        await this.rdk.init(this.acct);
        const icyMetadata = new IcyMetadata();
    
        let ffmpeg = await this.rdk.play(station);
        res.setHeader('HeaderCacheControl', 'no-cache, no-store');
        res.setHeader('icy-name', await this.rdk.getStationAsciiName(station));
        res.setHeader('icy-metaint', icyMetadata.metaInt);
        res.setHeader('Content-Type', 'audio/aac');
        res.setHeader('Connection', 'keep-alive');
    
        let progData = await this.prg.getCurProgram(station);
        let title = null;
        if (progData) {
          title = (progData['pfm'] ? progData['pfm'] : '') + ' - ' + (progData['title'] ? progData['title'] : '');
        }
    
        if (title) {
          icyMetadata.setStreamTitle(title);
        }
    
        ffmpeg.stdout.pipe(icyMetadata).pipe(res);
    
        res.on('close', function () {
          (async () => {
            process.kill(-ffmpeg.pid, 'SIGTERM');
          })();
        });
        this.logger.debug('JP_Radio::get returning response');
      } else {
        res.send(format('JP_Radio::%s not in available stations', station));
        this.logger.error(format('JP_Radio::%s not in available stations', station))
      }
    });
  }

  start() {
    if (this.server) {
      this.logger.info('JP_Radio::App already started');
      return Promise.resolve();
    }
    return new Promise(async (resolve, reject) => {
      this.prg = new RdkProg(this.logger);
      this.rdk = new Radiko(this.port, this.logger, this.acct);
      await this.#init(this.acct);
      this.server = this.app.listen(this.port, async () => {
        this.logger.info(`JP_Radio::App is listening on port ${this.port}.`);
        this.task.start();
        resolve();
      }).on('error', err => {
        this.logger.error('JP_Radio::App error:', err);
        reject(err);
      });
    });
  }

  stop = async () => {
    if (this.server) {
      this.task.stop();
      this.server.close();
      this.server = null;
      await this.prg.dbClose();
      this.prg = null;
      this.rdk = null;
    }
  }

  radioStations = () => {
    return this.rdk.radioStations()
  }

  #init = async () => {
    await this.rdk.init(this.acct);
    await this.#pgupdate();
  }

  #pgupdate = async () => {
    this.logger.info('JP_Radio::Updating program listings');
    await this.prg.updatePrograms();
    await this.prg.clearOldProgram();
  }
}
module.exports = JpRadio;