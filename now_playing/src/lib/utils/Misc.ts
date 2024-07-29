// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import libQ from 'kew';

import lodash from 'lodash';
import * as SystemUtils from './System';
import np from '../NowPlayingContext';

const VOLUMIO_BG_PATH = '/data/backgrounds';

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

export function getVolumioBackgrounds() {
  try {
    return SystemUtils.readdir(VOLUMIO_BG_PATH, 'thumbnail-');
  }
  catch (error) {
    np.getLogger().error(np.getErrorMessage(`[now-playing] Error getting Volumio backgrounds from ${VOLUMIO_BG_PATH}: `, error));
    np.toast('error', np.getI18n('NOW_PLAYING_GET_VOLUMIO_BG_ERR'));
    return [];
  }
}

export function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

export function removeSongNumber(name: string) {
  // Translates "8 - Yellow Dog" to "Yellow Dog" for good Match on Genius service.
  const songNameRegex = /^(?:\d+\s*-\s*)([\w\d\s\p{L}.()-].+)$/u;
  const matches = name.match(songNameRegex);
  const newName = matches && matches?.length > 1 ? matches[1] : name;
  return newName;
}

const mergeSettingsCustomizer = (target: any, src: any): any => {
  if (target && typeof target === 'object' && !Array.isArray(target)) {
    return lodash.mergeWith(target, src, mergeSettingsCustomizer);
  }
  if (target === undefined || target === null || (typeof target === 'string' && target.trim() === '')) {
    return src;
  }
  return target;
};

export function assignObjectEmptyProps<TObject, TSrc1, TSrc2>(object: TObject, src1: TSrc1, src2: TSrc2) {
  return lodash.mergeWith(object, src1, src2, mergeSettingsCustomizer);
}
