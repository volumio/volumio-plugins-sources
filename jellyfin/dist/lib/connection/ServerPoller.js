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
var _ServerPoller_instances, _ServerPoller_targets, _ServerPoller_sdk, _ServerPoller_poll;
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
const system_api_1 = require("@jellyfin/sdk/lib/utils/api/system-api");
const abort_controller_1 = __importDefault(require("abort-controller"));
const entities_1 = require("../entities");
const JellyfinContext_1 = __importDefault(require("../JellyfinContext"));
const ServerHelper_1 = __importDefault(require("../util/ServerHelper"));
const POLL_INTERVAL = 30000;
class ServerPoller extends events_1.default {
    constructor(sdk) {
        super();
        _ServerPoller_instances.add(this);
        _ServerPoller_targets.set(this, void 0);
        _ServerPoller_sdk.set(this, void 0);
        __classPrivateFieldSet(this, _ServerPoller_targets, [], "f");
        __classPrivateFieldSet(this, _ServerPoller_sdk, sdk, "f");
    }
    addTarget(url) {
        if (Array.isArray(url)) {
            url.forEach((u) => this.addTarget(u));
            return;
        }
        const connectionUrl = ServerHelper_1.default.getConnectionUrl(url);
        if (__classPrivateFieldGet(this, _ServerPoller_targets, "f").find((target) => target.connectionUrl === connectionUrl)) {
            return;
        }
        const target = {
            url,
            connectionUrl,
            api: __classPrivateFieldGet(this, _ServerPoller_sdk, "f").createApi(connectionUrl)
        };
        __classPrivateFieldGet(this, _ServerPoller_targets, "f").push(target);
        __classPrivateFieldGet(this, _ServerPoller_instances, "m", _ServerPoller_poll).call(this, target);
    }
    removeTarget(target) {
        const index = typeof target === 'string' ? __classPrivateFieldGet(this, _ServerPoller_targets, "f").findIndex((t) => t.connectionUrl === ServerHelper_1.default.getConnectionUrl(target)) : __classPrivateFieldGet(this, _ServerPoller_targets, "f").indexOf(target);
        if (index < 0) {
            return;
        }
        const pt = __classPrivateFieldGet(this, _ServerPoller_targets, "f")[index];
        if (pt.pollTimer) {
            clearTimeout(pt.pollTimer);
            pt.pollTimer = null;
        }
        if (pt.abortController) {
            pt.abortController.abort();
            pt.abortController = null;
        }
        __classPrivateFieldGet(this, _ServerPoller_targets, "f").splice(index, 1);
    }
    clearTargets() {
        [...__classPrivateFieldGet(this, _ServerPoller_targets, "f")].forEach((target) => this.removeTarget(target));
    }
    getOnlineServers() {
        return __classPrivateFieldGet(this, _ServerPoller_targets, "f").reduce((s, target) => {
            if (target.lastEvent?.eventName === 'online') {
                s.push(target.lastEvent.server);
            }
            return s;
        }, []);
    }
    findOnlineServer(url) {
        const connectionUrl = ServerHelper_1.default.getConnectionUrl(url);
        const target = __classPrivateFieldGet(this, _ServerPoller_targets, "f").find((target) => target.connectionUrl === connectionUrl);
        if (target?.lastEvent?.eventName === 'online') {
            return target.lastEvent.server;
        }
        return null;
    }
    emit(event, ...args) {
        return super.emit(event, args);
    }
    on(event, listener) {
        return super.on(event, listener);
    }
}
exports.default = ServerPoller;
_ServerPoller_targets = new WeakMap(), _ServerPoller_sdk = new WeakMap(), _ServerPoller_instances = new WeakSet(), _ServerPoller_poll = async function _ServerPoller_poll(target) {
    if (!target.abortController) {
        target.abortController = new abort_controller_1.default();
    }
    const wasOnline = target.lastEvent?.eventName === 'online';
    let isLost = false;
    try {
        const systemApi = (0, system_api_1.getSystemApi)(target.api);
        const systemInfo = await systemApi.getPublicSystemInfo();
        if (target.abortController.signal.aborted) {
            return;
        }
        if (systemInfo.data?.Id && systemInfo.data?.ServerName) {
            if (!wasOnline) {
                const event = {
                    eventName: 'online',
                    server: {
                        type: entities_1.EntityType.Server,
                        id: systemInfo.data.Id,
                        url: target.url,
                        connectionUrl: target.connectionUrl,
                        name: systemInfo.data.ServerName,
                        thumbnail: null
                    },
                    api: target.api
                };
                target.lastEvent = event;
                JellyfinContext_1.default.getLogger().info(`[jellyfin-poller] Polled ${target.url}: online`);
                this.emit('serverOnline', event);
            }
        }
        else if (wasOnline) {
            isLost = true;
        }
        else {
            JellyfinContext_1.default.getLogger().info(`[jellyfin-poller] Polled ${target.url}: offline (system info unavailable)`);
        }
    }
    catch (error) {
        isLost = wasOnline;
        JellyfinContext_1.default.getLogger().info(`[jellyfin-poller] Polled ${target.url}: offline${isLost ? ' (lost)' : ''}`);
    }
    if (isLost && target.lastEvent) {
        target.lastEvent.eventName = 'lost';
        this.emit('serverLost', target.lastEvent);
    }
    target.pollTimer = setTimeout(() => {
        __classPrivateFieldGet(this, _ServerPoller_instances, "m", _ServerPoller_poll).call(this, target);
    }, POLL_INTERVAL);
};
//# sourceMappingURL=ServerPoller.js.map