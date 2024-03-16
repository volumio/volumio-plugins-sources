// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';
import ni from 'network-interfaces';

export function jsPromiseToKew(promise: Promise<any>): any {
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

export function getNetworkInterfaces() {
  const ifNames = ni.getInterfaces({
    internal: false,
    ipVersion: 4
  });
  return ifNames.map((v) => {
    return {
      name: v,
      ip: ni.toIp(v, {})
    };
  });
}

export function hasNetworkInterface(ifName: string): boolean {
  return !!getNetworkInterfaces().find((info) => info.name === ifName);
}
