const os = require('os');
const libQ = require('kew');

function getNetworkInterfaces() {
  const result = {};
  for (const [ifName, addresses] of Object.entries(os.networkInterfaces())) {
    const filteredAddresses = addresses.filter((ni) => ni.family === 'IPv4' && !ni.internal);
    if (filteredAddresses.length > 0) {
      result[ifName] = filteredAddresses;
    }
  }
  
  return result;
}

function encodeBase64(str) {
  return Buffer.from(str).toString('base64');
}

function getServerConnectParams(server, serverCredentials, connectType) {
  const params = {
    host: connectType === 'rpc' ? `http://${server.ip}` : connectType === 'cli' ? server.ip : null,
    port: connectType === 'rpc' ? server.jsonPort : connectType === 'cli' ? server.cliPort : null
  };
  if (serverCredentials && serverCredentials[server.name]) {
    const { username, password } = serverCredentials[server.name];
    params.username = username;
    params.password = password;
  }
  return params;
}


function jsPromiseToKew(promise) {
  let defer = libQ.defer();

  promise.then(result => {
    defer.resolve(result);
  })
    .catch(error => {
      defer.reject(error);
    });

  return defer.promise;
}

function kewToJSPromise(promise) {
  // Guard against a JS promise from being passed to this function.
  // E.g. Spotify Connect's stop()
  if (typeof promise.catch === 'function' && typeof promise.fail === undefined) {
    // JS promise - return as is
    return promise;
  }
  return new Promise((resolve, reject) => {
    promise.then(result => {
      resolve(result);
    })
      .fail(error => {
        reject(error);
      });
  });
}

class PlaybackTimer {
  constructor() {
    this.seek = 0;
    this.timer = null;
  }

  start(seek = 0) {
    this.stop();
    this.seek = seek;
    this.timer = setInterval(() => {
      this.seek += 1000;
    }, 1000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.seek = 0;
  }

  getSeek() {
    return this.seek;
  }

}

module.exports = {
  getNetworkInterfaces,
  encodeBase64,
  getServerConnectParams,
  jsPromiseToKew,
  kewToJSPromise,
  PlaybackTimer
};
