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
var _Cache_ttl, _Cache_maxEntries, _Cache_cache;
Object.defineProperty(exports, "__esModule", { value: true });
const node_cache_1 = __importDefault(require("node-cache"));
class Cache {
    constructor(ttl, maxEntries) {
        _Cache_ttl.set(this, void 0);
        _Cache_maxEntries.set(this, void 0);
        _Cache_cache.set(this, void 0);
        __classPrivateFieldSet(this, _Cache_ttl, ttl, "f");
        __classPrivateFieldSet(this, _Cache_maxEntries, maxEntries, "f");
        __classPrivateFieldSet(this, _Cache_cache, new node_cache_1.default({
            checkperiod: 600,
            useClones: false
        }), "f");
    }
    setTTL(ttl) {
        if (__classPrivateFieldGet(this, _Cache_ttl, "f") != ttl) {
            const keys = __classPrivateFieldGet(this, _Cache_cache, "f").keys();
            keys.forEach((key) => {
                __classPrivateFieldGet(this, _Cache_cache, "f").ttl(key, ttl);
            });
        }
        __classPrivateFieldSet(this, _Cache_ttl, ttl, "f");
    }
    setMaxEntries(maxEntries) {
        const keyCount = __classPrivateFieldGet(this, _Cache_cache, "f").keys().length;
        if (keyCount > maxEntries) {
            const keys = __classPrivateFieldGet(this, _Cache_cache, "f").keys();
            for (let i = 0; i < keyCount - maxEntries; i++) {
                __classPrivateFieldGet(this, _Cache_cache, "f").del(keys[i]);
            }
        }
        __classPrivateFieldSet(this, _Cache_maxEntries, maxEntries, "f");
    }
    get(key) {
        return __classPrivateFieldGet(this, _Cache_cache, "f").get(key);
    }
    put(key, value) {
        const keys = __classPrivateFieldGet(this, _Cache_cache, "f").keys();
        if (keys.length === __classPrivateFieldGet(this, _Cache_maxEntries, "f")) {
            __classPrivateFieldGet(this, _Cache_cache, "f").del(keys[0]);
        }
        return __classPrivateFieldGet(this, _Cache_cache, "f").set(key, value, __classPrivateFieldGet(this, _Cache_ttl, "f"));
    }
    clear() {
        __classPrivateFieldGet(this, _Cache_cache, "f").flushAll();
    }
    close() {
        __classPrivateFieldGet(this, _Cache_cache, "f").close();
    }
    getEntryCount() {
        return __classPrivateFieldGet(this, _Cache_cache, "f").getStats().keys;
    }
    getMemoryUsageInKB() {
        return (__classPrivateFieldGet(this, _Cache_cache, "f").getStats().vsize + __classPrivateFieldGet(this, _Cache_cache, "f").getStats().ksize) / 1000;
    }
    async getOrSet(key, promiseCallback) {
        const cachedValue = this.get(key);
        if (cachedValue !== undefined) {
            return cachedValue;
        }
        const value = await promiseCallback();
        this.put(key, value);
        return value;
    }
}
exports.default = Cache;
_Cache_ttl = new WeakMap(), _Cache_maxEntries = new WeakMap(), _Cache_cache = new WeakMap();
//# sourceMappingURL=Cache.js.map