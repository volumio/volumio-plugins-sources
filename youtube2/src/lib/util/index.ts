// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Recursively match each property of `obj` against `predicate` and returns the values of matches.
 * @param {*} obj
 * @param {*} predicate `function(key, value)`
 * @returns List of values of matched properties. Only deepest matches are included.
 */
export function findInObject(obj: object | Array<any>, predicate: (key: string, value: any) => boolean) {
  const matches: Array<any> = [];
  if (typeof obj === 'object') {
    for (const [ key, value ] of Object.entries(obj)) {
      let lastMatch: any;
      if (predicate(key, value)) {
        lastMatch = value;
      }
      if (typeof value === 'object') {
        const nestedMatches = findInObject(value, predicate);
        // If there are nested objects that match predicate, then add those instead
        // Of parent match (i.e. `lastMatch`, if any).
        if (nestedMatches.length > 0) {
          matches.push(...nestedMatches);
        }
        else if (lastMatch) {
          matches.push(lastMatch);
        }
      }
      else if (lastMatch) {
        matches.push(lastMatch);
      }
    }
  }
  else if (Array.isArray(obj)) {
    for (const value of obj as Array<any>) {
      matches.push(...findInObject(value, predicate));
    }
  }
  return matches;
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
