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
var _Auth_instances, _Auth_innertube, _Auth_handlers, _Auth_handlePending, _Auth_handleSuccess, _Auth_handleError, _Auth_registerHandlers, _Auth_unregisterHandlers;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthEvent = exports.AuthStatus = void 0;
const events_1 = __importDefault(require("events"));
const YTMusicContext_1 = __importDefault(require("../YTMusicContext"));
var AuthStatus;
(function (AuthStatus) {
    AuthStatus["SignedIn"] = "SignedIn";
    AuthStatus["SignedOut"] = "SignedOut";
    AuthStatus["SigningIn"] = "SigningIn";
    AuthStatus["Error"] = "Error";
})(AuthStatus = exports.AuthStatus || (exports.AuthStatus = {}));
const INITIAL_SIGNED_OUT_STATUS = {
    status: AuthStatus.SignedOut,
    verificationInfo: null
};
var AuthEvent;
(function (AuthEvent) {
    AuthEvent["SignIn"] = "SignIn";
    AuthEvent["Pending"] = "Pending";
    AuthEvent["Error"] = "Error";
})(AuthEvent = exports.AuthEvent || (exports.AuthEvent = {}));
class Auth extends events_1.default {
    constructor() {
        super();
        _Auth_instances.add(this);
        _Auth_innertube.set(this, void 0);
        _Auth_handlers.set(this, void 0);
        __classPrivateFieldSet(this, _Auth_innertube, null, "f");
    }
    static create(innertube) {
        const auth = new Auth();
        __classPrivateFieldSet(auth, _Auth_innertube, innertube, "f");
        __classPrivateFieldSet(auth, _Auth_handlers, {
            onSuccess: __classPrivateFieldGet(auth, _Auth_instances, "m", _Auth_handleSuccess).bind(auth),
            onPending: __classPrivateFieldGet(auth, _Auth_instances, "m", _Auth_handlePending).bind(auth),
            onError: __classPrivateFieldGet(auth, _Auth_instances, "m", _Auth_handleError).bind(auth),
            onCredentials: __classPrivateFieldGet(auth, _Auth_instances, "m", _Auth_handleSuccess).bind(auth)
        }, "f");
        __classPrivateFieldGet(auth, _Auth_instances, "m", _Auth_registerHandlers).call(auth);
        return auth;
    }
    dispose() {
        __classPrivateFieldGet(this, _Auth_instances, "m", _Auth_unregisterHandlers).call(this);
        this.removeAllListeners();
        __classPrivateFieldSet(this, _Auth_innertube, null, "f");
    }
    signIn() {
        if (__classPrivateFieldGet(this, _Auth_innertube, "f")?.session) {
            const credentials = YTMusicContext_1.default.getConfigValue('authCredentials');
            if (credentials) {
                YTMusicContext_1.default.set('authStatusInfo', {
                    status: AuthStatus.SigningIn
                });
            }
            else {
                YTMusicContext_1.default.set('authStatusInfo', INITIAL_SIGNED_OUT_STATUS);
            }
            YTMusicContext_1.default.refreshUIConfig();
            __classPrivateFieldGet(this, _Auth_innertube, "f").session.signIn(credentials);
        }
    }
    async signOut() {
        if (__classPrivateFieldGet(this, _Auth_innertube, "f")?.session?.logged_in) {
            await __classPrivateFieldGet(this, _Auth_innertube, "f").session.signOut();
            YTMusicContext_1.default.deleteConfigValue('authCredentials');
            YTMusicContext_1.default.toast('success', YTMusicContext_1.default.getI18n('YTMUSIC_SIGNED_OUT'));
            // Sign in again with empty credentials to reset status to SIGNED_OUT
            // And obtain new device code
            this.signIn();
        }
    }
    getStatus() {
        return YTMusicContext_1.default.get('authStatusInfo') || INITIAL_SIGNED_OUT_STATUS;
    }
}
exports.default = Auth;
_Auth_innertube = new WeakMap(), _Auth_handlers = new WeakMap(), _Auth_instances = new WeakSet(), _Auth_handlePending = function _Auth_handlePending(data) {
    YTMusicContext_1.default.set('authStatusInfo', {
        status: AuthStatus.SignedOut,
        verificationInfo: {
            verificationUrl: data.verification_url,
            userCode: data.user_code
        }
    });
    YTMusicContext_1.default.refreshUIConfig();
    this.emit(AuthEvent.Pending);
}, _Auth_handleSuccess = function _Auth_handleSuccess(data) {
    const oldStatusInfo = YTMusicContext_1.default.get('authStatusInfo');
    YTMusicContext_1.default.set('authStatusInfo', {
        status: AuthStatus.SignedIn
    });
    YTMusicContext_1.default.setConfigValue('authCredentials', data.credentials);
    if (!oldStatusInfo || oldStatusInfo.status !== AuthStatus.SignedIn) {
        YTMusicContext_1.default.getLogger().info('[ytmusic] Auth success');
        YTMusicContext_1.default.toast('success', YTMusicContext_1.default.getI18n('YTMUSIC_SIGN_IN_SUCCESS'));
        YTMusicContext_1.default.refreshUIConfig();
        this.emit(AuthEvent.SignIn);
    }
    else {
        YTMusicContext_1.default.getLogger().info('[ytmusic] Auth credentials updated');
    }
}, _Auth_handleError = function _Auth_handleError(err) {
    if (err.info.status === 'DEVICE_CODE_EXPIRED') {
        YTMusicContext_1.default.set('authStatusInfo', INITIAL_SIGNED_OUT_STATUS);
    }
    else {
        YTMusicContext_1.default.set('authStatusInfo', {
            status: AuthStatus.Error,
            error: err
        });
        YTMusicContext_1.default.toast('error', YTMusicContext_1.default.getI18n('YTMUSIC_ERR_SIGN_IN', YTMusicContext_1.default.getErrorMessage('', err, false)));
    }
    YTMusicContext_1.default.refreshUIConfig();
    this.emit(AuthEvent.Error);
}, _Auth_registerHandlers = function _Auth_registerHandlers() {
    if (__classPrivateFieldGet(this, _Auth_innertube, "f")?.session) {
        __classPrivateFieldGet(this, _Auth_innertube, "f").session.on('auth', __classPrivateFieldGet(this, _Auth_handlers, "f").onSuccess);
        __classPrivateFieldGet(this, _Auth_innertube, "f").session.on('auth-pending', __classPrivateFieldGet(this, _Auth_handlers, "f").onPending);
        __classPrivateFieldGet(this, _Auth_innertube, "f").session.on('auth-error', __classPrivateFieldGet(this, _Auth_handlers, "f").onError);
        __classPrivateFieldGet(this, _Auth_innertube, "f").session.on('update-credentials', __classPrivateFieldGet(this, _Auth_handlers, "f").onCredentials);
    }
}, _Auth_unregisterHandlers = function _Auth_unregisterHandlers() {
    if (__classPrivateFieldGet(this, _Auth_innertube, "f")?.session) {
        __classPrivateFieldGet(this, _Auth_innertube, "f").session.off('auth', __classPrivateFieldGet(this, _Auth_handlers, "f").onSuccess);
        __classPrivateFieldGet(this, _Auth_innertube, "f").session.off('auth-pending', __classPrivateFieldGet(this, _Auth_handlers, "f").onPending);
        __classPrivateFieldGet(this, _Auth_innertube, "f").session.off('auth-error', __classPrivateFieldGet(this, _Auth_handlers, "f").onError);
        __classPrivateFieldGet(this, _Auth_innertube, "f").session.off('update-credentials', __classPrivateFieldGet(this, _Auth_handlers, "f").onCredentials);
    }
};
//# sourceMappingURL=Auth.js.map