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
var _InnertubeLoader_instances, _InnertubeLoader_innertube, _InnertubeLoader_pendingPromise, _InnertubeLoader_poTokenRefreshTimer, _InnertubeLoader_logger, _InnertubeLoader_onCreate, _InnertubeLoader_recreateWithPOToken, _InnertubeLoader_createInstance, _InnertubeLoader_clearPOTokenRefreshTimer, _InnertubeLoader_resolveGetInstanceResult, _InnertubeLoader_refreshPOToken, _InnertubeLoader_generatePoToken;
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const volumio_youtubei_js_1 = __importDefault(require("volumio-youtubei.js"));
const bgutils_js_1 = __importDefault(require("bgutils-js"));
const jsdom_1 = require("jsdom");
const YTCRContext_1 = __importDefault(require("./YTCRContext"));
const atob_1 = __importDefault(require("atob"));
const btoa_1 = __importDefault(require("btoa"));
// Polyfill for BGUtils
if (globalThis && !globalThis.atob) {
    globalThis.atob = atob_1.default;
}
if (globalThis && !globalThis.btoa) {
    globalThis.btoa = btoa_1.default;
}
var Stage;
(function (Stage) {
    Stage["Init"] = "1 - Init";
    Stage["PO"] = "2 - PO";
})(Stage || (Stage = {}));
class InnertubeLoader {
    constructor(logger, onCreate) {
        _InnertubeLoader_instances.add(this);
        _InnertubeLoader_innertube.set(this, null);
        _InnertubeLoader_pendingPromise.set(this, null);
        _InnertubeLoader_poTokenRefreshTimer.set(this, null);
        _InnertubeLoader_logger.set(this, null);
        _InnertubeLoader_onCreate.set(this, void 0);
        __classPrivateFieldSet(this, _InnertubeLoader_logger, logger, "f");
        __classPrivateFieldSet(this, _InnertubeLoader_onCreate, onCreate, "f");
    }
    async getInstance() {
        if (__classPrivateFieldGet(this, _InnertubeLoader_innertube, "f")) {
            return {
                innertube: __classPrivateFieldGet(this, _InnertubeLoader_innertube, "f"),
            };
        }
        if (__classPrivateFieldGet(this, _InnertubeLoader_pendingPromise, "f")) {
            return __classPrivateFieldGet(this, _InnertubeLoader_pendingPromise, "f");
        }
        __classPrivateFieldSet(this, _InnertubeLoader_pendingPromise, new Promise((resolve, reject) => {
            __classPrivateFieldGet(this, _InnertubeLoader_instances, "m", _InnertubeLoader_createInstance).call(this, Stage.Init, resolve)
                .catch((error) => {
                reject(error instanceof Error ? error : Error(String(error)));
            });
        }), "f");
        return __classPrivateFieldGet(this, _InnertubeLoader_pendingPromise, "f");
    }
    reset() {
        __classPrivateFieldGet(this, _InnertubeLoader_instances, "m", _InnertubeLoader_clearPOTokenRefreshTimer).call(this);
        if (__classPrivateFieldGet(this, _InnertubeLoader_pendingPromise, "f")) {
            __classPrivateFieldSet(this, _InnertubeLoader_pendingPromise, null, "f");
        }
        __classPrivateFieldSet(this, _InnertubeLoader_innertube, null, "f");
    }
    hasInstance() {
        return !!__classPrivateFieldGet(this, _InnertubeLoader_innertube, "f");
    }
    applyI18nConfig() {
        if (!__classPrivateFieldGet(this, _InnertubeLoader_innertube, "f")) {
            return;
        }
        const region = YTCRContext_1.default.getConfigValue('region', 'US');
        const language = YTCRContext_1.default.getConfigValue('language', 'en');
        __classPrivateFieldGet(this, _InnertubeLoader_innertube, "f").session.context.client.gl = region;
        __classPrivateFieldGet(this, _InnertubeLoader_innertube, "f").session.context.client.hl = language;
    }
}
_InnertubeLoader_innertube = new WeakMap(), _InnertubeLoader_pendingPromise = new WeakMap(), _InnertubeLoader_poTokenRefreshTimer = new WeakMap(), _InnertubeLoader_logger = new WeakMap(), _InnertubeLoader_onCreate = new WeakMap(), _InnertubeLoader_instances = new WeakSet(), _InnertubeLoader_recreateWithPOToken = async function _InnertubeLoader_recreateWithPOToken(innertube, resolve, lastToken) {
    const visitorData = lastToken?.params.visitorData || innertube.session.context.client.visitorData;
    let poTokenResult;
    if (visitorData) {
        __classPrivateFieldGet(this, _InnertubeLoader_logger, "f")?.info(`[ytcr] InnertubeLoader: obtaining po_token by visitorData...`);
        try {
            poTokenResult = await __classPrivateFieldGet(this, _InnertubeLoader_instances, "m", _InnertubeLoader_generatePoToken).call(this, visitorData);
            __classPrivateFieldGet(this, _InnertubeLoader_logger, "f")?.info(`[ytcr] InnertubeLoader: obtained po_token (expires in ${poTokenResult.ttl} seconds)`);
        }
        catch (error) {
            __classPrivateFieldGet(this, _InnertubeLoader_logger, "f")?.error('[ytcr] InnertubeLoader: failed to get poToken:', error);
        }
        if (poTokenResult) {
            __classPrivateFieldGet(this, _InnertubeLoader_logger, "f")?.info(`[ytcr] InnertubeLoader: re-create Innertube instance with po_token`);
            __classPrivateFieldGet(this, _InnertubeLoader_instances, "m", _InnertubeLoader_createInstance).call(this, Stage.PO, resolve, {
                params: {
                    visitorData
                },
                value: poTokenResult.token,
                ttl: poTokenResult.ttl,
                refreshThreshold: poTokenResult.refreshThreshold
            })
                .catch((error) => {
                __classPrivateFieldGet(this, _InnertubeLoader_logger, "f")?.error('[ytcr] InnertubeLoader: error creating Innertube instance:', error);
            });
            return;
        }
    }
    __classPrivateFieldGet(this, _InnertubeLoader_logger, "f")?.warn('[ytcr] InnertubeLoader: po_token was not used to create Innertube instance. Playback of YouTube content might fail.');
    __classPrivateFieldGet(this, _InnertubeLoader_instances, "m", _InnertubeLoader_resolveGetInstanceResult).call(this, innertube, resolve);
}, _InnertubeLoader_createInstance = async function _InnertubeLoader_createInstance(stage, resolve, poToken) {
    __classPrivateFieldGet(this, _InnertubeLoader_logger, "f")?.info(`[ytcr] InnertubeLoader: creating Innertube instance${poToken?.value ? ' with po_token' : ''}...`);
    const innertube = await volumio_youtubei_js_1.default.create({
        visitor_data: poToken?.params.visitorData,
        po_token: poToken?.value
    });
    switch (stage) {
        case Stage.Init:
            await __classPrivateFieldGet(this, _InnertubeLoader_instances, "m", _InnertubeLoader_recreateWithPOToken).call(this, innertube, resolve);
            break;
        case Stage.PO:
            __classPrivateFieldGet(this, _InnertubeLoader_instances, "m", _InnertubeLoader_resolveGetInstanceResult).call(this, innertube, resolve, poToken);
            break;
    }
}, _InnertubeLoader_clearPOTokenRefreshTimer = function _InnertubeLoader_clearPOTokenRefreshTimer() {
    if (__classPrivateFieldGet(this, _InnertubeLoader_poTokenRefreshTimer, "f")) {
        clearTimeout(__classPrivateFieldGet(this, _InnertubeLoader_poTokenRefreshTimer, "f"));
        __classPrivateFieldSet(this, _InnertubeLoader_poTokenRefreshTimer, null, "f");
    }
}, _InnertubeLoader_resolveGetInstanceResult = function _InnertubeLoader_resolveGetInstanceResult(innertube, resolve, poToken) {
    __classPrivateFieldSet(this, _InnertubeLoader_pendingPromise, null, "f");
    __classPrivateFieldSet(this, _InnertubeLoader_innertube, innertube, "f");
    this.applyI18nConfig();
    __classPrivateFieldGet(this, _InnertubeLoader_instances, "m", _InnertubeLoader_clearPOTokenRefreshTimer).call(this);
    if (poToken) {
        const { ttl, refreshThreshold = 100 } = poToken;
        if (ttl) {
            const timeout = ttl - refreshThreshold;
            __classPrivateFieldGet(this, _InnertubeLoader_logger, "f")?.info(`[ytcr] InnertubeLoader: going to refresh po_token in ${timeout} seconds`);
            __classPrivateFieldSet(this, _InnertubeLoader_poTokenRefreshTimer, setTimeout(() => __classPrivateFieldGet(this, _InnertubeLoader_instances, "m", _InnertubeLoader_refreshPOToken).call(this, poToken), timeout * 1000), "f");
        }
    }
    if (__classPrivateFieldGet(this, _InnertubeLoader_onCreate, "f")) {
        __classPrivateFieldGet(this, _InnertubeLoader_onCreate, "f").call(this, innertube);
    }
    resolve({
        innertube,
    });
}, _InnertubeLoader_refreshPOToken = function _InnertubeLoader_refreshPOToken(lastToken) {
    const innertube = __classPrivateFieldGet(this, _InnertubeLoader_innertube, "f");
    if (!innertube) {
        return;
    }
    this.reset();
    __classPrivateFieldSet(this, _InnertubeLoader_pendingPromise, new Promise((resolve) => {
        __classPrivateFieldGet(this, _InnertubeLoader_logger, "f")?.info('[ytcr] InnertubeLoader: refresh po_token');
        __classPrivateFieldGet(this, _InnertubeLoader_instances, "m", _InnertubeLoader_recreateWithPOToken).call(this, innertube, resolve, lastToken)
            .catch((error) => {
            __classPrivateFieldGet(this, _InnertubeLoader_logger, "f")?.error('[ytcr] InnertubeLoader: error creating Innertube instance (while refreshing po_token):', error);
        });
    }), "f");
}, _InnertubeLoader_generatePoToken = 
/**
 * Required for initializing innertube, otherwise videos will return 403
 * Much of this taken from https://github.com/LuanRT/BgUtils/blob/main/examples/node/index.ts
 * @returns
 */
