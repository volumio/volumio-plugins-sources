// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';

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
