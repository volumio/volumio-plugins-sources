'use strict';
require('date-utils');
const { format } = require('util');
const got = require('got');
const Datastore = require('nedb-promises');
const { XMLParser } = require('fast-xml-parser');

const xmlOptions = {
  attributeNamePrefix: '@',
  ignoreAttributes: false,
  ignoreNameSpace: true,
  allowBooleanAttributes: true,
};
const xmlParser = new XMLParser(xmlOptions);

class RdkProg {
  #PROG_URL = 'http://radiko.jp/v3/program/date/%s/%s.xml';

  constructor(logger) {
    this.logger = logger;
    this.db = Datastore.create({ inMemoryOnly: true });
    this.db.ensureIndex({ fieldName: 'id', unique: true });
    this.db.ensureIndex({ fieldName: 'station' });
    this.db.ensureIndex({ fieldName: 'ft' });
    this.db.ensureIndex({ fieldName: 'tt' });
    this.station = null;
    this.lastdt = null;
    this.progdata = null;
  }

  getCurProgram = async (station) => {
    let curdt = new Date().toFormat('YYYYMMDDHH24MI');
    if (station != this.station || curdt != this.lastdt) {
      try {
        const rows = await this.db.find({ station, ft: { $lte: curdt }, tt: { $gte: curdt } });
        this.progdata = rows[0];
      } catch (error) {
        this.logger.error('JP_Radio::DB Insert Error');
      }
    }
    this.station = station;
    this.lastdt = curdt;
    return this.progdata;
  }

  putProgram = async (prog_data) => {
    try {
      await this.db.insert(prog_data);
    } catch (error) {
      if (error.errorType != 'uniqueViolated') {
        this.logger.error('JP_Radio::DB Insert Error');
      }
    }
  }

  clearOldProgram = async () => {
    let curdt = new Date().toFormat('YYYYMMDDHH24MI');
    try {
      await this.db.remove({ tt: { $lt: curdt } }, { multi: true });
    } catch (error) {
      this.logger.error('JP_Radio::DB Delete Error');
    }
  }

  updatePrograms = async () => {
    let curdt = new Date().toFormat('YYYYMMDD');
    for (let i = 1; i <= 47; i++) {
      let areaID = format('JP%d', i);
      let url = format(this.#PROG_URL, curdt, areaID)

      const response = await got(url);

      let data = xmlParser.parse(response.body);

      for (let stations of data.radiko.stations.station) {
        let stationName = stations['@id'];
        for (let progs of stations.progs.prog) {
          await this.putProgram({
            station: stationName,
            id: stationName + progs['@id'],
            ft: progs['@ft'],
            tt: progs['@to'],
            title: progs['title'],
            pfm: progs['pfm'] || ''
          });
        }
      }
    }
  }

  dbClose = async () => {
    this.logger.info('JP_Radio::DB Delete');
    return this.db.persistence.compactDatafile();
  }

  allData = async () => {
    const allData = await this.db.find({});
    return JSON.stringify(allData, null, 2);
  }
}

module.exports = RdkProg;
