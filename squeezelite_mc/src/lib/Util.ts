// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';

import os from 'os';
import Server, { ServerCredentials } from './types/Server';
import { BasicPlayerStartupParams } from './types/Player';
import { SQUEEZELITE_LOG_FILE } from './System';

const DSD_FORMAT_TO_SQUEEZELITE_OPT: Record<string, string> = {
  'dop': 'dop',
  'DSD_U8': 'u8',
  'DSD_U16_LE': 'u16le',
  'DSD_U16_BE': 'u16be',
  'DSD_U32_LE': 'u32le',
  'DSD_U32_BE': 'u32be'
};

export interface ServerConnectParams {
  host?: string;
  port?: string;
  username?: string;
  password?: string;
}

export interface NetworkInterfaces {
  [ifName: string]: {
    address: string;
    mac: string;
  }[];
}

export function getNetworkInterfaces() {
  const result: NetworkInterfaces = {};
  for (const [ ifName, addresses ] of Object.entries(os.networkInterfaces())) {
    const filteredAddresses = addresses?.filter((ni) => ni.family === 'IPv4' && !ni.internal) || [];
    if (filteredAddresses.length > 0) {
      result[ifName] = filteredAddresses.map((addr) => ({
        address: addr.address,
        mac: addr.mac
      }));
    }
  }

  return result;
}

export function encodeBase64(str: string) {
  return Buffer.from(str).toString('base64');
}

export function getServerConnectParams(server: Server, serverCredentials: ServerCredentials | undefined, connectType: 'rpc' | 'cli') {
  const params: ServerConnectParams = {
    host: connectType === 'rpc' ? `http://${server.ip}` : server.ip,
    port: connectType === 'rpc' ? server.jsonPort : server.cliPort || '9090'
  };
  if (serverCredentials && serverCredentials[server.name]) {
    const { username, password } = serverCredentials[server.name];
    params.username = username;
    params.password = password;
  }
  return params;
}

export function jsPromiseToKew<T>(promise: Promise<T>): any {
  const defer = libQ.defer();

  promise.then((result) => {
    defer.resolve(result);
  })
    .catch((error) => {
      defer.reject(error);
    });

  return defer.promise;
}

export function kewToJSPromise(promise: any): Promise<any> {
  // Guard against a JS promise from being passed to this function.
  if (typeof promise.catch === 'function' && typeof promise.fail === undefined) {
    // JS promise - return as is
    return promise;
  }
  return new Promise((resolve, reject) => {
    promise.then((result: any) => {
      resolve(result);
    })
      .fail((error: any) => {
        reject(error);
      });
  });
}

export class PlaybackTimer {
  #seek: number;
  #timer: NodeJS.Timeout | null;

  constructor() {
    this.#seek = 0;
    this.#timer = null;
  }

  start(seek = 0) {
    this.stop();
    this.#seek = seek;
    this.#timer = setInterval(() => {
      this.#seek += 1000;
    }, 1000);
  }

  stop() {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
    this.#seek = 0;
  }

  getSeek() {
    return this.#seek;
  }
}

export function basicPlayerStartupParamsToSqueezeliteOpts(params: BasicPlayerStartupParams) {
  // Returns:
  // -o squeezelite -C 1 -n {playerName} -D 3:{dsdFormat} -V {mixer} -f ${logFile}
  const parts = [
    '-o squeezelite',
    '-C 1'
  ];
  if (params.playerName) {
    parts.push(`-n "${params.playerName}"`);
  }
  if (params.dsdFormat) {
    const dsdFormat = DSD_FORMAT_TO_SQUEEZELITE_OPT[params.dsdFormat];
    if (dsdFormat) {
      parts.push(`-D 3:${dsdFormat}`);
    }
  }
  if (params.mixer) {
    parts.push(`-V "${params.mixer}"`);
  }
  parts.push(`-f ${SQUEEZELITE_LOG_FILE}`);

  return parts.join(' ');
}
