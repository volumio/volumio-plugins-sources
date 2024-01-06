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
var _Cache_instances, _Cache_ttl, _Cache_maxEntries, _Cache_cache, _Cache_enabled, _Cache_reduceEntries;
Object.defineProperty(exports, "__esModule", { value: true });
const node_cache_1 = __importDefault(require("node-cache"));
class Cache {
    constructor(ttl = {}, maxEntries = {}) {
        _Cache_instances.add(this);
        _Cache_ttl.set(this, void 0);
        _Cache_maxEntries.set(this, void 0);
        _Cache_cache.set(this, void 0);
        _Cache_enabled.set(this, void 0);
        __classPrivateFieldSet(this, _Cache_ttl, ttl, "f");
        __classPrivateFieldSet(this, _Cache_maxEntries, maxEntries, "f");
        __classPrivateFieldSet(this, _Cache_cache, new node_cache_1.default({
            checkperiod: 600
        }), "f");
        __classPrivateFieldSet(this, _Cache_enabled, true, "f");
    }
    setTTL(type, ttl) {
        if (__classPrivateFieldGet(this, _Cache_ttl, "f")[type] != ttl) {
            const keys = this.getKeys(type);
            for (const key of keys) {
                __classPrivateFieldGet(this, _Cache_cache, "f").ttl(key, ttl);
            }
        }
        __classPrivateFieldGet(this, _Cache_ttl, "f")[type] = ttl;
    }
    setMaxEntries(type, maxEntries) {
        __classPrivateFieldGet(this, _Cache_instances, "m", _Cache_reduceEntries).call(this, type, maxEntries);
        __classPrivateFieldGet(this, _Cache_maxEntries, "f")[type] = maxEntries;
    }
    getMaxEntries(type) {
        return __classPrivateFieldGet(this, _Cache_maxEntries, "f")[type] !== undefined ? __classPrivateFieldGet(this, _Cache_maxEntries, "f")[type] : -1;
    }
    isEnabled() {
        return __classPrivateFieldGet(this, _Cache_enabled, "f");
    }
    setEnabled(value) {
        __classPrivateFieldSet(this, _Cache_enabled, value, "f");
    }
    get(type, key) {
        if (!this.isEnabled()) {
            return undefined;
        }
        return __classPrivateFieldGet(this, _Cache_cache, "f").get(`${type}.${key}`);
    }
    put(type, key, value) {
        if (!this.isEnabled()) {
            return;
        }
        const maxEntries = this.getMaxEntries(type);
        if (maxEntries === 0) {
            return false;
        }
        else if (maxEntries > 0) {
            __classPrivateFieldGet(this, _Cache_instances, "m", _Cache_reduceEntries).call(this, type, maxEntries - 1);
        }
        return __classPrivateFieldGet(this, _Cache_cache, "f").set(`${type}.${key}`, value, __classPrivateFieldGet(this, _Cache_ttl, "f")[type]);
    }
    getKeys(type) {
        return __classPrivateFieldGet(this, _Cache_cache, "f").keys().filter((key) => key.startsWith(`${type}.`));
    }
    clear(type) {
        if (!type) {
            __classPrivateFieldGet(this, _Cache_cache, "f").flushAll();
        }
        else {
            this.getKeys(type).forEach((key) => {
                __classPrivateFieldGet(this, _Cache_cache, "f").del(key);
            });
        }
    }
    async getOrSet(type, key, promiseCallback) {
        if (!this.isEnabled()) {
            return promiseCallback();
        }
        const cachedValue = this.get(type, key);
        if (cachedValue !== undefined) {
            return cachedValue;
        }
        return promiseCallback().then((value) => {
            this.put(type, key, value);
            return value;
        });
    }
}
exports.default = Cache;
_Cache_ttl = new WeakMap(), _Cache_maxEntries = new WeakMap(), _Cache_cache = new WeakMap(), _Cache_enabled = new WeakMap(), _Cache_instances = new WeakSet(), _Cache_reduceEntries = function _Cache_reduceEntries(type, reduceTo) {
    if (reduceTo === undefined) {
        reduceTo = this.getMaxEntries(type);
    }
    if (reduceTo < 0) {
        return;
    }
    const keys = this.getKeys(type);
    if (keys.length > reduceTo) {
        for (let i = 0; i < keys.length - reduceTo; i++) {
            __classPrivateFieldGet(this, _Cache_cache, "f").del(keys[i]);
        }
    }
};
//# sourceMappingURL=Cache.js.map