'use strict';
require('date-utils');
const { format } = require('util');
const got = require('got');
const spawn = require('child_process').spawn;
const capitalize = require('capitalize');

const tough = require('tough-cookie');

const { XMLParser } = require('fast-xml-parser');

const xmlOptions = {
  attributeNamePrefix: '@',
  ignoreAttributes: false,
  ignoreNameSpace: true,
  allowBooleanAttributes: true,
};

const xmlParser = new XMLParser(xmlOptions);

class Radiko {
  #LOGIN_URL = 'https://radiko.jp/ap/member/webapi/member/login';
  #CHECK_URL = 'https://radiko.jp/ap/member/webapi/v2/member/login/check';
  #LOGOUT_URL = 'https://radiko.jp/ap/member/webapi/member/logout';
  #AUTH_KEY = 'bcd151073c03b352e1ef2fd66c32209da9ca0afa';
  #AUTH1_URL = 'https://radiko.jp/v2/api/auth1';
  #AUTH2_URL = 'https://radiko.jp/v2/api/auth2';
  #CHANNEL_AREA_URL = 'http://radiko.jp/v3/station/list/%s.xml';
  #CHANNEL_FULL_URL = 'http://radiko.jp/v3/station/region/full.xml';
  #PLAY_URL = 'http://f-radiko.smartstream.ne.jp/%s/_definst_/simul-stream.stream/playlist.m3u8';
  #MAX_RETRY_COUNT = 2;
  #PROG_DAILY_URL = "https://radiko.jp/v3/program/station/date/%s/%s.xml"
  constructor(port, logger) {
    this.port = port;
    this.logger = logger;

    this.token = null;
    this.areaID = null;

    this.areaData = null;
    this.stations = null;
    this.cookieJar = null;

    this.stationData = [];
  }

  init = async (acct = null, forceGetStations = false) => {
    let cookieJar = new tough.CookieJar();
    if (acct) {
      var loginState = null;
      if (this.cookieJar) {
        loginState = await this.#checkLogin(cookieJar);
      }
      if (!this.cookieJar || !this.loginState) {
        cookieJar = await this.#login(acct);
        loginState = await this.#checkLogin(cookieJar);
        if (loginState) {
          this.cookieJar = cookieJar;
        }
      }
      this.loginState = loginState;
    } else {
      this.loginState = null;
    }

    if (forceGetStations || !this.areaID) {
      let [authToken, areaID] = await this.#getToken(cookieJar);
      this.token = authToken;
      this.areaID = areaID;
      this.logger.info('JP_Radio::getting stations');
      await this.#getStations();
    }
  }

  #getToken = async (cookieJar) => {
    let authResponse = await this.#auth1(cookieJar);
    let [partialKey, authToken] = await this.#getPartialKey(authResponse);

    let txt = await this.#auth2(authToken, partialKey, cookieJar);
    this.logger.debug(txt.trim().toString());
    let [areaID, areaName, areaNameAscii] = txt.trim().split(',');

