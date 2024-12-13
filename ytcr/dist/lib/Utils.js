"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsPromiseToKew = jsPromiseToKew;
exports.kewToJSPromise = kewToJSPromise;
exports.getNetworkInterfaces = getNetworkInterfaces;
exports.hasNetworkInterface = hasNetworkInterface;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const kew_1 = __importDefault(require("kew"));
const network_interfaces_1 = __importDefault(require("network-interfaces"));
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
function kewToJSPromise(promise) {
    // Guard against a JS promise from being passed to this function.
    if (typeof promise.catch === 'function' && typeof promise.fail === 'undefined') {
        // JS promise - return as is
        return promise;
    }
    return new Promise((resolve, reject) => {
        promise.then((result) => {
            resolve(result);
        })
            .fail((error) => {
            reject(error instanceof Error ? error : Error(String(error)));
        });
    });
}
function getNetworkInterfaces() {
    const ifNames = network_interfaces_1.default.getInterfaces({
        internal: false,
        ipVersion: 4
    });
    return ifNames.map((v) => {
        return {
            name: v,
            ip: network_interfaces_1.default.toIp(v, {})
        };
    });
}
function hasNetworkInterface(ifName) {
    return !!getNetworkInterfaces().find((info) => info.name === ifName);
}
//# sourceMappingURL=Utils.js.map