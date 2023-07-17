import http, { Server as HttpServer } from 'http';
import express from 'express';
import sm from './SqueezeliteMCContext';
import { ServerCredentials } from './types/Server';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { encodeBase64 } from './Util';
import fetch, { HeadersInit } from 'node-fetch';

export enum ProxyStatus {
  Stopped = 'stopped',
  Started = 'started',
  Starting = 'starting'
}

export interface ProxyAddress {
  address: string;
  port?: number;
}

export default class Proxy {
  #serverCredentials: ServerCredentials;
  #server: HttpServer | null;
  #status: ProxyStatus;
  #startPromise: Promise<void> | null;
  #app: express.Application;

  constructor(serverCredentials: ServerCredentials = {}) {
    this.#serverCredentials = serverCredentials;
    this.#server = null;
    this.#status = ProxyStatus.Stopped;
    this.#startPromise = null;
    this.#app = express();

    this.#app.use(express.urlencoded({ extended: false }));
    this.#app.get('/', this.#handleRequest.bind(this));
  }

  start() {
    if (this.getStatus() === ProxyStatus.Started) {
      sm.getLogger().info('[squeezelite_mc] Proxy server already started');
      return Promise.resolve();
    }
    else if (this.getStatus() === ProxyStatus.Starting && this.#startPromise) {
      return this.#startPromise;
    }

    this.#status = ProxyStatus.Starting;
    this.#startPromise = new Promise((resolve, reject) => {
      sm.getLogger().info('[squeezelite_mc] Starting proxy server...');
      const server = this.#server = http.createServer(this.#app);
      server.on('error', (error) => {
        if (this.getStatus() === ProxyStatus.Starting) {
          sm.getLogger().error(sm.getErrorMessage('[squeezelite_mc] An error occurred while starting proxy server:', error));
          server.close();
          reject(error);
        }
        else {
          sm.getLogger().error(sm.getErrorMessage('[squeezelite_mc] Proxy server error:', error));
        }
      });
      server.once('close', () => {
        this.#status = ProxyStatus.Stopped;
        this.#server = null;
        sm.getLogger().info('[squeezelite_mc] Proxy server stopped');
      });

      server.listen(0, () => {
        this.#status = ProxyStatus.Started;
        const address = this.getAddress();
        if (!address) {
          sm.getLogger().warn('[squeezelite_mc] Proxy server started but address is unknown');
        }
        else if (address.port) {
          sm.getLogger().info(`[squeezelite_mc] Proxy server started on port ${address.port}`);
        }
        else {
          sm.getLogger().info('[squeezelite_mc] Proxy server started on unknown port');
        }
        resolve();
      });
    });

    return this.#startPromise;
  }

  stop() {
    if (this.#server) {
      this.#server.close();
    }
  }

  getStatus() {
    return this.#status;
  }

  getAddress(): ProxyAddress | null {
    if (this.getStatus() === ProxyStatus.Started && this.#server) {
      const addr = this.#server.address();
      if (typeof addr === 'string') {
        return {
          address: addr
        };
      }
      else if (addr?.address) {
        return {
          address: addr.address,
          port: addr.port
        };
      }
    }
    return null;
  }

  setServerCredentials(serverCredentials: ServerCredentials = {}) {
    this.#serverCredentials = serverCredentials;
  }

  async #handleRequest(req: express.Request, res: express.Response) {
    const serverName = req.query.server_name;
    const url = req.query.url;
    const fallback = req.query.fallback;

    /**
     * Volumio's Manifest UI sometimes URI-encodes the already encoded `url`
     * so it becomes malformed. We need to check whether this is the case.
     * Fortunately, it seems a request with double-encoded `url` is preceded by
     * one with the correct, untampered value.
     */
    if (typeof url !== 'string' || !this.#validateURL(url)) {
      sm.getLogger().error(`[squeezelite_mc] Proxy: invalid URL (${url})`);
      return res.status(400).end();
    }

    sm.getLogger().info(`[squeezelite_mc] Proxy request for ${serverName}, URL: ${url}`);
    const streamPipeline = promisify(pipeline);
    const headers: HeadersInit = {};
    const credentials = serverName ? this.#serverCredentials[serverName.toString()] : null;
    if (credentials) {
      headers.Authorization = `Basic ${encodeBase64(`${credentials.username}:${credentials.password || ''}`)}`;
    }
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        sm.getLogger().error(`[squeezelite_mc] Proxy received unexpected response: ${response.status} - ${response.statusText}`);
        if (typeof fallback === 'string') {
          res.redirect(fallback);
        }
      }
      else if (!response.body) {
        sm.getLogger().error('[squeezelite_mc] Proxy received empty response body');
        if (typeof fallback === 'string') {
          res.redirect(fallback);
        }
      }
      else {
        await streamPipeline(response.body, res);
      }
    }
    catch (error) {
      sm.getLogger().error(sm.getErrorMessage('[squeezelite_mc] Proxy server encountered the following error:', error));
      if (typeof fallback === 'string') {
        // It might be too late to redirect the response to fallback, so need to try-catch
        try {
          res.redirect(fallback);
        }
        catch (error) {
          sm.getLogger().error(sm.getErrorMessage('[squeezelite_mc] Proxy server failed to redirect response to fallback url:', error, false));
          res.end();
        }
      }
    }
  }

  #validateURL(url: string) {
    try {
      const test = new URL(url);
      return !!test;
    }
    catch (error) {
      return false;
    }
  }
}
