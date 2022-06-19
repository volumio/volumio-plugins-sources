const http = require('http');
const express = require('express');
const { pipeline } = require('stream');
const { promisify } = require('util');
const fetch = require('node-fetch');
const { encodeBase64 } = require('./util');
const sm = require(squeezeliteMCPluginLibRoot + '/sm');

const STOPPED = 'stopped';
const STARTED = 'started';
const STARTING = 'starting';

class Proxy {
  constructor(serverCredentials = {}) {
    this._serverCredentials = serverCredentials;
    this._server = null;
    this._status = STOPPED;
    this._startPromise = null;
    this._app = express();

    this._app.use(express.urlencoded({ extended: false }));
    this._app.get('/', this._handleRequest.bind(this));
  }

  start() {
    if (this.getStatus() === STARTED) {
      sm.getLogger().info('[squeezelite_mc] Proxy server already started');
      return Promise.resolve();
    }
    else if (this.getStatus() === STARTING) {
      return this._startPromise;
    }

    this.status = STARTING;
    this._startPromise = new Promise((resolve, reject) => {
      sm.getLogger().info(`[squeezelite_mc] Starting proxy server...`);
      this._server = http.createServer(this._app);
      this._server.on('error', (error) => {
        if (this.getStatus() === STARTING) {
          sm.getLogger().error(sm.getErrorMessage('[squeezelite_mc] An error occurred while starting proxy server:', error));
          this._server.close();
          reject(error);
        }
        else {
          sm.getLogger().error(sm.getErrorMessage('[squeezelite_mc] Proxy server error:', error));
        }
      });
      this._server.once('close', () => {
        this._status = STOPPED;
        this._server = null;
        sm.getLogger().info(`[squeezelite_mc] Proxy server stopped`);
      });

      this._server.listen(0, () => {
        this._status = STARTED;
        sm.getLogger().info(`[squeezelite_mc] Proxy server started on port ${this.getAddress().port}`);
        resolve();
      });
    });

    return this._startPromise;
  }

  stop() {
    if (this._server) {
      this._server.close();
    }
  }

  getStatus() {
    return this._status;
  }

  getAddress() {
    return this.getStatus() === STARTED ? this._server.address() : null;
  }

  getServerCredentials(server) {
    return this._serverCredentials[server.name] || null;
  }

  setServerCredentials(serverCredentials = {}) {
    this._serverCredentials = serverCredentials;
  }

  hasServerCredentials(server) {
    return this.getServerCredentials(server) ? true : false;
  }

  async _handleRequest(req, res) {
    const serverName = req.query.server_name;
    const url = req.query.url;
    const fallback = req.query.fallback;

    sm.getLogger().info(`[squeezelite_mc] Proxy request for ${serverName}, URL: ${url}`);
    const streamPipeline = promisify(pipeline);
    const headers = {};
    const credentials = this.getServerCredentials({ name: serverName });
    if (credentials) {
      headers.Authorization = 'Basic ' + encodeBase64(credentials.username + ":" + (credentials.password || ''));
    }
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        sm.getLogger().error(`[squeezelite_mc] Proxy received unexpected response: ${response.status} - ${response.statusText}`);
        res.redirect(fallback);
      }
      else {
        await streamPipeline(response.body, res);
      }
    } catch (error) {
      sm.getLogger().error(sm.getErrorMessage(`[squeezelite_mc] Proxy server encountered the following error:`, error));
      res.redirect(fallback);
    }
  }
}

Proxy.STARTED = STARTED;
Proxy.STOPPED = STOPPED;
Proxy.STARTING = STARTING;

module.exports = {
  Proxy
};
