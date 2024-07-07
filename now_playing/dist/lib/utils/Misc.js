"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignObjectEmptyProps = exports.removeSongNumber = exports.rnd = exports.getVolumioBackgrounds = exports.kewToJSPromise = exports.jsPromiseToKew = void 0;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const kew_1 = __importDefault(require("kew"));
const lodash_1 = __importDefault(require("lodash"));
const SystemUtils = __importStar(require("./System"));
const NowPlayingContext_1 = __importDefault(require("../NowPlayingContext"));
const VOLUMIO_BG_PATH = '/data/backgrounds';
function jsPromiseToKew(promise) {
    const defer = kew_1.default.defer();
    promise.then((result) => {
        defer.resolve(result);
    })
        .catch((error) => {
        defer.reject(error);
    });
    return defer.promise;
}
exports.jsPromiseToKew = jsPromiseToKew;
function kewToJSPromise(promise) {
    // Guard against a JS promise from being passed to this function.
    if (typeof promise.catch === 'function' && typeof promise.fail === undefined) {
        // JS promise - return as is
        return promise;
    }
    return new Promise((resolve, reject) => {
        promise.then((result) => {
            resolve(result);
        })
            .fail((error) => {
            reject(error);
        });
    });
}
exports.kewToJSPromise = kewToJSPromise;
function getVolumioBackgrounds() {
    try {
        return SystemUtils.readdir(VOLUMIO_BG_PATH, 'thumbnail-');
    }
    catch (error) {
        NowPlayingContext_1.default.getLogger().error(NowPlayingContext_1.default.getErrorMessage(`[now-playing] Error getting Volumio backgrounds from ${VOLUMIO_BG_PATH}: `, error));
        NowPlayingContext_1.default.toast('error', NowPlayingContext_1.default.getI18n('NOW_PLAYING_GET_VOLUMIO_BG_ERR'));
        return [];
    }
}
exports.getVolumioBackgrounds = getVolumioBackgrounds;
function rnd(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
exports.rnd = rnd;
function removeSongNumber(name) {
    // Translates "8 - Yellow Dog" to "Yellow Dog" for good Match on Genius service.
    const songNameRegex = /^(?:\d+\s*-\s*)([\w\d\s\p{L}.()-].+)$/u;
    const matches = name.match(songNameRegex);
    const newName = matches && matches?.length > 1 ? matches[1] : name;
    return newName;
}
exports.removeSongNumber = removeSongNumber;
const mergeSettingsCustomizer = (target, src) => {
    if (target && typeof target === 'object' && !Array.isArray(target)) {
        return lodash_1.default.mergeWith(target, src, mergeSettingsCustomizer);
    }
    if (target === undefined || target === null || (typeof target === 'string' && target.trim() === '')) {
        return src;
    }
    return target;
};
function assignObjectEmptyProps(object, src1, src2) {
    return lodash_1.default.mergeWith(object, src1, src2, mergeSettingsCustomizer);
}
exports.assignObjectEmptyProps = assignObjectEmptyProps;
//# sourceMappingURL=Misc.js.map