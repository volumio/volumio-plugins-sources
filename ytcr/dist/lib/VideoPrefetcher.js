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
var _VideoPrefetcher_instances, _VideoPrefetcher_videoLoader, _VideoPrefetcher_startPrefetchTimer, _VideoPrefetcher_prefetchVideoAbortController, _VideoPrefetcher_target, _VideoPrefetcher_logger, _VideoPrefetcher_prefetch, _VideoPrefetcher_clearPrefetchTimer;
Object.defineProperty(exports, "__esModule", { value: true });
const abort_controller_1 = __importDefault(require("abort-controller"));
const events_1 = __importDefault(require("events"));
class VideoPrefetcher extends events_1.default {
    constructor(videoLoader, logger) {
        super();
        _VideoPrefetcher_instances.add(this);
        _VideoPrefetcher_videoLoader.set(this, void 0);
        _VideoPrefetcher_startPrefetchTimer.set(this, void 0);
        _VideoPrefetcher_prefetchVideoAbortController.set(this, void 0);
        _VideoPrefetcher_target.set(this, void 0);
        _VideoPrefetcher_logger.set(this, void 0);
        __classPrivateFieldSet(this, _VideoPrefetcher_videoLoader, videoLoader, "f");
        __classPrivateFieldSet(this, _VideoPrefetcher_startPrefetchTimer, null, "f");
        __classPrivateFieldSet(this, _VideoPrefetcher_prefetchVideoAbortController, null, "f");
        __classPrivateFieldSet(this, _VideoPrefetcher_target, null, "f");
        __classPrivateFieldSet(this, _VideoPrefetcher_logger, logger, "f");
    }
    startPrefetchOnTimeout(video, seconds) {
        this.abortPrefetch();
        __classPrivateFieldSet(this, _VideoPrefetcher_startPrefetchTimer, setTimeout(__classPrivateFieldGet(this, _VideoPrefetcher_instances, "m", _VideoPrefetcher_prefetch).bind(this, video), seconds * 1000), "f");
        __classPrivateFieldSet(this, _VideoPrefetcher_target, video, "f");
        __classPrivateFieldGet(this, _VideoPrefetcher_logger, "f").debug(`[ytcr] Going to prefetch ${video.id} in ${seconds}s`);
    }
    abortPrefetch() {
        __classPrivateFieldGet(this, _VideoPrefetcher_instances, "m", _VideoPrefetcher_clearPrefetchTimer).call(this);
        if (__classPrivateFieldGet(this, _VideoPrefetcher_prefetchVideoAbortController, "f")) {
            __classPrivateFieldGet(this, _VideoPrefetcher_prefetchVideoAbortController, "f").abort();
            __classPrivateFieldSet(this, _VideoPrefetcher_prefetchVideoAbortController, null, "f");
        }
        __classPrivateFieldSet(this, _VideoPrefetcher_target, null, "f");
    }
    isPrefetching() {
        return !!__classPrivateFieldGet(this, _VideoPrefetcher_prefetchVideoAbortController, "f");
    }
    isPending() {
        return !!__classPrivateFieldGet(this, _VideoPrefetcher_startPrefetchTimer, "f");
    }
    getCurrentTarget() {
        return __classPrivateFieldGet(this, _VideoPrefetcher_target, "f");
    }
}
exports.default = VideoPrefetcher;
_VideoPrefetcher_videoLoader = new WeakMap(), _VideoPrefetcher_startPrefetchTimer = new WeakMap(), _VideoPrefetcher_prefetchVideoAbortController = new WeakMap(), _VideoPrefetcher_target = new WeakMap(), _VideoPrefetcher_logger = new WeakMap(), _VideoPrefetcher_instances = new WeakSet(), _VideoPrefetcher_prefetch = async function _VideoPrefetcher_prefetch(video) {
    __classPrivateFieldGet(this, _VideoPrefetcher_instances, "m", _VideoPrefetcher_clearPrefetchTimer).call(this);
    __classPrivateFieldSet(this, _VideoPrefetcher_prefetchVideoAbortController, new abort_controller_1.default(), "f");
    try {
        __classPrivateFieldGet(this, _VideoPrefetcher_logger, "f").debug(`[ytcr] Begin prefetching ${video.id}...`);
        const videoInfo = await __classPrivateFieldGet(this, _VideoPrefetcher_videoLoader, "f").getInfo(video, __classPrivateFieldGet(this, _VideoPrefetcher_prefetchVideoAbortController, "f").signal);
        __classPrivateFieldGet(this, _VideoPrefetcher_logger, "f").debug(`[ytcr] Prefetched info for ${video.id}:`, videoInfo);
        this.emit('prefetch', videoInfo);
    }
    catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            __classPrivateFieldGet(this, _VideoPrefetcher_logger, "f").debug(`[ytcr] Prefetch aborted for ${video.id}`);
        }
        else {
            __classPrivateFieldGet(this, _VideoPrefetcher_logger, "f").error(`[ytcr] Failed to prefetch ${video.id}:`, error);
        }
    }
    finally {
        __classPrivateFieldSet(this, _VideoPrefetcher_prefetchVideoAbortController, null, "f");
        if (!this.isPending()) {
            __classPrivateFieldSet(this, _VideoPrefetcher_target, null, "f");
        }
    }
}, _VideoPrefetcher_clearPrefetchTimer = function _VideoPrefetcher_clearPrefetchTimer() {
    if (__classPrivateFieldGet(this, _VideoPrefetcher_startPrefetchTimer, "f")) {
        clearTimeout(__classPrivateFieldGet(this, _VideoPrefetcher_startPrefetchTimer, "f"));
        __classPrivateFieldSet(this, _VideoPrefetcher_startPrefetchTimer, null, "f");
    }
};
//# sourceMappingURL=VideoPrefetcher.js.map