async function _InnertubeLoader_generatePoToken(identifier) {
    const requestKey = 'O43z0dpjhgX20SCx4KAo';
    const bgConfig = {
        fetch: (url, options) => (0, node_fetch_1.default)(url, options),
        globalObj: globalThis,
        identifier,
        requestKey
    };
    const dom = new jsdom_1.JSDOM();
    Object.assign(globalThis, {
        window: dom.window,
        document: dom.window.document
    });
    const bgChallenge = await bgutils_js_1.default.Challenge.create(bgConfig);
    if (!bgChallenge) {
        throw new Error('Could not get challenge');
    }
    const interpreterJavascript = bgChallenge.interpreterJavascript.privateDoNotAccessOrElseSafeScriptWrappedValue;
    if (interpreterJavascript) {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        new Function(interpreterJavascript)();
    }
    else
        throw new Error('Could not load VM');
    const poTokenResult = await bgutils_js_1.default.PoToken.generate({
        program: bgChallenge.program,
        globalName: bgChallenge.globalName,
        bgConfig
    });
    return {
        token: poTokenResult.poToken,
        ttl: poTokenResult.integrityTokenData.estimatedTtlSecs,
        refreshThreshold: poTokenResult.integrityTokenData.mintRefreshThreshold
    };
};
exports.default = InnertubeLoader;
//# sourceMappingURL=InnertubeLoader.js.map