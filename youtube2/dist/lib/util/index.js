"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kewToJSPromise = exports.jsPromiseToKew = exports.findInObject = exports.rnd = exports.sleep = void 0;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const kew_1 = __importDefault(require("kew"));
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.sleep = sleep;
function rnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
exports.rnd = rnd;
/**
 * Recursively match each property of `obj` against `predicate` and returns the values of matches.
 * @param {*} obj
 * @param {*} predicate `function(key, value)`
 * @returns List of values of matched properties. Only deepest matches are included.
 */
function findInObject(obj, predicate) {
    const matches = [];
    if (typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
            let lastMatch;
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
        for (const value of obj) {
            matches.push(...findInObject(value, predicate));
        }
    }
    return matches;
}
exports.findInObject = findInObject;
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
//# sourceMappingURL=index.js.map