    return [authToken, areaID];
  }

  #login = async (acct) => {
    let cookieJar = new tough.CookieJar();
    const options = {
      cookieJar,
      method: 'POST',
      methodRewriting: true,
      form: {
        mail: acct['mail'],
        pass: acct['pass']
      },
    }
    try {
      await got(this.#LOGIN_URL, options);
      return cookieJar;
    } catch (err) {
      this.logger.error('JP_Radio::premium account login error');
      if (err.statusCode === 302) {
        return cookieJar;
      }
    }
    return null;
  }

  #checkLogin = async (cookieJar) => {
    if (!cookieJar) {
      this.logger.info('JP_Radio::premium account not set');
      return null;
    }
    try {
      const options = {
        cookieJar,
        method: 'GET',
        responseType: 'json'
      }
      const response = await got(this.#CHECK_URL, options);
      let memberType = response.body.member_type.type;
      this.logger.info('JP_Radio::premium logged in - Member Type:%s', memberType);
      return response.body;
    } catch (err) {
      if (err.statusCode === 400) {
        this.logger.info('JP_Radio::premium not logged in');
        return null;
      }
      this.logger.error('JP_Radio::premium account login check error');
    }
    return null;
  }

  #logout = async (cookieJar) => {
    if (this.loginState) {
      let logout = await got(this.#LOGOUT_URL, { cookieJar });
      let txt = logout.read();
      this.loginState = null;
      this.logger.info('premium logout');
      return json.loads(txt.decode());
    }
  }

  #auth1 = async (cookieJar) => {
    const options = {
      cookieJar,
      method: 'GET',
      headers: {
        'User-Agent': 'curl/7.56.1',
        'Accept': '*/*',
        'X-Radiko-App': 'pc_html5',
        'X-Radiko-App-Version': '0.0.1',
        'X-Radiko-User': 'dummy_user',
        'X-Radiko-Device': 'pc',
      }
    }
    const response = await got(this.#AUTH1_URL, options);
    return { Headers: response.headers };
  }

  #getPartialKey = async (authResponse) => {
    let authToken = authResponse.Headers['x-radiko-authtoken'];
    let keyLength = parseInt(authResponse.Headers['x-radiko-keylength'], 10);
    let keyOffset = parseInt(authResponse.Headers['x-radiko-keyoffset'], 10);
    let partialKey = this.#AUTH_KEY.slice(keyOffset, (keyOffset + keyLength));
    partialKey = Buffer.from(partialKey).toString('base64');
    return [partialKey, authToken];
  };

  #auth2 = async (authToken, partialKey, cookieJar) => {
    const options = {
      cookieJar,
      method: 'GET',
      headers: {
        'X-Radiko-AuthToken': authToken,
        'X-Radiko-Partialkey': partialKey,
        'X-Radiko-User': 'dummy_user',
        'X-Radiko-Device': 'pc',
      }
    }
    const response = await got(this.#AUTH2_URL, options);
    return response.body;
  }

  #getStations = async () => {
    this.areaData = new Map();
    this.stations = new Map();

    const response = await got(this.#CHANNEL_FULL_URL);

    let stationsInfo = xmlParser.parse(response.body);

    let stationData = [];

    for (const stationsTemp of stationsInfo.region.stations) {
      let data = {};
      data['region'] = new Map();
      data['stations'] = [];

      data['region'] = stationsTemp;

      for (const stationTemp of stationsTemp.station) {
        data['stations'].push({
          'id': stationTemp['id'],
          'name': stationTemp['name'],
          'ascii_name': stationTemp['ascii_name'],
          'areafree': stationTemp['areafree'],
          'timefree': stationTemp['timefree'],
          'banner': stationTemp['banner'],
          'area_id': stationTemp['area_id'],
        });
      }
      stationData.push(data);
    }

    this.stationData = stationData;

    for (let i = 1; i <= 47; i++) {
      let areaID = format('JP%d', i);
      let url = format(this.#CHANNEL_AREA_URL, areaID);
      const response = await got(url);

      let xmlDataArea = xmlParser.parse(response.body);

      let stations = [];
      for (const stationInfo of xmlDataArea.stations.station) {
        stations.push(stationInfo['id']);
      };

      this.areaData.set(areaID, { areaName: xmlDataArea.stations['@area_name'], stations: stations });
    }
    let stations = new Map();
    for (const region of this.stationData) {
      let regionData = region['region'];
      for (const s of region['stations']) {
        let stationID = s['id'];
        let regionName = regionData['region_name'];
        let bannerURL = s['banner'];
        let areaID = s['area_id'];
        let areaName = this.areaData.get(s['area_id'])['areaName'].replace(' JAPAN', '');
        let name = s['name'];
        let asciiName = s['ascii_name'];

        if (this.loginState || this.areaData.get(this.areaID)['stations'].includes(stationID)) {
          stations.set(stationID, {
            RegionName: regionName,
            BannerURL: bannerURL,
            AreaID: areaID,
            AreaName: areaName,
            Name: name,
            AsciiName: asciiName,
          });
        }
      }
    }
    this.stations = stations;
  }

  getStationAsciiName = async (station) => {
    let stationName = '';
    if (this.stations.has(station)) {
      stationName = this.stations.get(station).AsciiName;
    }
    return stationName;
  }

  play = async (station) => {
    this.logger.info(format('JP_Radio::playing %s', station));
    if (this.stations.has(station)) {
      let url = format(this.#PLAY_URL, station);
      let m3u8 = null;

      for (let i = 0; i < this.#MAX_RETRY_COUNT; i++) {
        m3u8 = await this.#genTempChunkM3u8URL(url, this.token);
        if (m3u8) {
          break;
        }
        this.logger.info('JP_Radio::getting new token');
        let [authToken, areaID] = await this.#getToken();
        this.token = authToken;
        this.areaID = areaID;
      }

      if (!m3u8) {
        this.logger.error('JP_Radio::gen temp chunk m3u8 url fail');
        return null;
      } else {
        let cmd = format('ffmpeg -y -headers X-Radiko-Authtoken:%s -i %s -acodec copy -f adts -loglevel error pipe:1', this.token, m3u8);
        let proc = spawn(cmd, {
          shell: true,
          stdio: [null, process.pipe, null, 'ipc'],
          detached: true,
          maxBuffer: 1024 * 1024 * 2
        });
        let pid = proc.pid;
        this.logger.debug(format('JP_Radio::started subprocess: group id %s', pid));

        proc.on('exit', (code) => {
          this.logger.info(format('JP_Radio::stop playing %s', station));
          this.logger.debug(format('JP_Radio::killing process group %s', pid));
        });
        return proc;
      }
    } else {
      this.logger.error(format('JP_Radio::%s not in available stations', station));
    }
    return null;
  }

  #genTempChunkM3u8URL = async (url, authToken) => {
    const options = {
      method: 'GET',
      headers: {
        'X-Radiko-AuthToken': authToken,
      }
    }
    try {
      const response = await got(url, options);
      const lines = response.body.match(/^https?:\/\/.+m3u8$/gm);
      return lines[0];
    } catch (err) {
      if (err.statusCode === 403) {
        return null;
      }
      return null;
    }
  }

  radioStations = () => {
    let radikoPlayLists = [];
    for (let station of this.stations.keys()) {
      let temp = this.stations.get(station);
      let title = format('%s / %s', capitalize(this.stations.get(station).AreaName), temp['Name']);

      radikoPlayLists.push({
        service: 'webradio',
        type: 'song',
        title: title,
        albumart: temp['BannerURL'],
        uri: `http://127.0.0.1:${this.port}/radiko/${station}`,
        name: '',
        samplerate: '',
        bitdepth: 0,
        channels: 0
      });
    }
    return radikoPlayLists;
  }
}

module.exports = Radiko;