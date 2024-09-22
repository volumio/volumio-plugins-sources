"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _Proxy_instances, _Proxy_serverCredentials, _Proxy_server, _Proxy_status, _Proxy_startPromise, _Proxy_app, _Proxy_handleRequest, _Proxy_validateURL;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyStatus = void 0;
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const SqueezeliteMCContext_1 = __importDefault(require("./SqueezeliteMCContext"));
const util_1 = require("util");
const stream_1 = require("stream");
const Util_1 = require("./Util");
const node_fetch_1 = __importDefault(require("node-fetch"));
var ProxyStatus;
(function (ProxyStatus) {
    ProxyStatus["Stopped"] = "stopped";
    ProxyStatus["Started"] = "started";
    ProxyStatus["Starting"] = "starting";
})(ProxyStatus = exports.ProxyStatus || (exports.ProxyStatus = {}));
class Proxy {
    constructor(serverCredentials = {}) {
        _Proxy_instances.add(this);
        _Proxy_serverCredentials.set(this, void 0);
        _Proxy_server.set(this, void 0);
        _Proxy_status.set(this, void 0);
        _Proxy_startPromise.set(this, void 0);
        _Proxy_app.set(this, void 0);
        __classPrivateFieldSet(this, _Proxy_serverCredentials, serverCredentials, "f");
        __classPrivateFieldSet(this, _Proxy_server, null, "f");
        __classPrivateFieldSet(this, _Proxy_status, ProxyStatus.Stopped, "f");
        __classPrivateFieldSet(this, _Proxy_startPromise, null, "f");
        __classPrivateFieldSet(this, _Proxy_app, (0, express_1.default)(), "f");
        __classPrivateFieldGet(this, _Proxy_app, "f").use(express_1.default.urlencoded({ extended: false }));
        __classPrivateFieldGet(this, _Proxy_app, "f").get('/', __classPrivateFieldGet(this, _Proxy_instances, "m", _Proxy_handleRequest).bind(this));
    }
    start() {
        if (this.getStatus() === ProxyStatus.Started) {
            SqueezeliteMCContext_1.default.getLogger().info('[squeezelite_mc] Proxy server already started');
            return Promise.resolve();
        }
        else if (this.getStatus() === ProxyStatus.Starting && __classPrivateFieldGet(this, _Proxy_startPromise, "f")) {
            return __classPrivateFieldGet(this, _Proxy_startPromise, "f");
        }
        __classPrivateFieldSet(this, _Proxy_status, ProxyStatus.Starting, "f");
        __classPrivateFieldSet(this, _Proxy_startPromise, new Promise((resolve, reject) => {
            SqueezeliteMCContext_1.default.getLogger().info('[squeezelite_mc] Starting proxy server...');
            const server = __classPrivateFieldSet(this, _Proxy_server, http_1.default.createServer(__classPrivateFieldGet(this, _Proxy_app, "f")), "f");
            server.on('error', (error) => {
                if (this.getStatus() === ProxyStatus.Starting) {
                    SqueezeliteMCContext_1.default.getLogger().error(SqueezeliteMCContext_1.default.getErrorMessage('[squeezelite_mc] An error occurred while starting proxy server:', error));
                    server.close();
                    reject(error);
                }
                else {
                    SqueezeliteMCContext_1.default.getLogger().error(SqueezeliteMCContext_1.default.getErrorMessage('[squeezelite_mc] Proxy server error:', error));
                }
            });
            server.once('close', () => {
                __classPrivateFieldSet(this, _Proxy_status, ProxyStatus.Stopped, "f");
                __classPrivateFieldSet(this, _Proxy_server, null, "f");
                SqueezeliteMCContext_1.default.getLogger().info('[squeezelite_mc] Proxy server stopped');
            });
            server.listen(0, () => {
                __classPrivateFieldSet(this, _Proxy_status, ProxyStatus.Started, "f");
                const address = this.getAddress();
                if (!address) {
                    SqueezeliteMCContext_1.default.getLogger().warn('[squeezelite_mc] Proxy server started but address is unknown');
                }
                else if (address.port) {
                    SqueezeliteMCContext_1.default.getLogger().info(`[squeezelite_mc] Proxy server started on port ${address.port}`);
                }
                else {
                    SqueezeliteMCContext_1.default.getLogger().info('[squeezelite_mc] Proxy server started on unknown port');
                }
                resolve();
            });
        }), "f");
        return __classPrivateFieldGet(this, _Proxy_startPromise, "f");
    }
    stop() {
        if (__classPrivateFieldGet(this, _Proxy_server, "f")) {
            __classPrivateFieldGet(this, _Proxy_server, "f").close();
        }
    }
    getStatus() {
        return __classPrivateFieldGet(this, _Proxy_status, "f");
    }
    getAddress() {
        if (this.getStatus() === ProxyStatus.Started && __classPrivateFieldGet(this, _Proxy_server, "f")) {
            const addr = __classPrivateFieldGet(this, _Proxy_server, "f").address();
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
    setServerCredentials(serverCredentials = {}) {
        __classPrivateFieldSet(this, _Proxy_serverCredentials, serverCredentials, "f");
    }
}
exports.default = Proxy;
_Proxy_serverCredentials = new WeakMap(), _Proxy_server = new WeakMap(), _Proxy_status = new WeakMap(), _Proxy_startPromise = new WeakMap(), _Proxy_app = new WeakMap(), _Proxy_instances = new WeakSet(), _Proxy_handleRequest = async function _Proxy_handleRequest(req, res) {
    const serverName = req.query.server_name;
    const url = req.query.url;
    const fallback = req.query.fallback;
    /**
     * Volumio's Manifest UI sometimes URI-encodes the already encoded `url`
     * so it becomes malformed. We need to check whether this is the case.
     * Fortunately, it seems a request with double-encoded `url` is preceded by
     * one with the correct, untampered value.
     */
    if (typeof url !== 'string' || !__classPrivateFieldGet(this, _Proxy_instances, "m", _Proxy_validateURL).call(this, url)) {
        SqueezeliteMCContext_1.default.getLogger().error(`[squeezelite_mc] Proxy: invalid URL (${url})`);
        return res.status(400).end();
    }
    SqueezeliteMCContext_1.default.getLogger().info(`[squeezelite_mc] Proxy request for ${serverName}, URL: ${url}`);
    const streamPipeline = (0, util_1.promisify)(stream_1.pipeline);
    const headers = {};
    const credentials = serverName ? __classPrivateFieldGet(this, _Proxy_serverCredentials, "f")[serverName.toString()] : null;
    if (credentials) {
        headers.Authorization = `Basic ${(0, Util_1.encodeBase64)(`${credentials.username}:${credentials.password || ''}`)}`;
    }
    try {
        const response = await (0, node_fetch_1.default)(url, { headers });
        if (!response.ok) {
            SqueezeliteMCContext_1.default.getLogger().error(`[squeezelite_mc] Proxy received unexpected response: ${response.status} - ${response.statusText}`);
            if (typeof fallback === 'string') {
                res.redirect(fallback);
            }
        }
        else if (!response.body) {
            SqueezeliteMCContext_1.default.getLogger().error('[squeezelite_mc] Proxy received empty response body');
            if (typeof fallback === 'string') {
                res.redirect(fallback);
            }
        }
        else {
            await streamPipeline(response.body, res);
        }
    }
    catch (error) {
        SqueezeliteMCContext_1.default.getLogger().error(SqueezeliteMCContext_1.default.getErrorMessage('[squeezelite_mc] Proxy server encountered the following error:', error));
        if (typeof fallback === 'string') {
            // It might be too late to redirect the response to fallback, so need to try-catch
            try {
                res.redirect(fallback);
            }
            catch (error) {
                SqueezeliteMCContext_1.default.getLogger().error(SqueezeliteMCContext_1.default.getErrorMessage('[squeezelite_mc] Proxy server failed to redirect response to fallback url:', error, false));
                res.end();
            }
        }
    }
}, _Proxy_validateURL = function _Proxy_validateURL(url) {
    try {
        const test = new URL(url);
        return !!test;
    }
    catch (error) {
        return false;
    }
};
//# sourceMappingURL=Proxy.js.map