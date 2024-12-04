"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _InnertubeLoader_innertube, _InnertubeLoader_pendingPromise, _InnertubeLoader_poTokenRefreshTimer, _InnertubeLoader_recreateWithPOToken, _InnertubeLoader_createInstance, _InnertubeLoader_clearPOTokenRefreshTimer, _InnertubeLoader_resolveGetInstanceResult, _InnertubeLoader_refreshPOToken, _InnertubeLoader_generatePoToken;
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const YouTube2Context_1 = __importDefault(require("../YouTube2Context"));
const volumio_youtubei_js_1 = __importDefault(require("volumio-youtubei.js"));
const bgutils_js_1 = __importDefault(require("bgutils-js"));
const jsdom_1 = require("jsdom");
const AccountModelHelper_1 = require("./AccountModelHelper");
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
    static async getInstance() {
        if (__classPrivateFieldGet(this, _a, "f", _InnertubeLoader_innertube)) {
            return {
                innertube: __classPrivateFieldGet(this, _a, "f", _InnertubeLoader_innertube),
            };
        }
        if (__classPrivateFieldGet(this, _a, "f", _InnertubeLoader_pendingPromise)) {
            return __classPrivateFieldGet(this, _a, "f", _InnertubeLoader_pendingPromise);
        }
        __classPrivateFieldSet(this, _a, new Promise((resolve, reject) => {
            __classPrivateFieldGet(this, _a, "m", _InnertubeLoader_createInstance).call(this, Stage.Init, resolve)
                .catch((error) => {
                reject(error instanceof Error ? error : Error(String(error)));
            });
        }), "f", _InnertubeLoader_pendingPromise);
        return __classPrivateFieldGet(this, _a, "f", _InnertubeLoader_pendingPromise);
    }
    static reset() {
        __classPrivateFieldGet(this, _a, "m", _InnertubeLoader_clearPOTokenRefreshTimer).call(this);
        if (__classPrivateFieldGet(this, _a, "f", _InnertubeLoader_pendingPromise)) {
            __classPrivateFieldSet(this, _a, null, "f", _InnertubeLoader_pendingPromise);
        }
        __classPrivateFieldSet(this, _a, null, "f", _InnertubeLoader_innertube);
    }
    static hasInstance() {
        return !!__classPrivateFieldGet(this, _a, "f", _InnertubeLoader_innertube);
    }
    static applyI18nConfig() {
        if (!__classPrivateFieldGet(this, _a, "f", _InnertubeLoader_innertube)) {
            return;
        }
        const region = YouTube2Context_1.default.getConfigValue('region');
        const language = YouTube2Context_1.default.getConfigValue('language');
        __classPrivateFieldGet(this, _a, "f", _InnertubeLoader_innertube).session.context.client.gl = region;
        __classPrivateFieldGet(this, _a, "f", _InnertubeLoader_innertube).session.context.client.hl = language;
    }
}
_a = InnertubeLoader, _InnertubeLoader_recreateWithPOToken = async function _InnertubeLoader_recreateWithPOToken(innertube, resolve, lastToken) {
    const visitorData = lastToken?.params.visitorData || innertube.session.context.client.visitorData;
    let identifier = visitorData ? {
        type: 'visitorData',
        value: visitorData
    } : null;
    const lastIdentifier = lastToken?.params.identifier;
    if (lastIdentifier) {
        identifier = lastIdentifier;
    }
    else {
        const account = await (0, AccountModelHelper_1.getAccountInitialInfo)(innertube);
        if (account.isSignedIn) {
            const activeChannelHandle = YouTube2Context_1.default.getConfigValue('activeChannelHandle');
            let target;
            if (activeChannelHandle && account.list.length > 1) {
                target = account.list.find((ac) => ac.handle === activeChannelHandle);
                if (!target) {
                    YouTube2Context_1.default.toast('warning', YouTube2Context_1.default.getI18n('YOUTUBE2_ERR_UNKNOWN_CHANNEL_HANDLE', activeChannelHandle));
                    target = account.active;
                }
            }
            else {
                target = account.active;
            }
            const pageId = target?.pageId || undefined;
            const datasyncIdToken = target?.datasyncIdToken || undefined;
            if (datasyncIdToken) {
                identifier = {
                    type: 'datasyncIdToken',
                    value: datasyncIdToken,
                    pageId
                };
            }
            else {
                YouTube2Context_1.default.getLogger().warn('[youtube2] InnertubeLoader: signed in but could not get datasyncIdToken for fetching po_token - will use visitorData instead');
            }
        }
    }
    let poTokenResult;
    if (identifier) {
        YouTube2Context_1.default.getLogger().info(`[youtube2] InnertubeLoader: obtaining po_token by ${identifier.type}...`);
        try {
            poTokenResult = await __classPrivateFieldGet(this, _a, "m", _InnertubeLoader_generatePoToken).call(this, identifier.value);
            YouTube2Context_1.default.getLogger().info(`[youtube2] InnertubeLoader: obtained po_token (expires in ${poTokenResult.ttl} seconds)`);
        }
        catch (error) {
            YouTube2Context_1.default.getLogger().error(YouTube2Context_1.default.getErrorMessage('[youtube2] InnertubeLoader: failed to get poToken: ', error, false));
        }
        if (poTokenResult) {
            YouTube2Context_1.default.getLogger().info(`[youtube2] InnertubeLoader: re-create Innertube instance with po_token`);
            __classPrivateFieldGet(this, _a, "m", _InnertubeLoader_createInstance).call(this, Stage.PO, resolve, {
                params: {
                    visitorData,
                    identifier,
                },
                value: poTokenResult.token,
                ttl: poTokenResult.ttl,
                refreshThreshold: poTokenResult.refreshThreshold
            })
                .catch((error) => {
                YouTube2Context_1.default.getLogger().error(YouTube2Context_1.default.getErrorMessage(`[youtube2] InnertubeLoader: error creating Innertube instance:`, error));
            });
            return;
        }
    }
    YouTube2Context_1.default.getLogger().warn('[youtube2] InnertubeLoader: po_token was not used to create Innertube instance. Playback of YouTube content might fail.');
    __classPrivateFieldGet(this, _a, "m", _InnertubeLoader_resolveGetInstanceResult).call(this, innertube, resolve);
}, _InnertubeLoader_createInstance = async function _InnertubeLoader_createInstance(stage, resolve, poToken) {
    const usedParams = [];
    if (poToken?.value) {
        usedParams.push('po_token');
    }
    if (poToken?.params.identifier.pageId) {
        usedParams.push('page_id');
    }
    const usedParamsStr = usedParams.length > 0 ? ` with ${usedParams.join(' + ')}` : '';
    YouTube2Context_1.default.getLogger().info(`[youtube2] InnertubeLoader: creating Innertube instance${usedParamsStr}...`);
    const innertube = await volumio_youtubei_js_1.default.create({
        cookie: YouTube2Context_1.default.getConfigValue('cookie') || undefined,
        visitor_data: poToken?.params.visitorData,
        on_behalf_of_user: poToken?.params.identifier.pageId,
        po_token: poToken?.value
    });
    switch (stage) {
        case Stage.Init:
            await __classPrivateFieldGet(this, _a, "m", _InnertubeLoader_recreateWithPOToken).call(this, innertube, resolve);
            break;
        case Stage.PO:
            __classPrivateFieldGet(this, _a, "m", _InnertubeLoader_resolveGetInstanceResult).call(this, innertube, resolve, poToken);
            break;
    }
}, _InnertubeLoader_clearPOTokenRefreshTimer = function _InnertubeLoader_clearPOTokenRefreshTimer() {
    if (__classPrivateFieldGet(this, _a, "f", _InnertubeLoader_poTokenRefreshTimer)) {
        clearTimeout(__classPrivateFieldGet(this, _a, "f", _InnertubeLoader_poTokenRefreshTimer));
        __classPrivateFieldSet(this, _a, null, "f", _InnertubeLoader_poTokenRefreshTimer);
    }
}, _InnertubeLoader_resolveGetInstanceResult = function _InnertubeLoader_resolveGetInstanceResult(innertube, resolve, poToken) {
    __classPrivateFieldSet(this, _a, null, "f", _InnertubeLoader_pendingPromise);
    __classPrivateFieldSet(this, _a, innertube, "f", _InnertubeLoader_innertube);
    this.applyI18nConfig();
    __classPrivateFieldGet(this, _a, "m", _InnertubeLoader_clearPOTokenRefreshTimer).call(this);
    if (poToken) {
        const { ttl, refreshThreshold = 100 } = poToken;
        if (ttl) {
            const timeout = ttl - refreshThreshold;
            YouTube2Context_1.default.getLogger().info(`[youtube2] InnertubeLoader: going to refresh po_token in ${timeout} seconds`);
            __classPrivateFieldSet(this, _a, setTimeout(() => __classPrivateFieldGet(this, _a, "m", _InnertubeLoader_refreshPOToken).call(this, poToken), timeout * 1000), "f", _InnertubeLoader_poTokenRefreshTimer);
        }
    }
    resolve({
        innertube,
    });
}, _InnertubeLoader_refreshPOToken = function _InnertubeLoader_refreshPOToken(lastToken) {
    const innertube = __classPrivateFieldGet(this, _a, "f", _InnertubeLoader_innertube);
    if (!innertube) {
        return;
    }
    this.reset();
    __classPrivateFieldSet(this, _a, new Promise((resolve) => {
        YouTube2Context_1.default.getLogger().info('[youtube2] InnertubeLoader: refresh po_token');
        __classPrivateFieldGet(this, _a, "m", _InnertubeLoader_recreateWithPOToken).call(this, innertube, resolve, lastToken)
            .catch((error) => {
            YouTube2Context_1.default.getLogger().error(YouTube2Context_1.default.getErrorMessage(`[youtube2] InnertubeLoader: error creating Innertube instance (while refreshing po_token):`, error));
        });
    }), "f", _InnertubeLoader_pendingPromise);
}, _InnertubeLoader_generatePoToken = async function _InnertubeLoader_generatePoToken(identifier) {
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
_InnertubeLoader_innertube = { value: null };
_InnertubeLoader_pendingPromise = { value: null };
_InnertubeLoader_poTokenRefreshTimer = { value: null };
exports.default = InnertubeLoader;
//# sourceMappingURL=InnertubeLoader.js.map