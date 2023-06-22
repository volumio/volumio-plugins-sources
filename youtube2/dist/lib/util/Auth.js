"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _Auth_handlers, _Auth_handlePending, _Auth_handleSuccess, _Auth_handleError, _Auth_handleUpdateCredentials;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthStatus = void 0;
const YouTube2Context_1 = __importDefault(require("../YouTube2Context"));
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
class Auth {
    static registerHandlers() {
        const innertube = YouTube2Context_1.default.get('innertube');
        if (innertube?.session) {
            innertube.session.on('auth', __classPrivateFieldGet(this, _a, "f", _Auth_handlers).onSuccess);
            innertube.session.on('auth-pending', __classPrivateFieldGet(this, _a, "f", _Auth_handlers).onPending);
            innertube.session.on('auth-error', __classPrivateFieldGet(this, _a, "f", _Auth_handlers).onError);
            innertube.session.on('update-credentials', __classPrivateFieldGet(this, _a, "f", _Auth_handlers).onCredentials);
        }
    }
    static unregisterHandlers() {
        const innertube = YouTube2Context_1.default.get('innertube');
        if (innertube?.session) {
            innertube.session.off('auth', __classPrivateFieldGet(this, _a, "f", _Auth_handlers).onSuccess);
            innertube.session.off('auth-pending', __classPrivateFieldGet(this, _a, "f", _Auth_handlers).onPending);
            innertube.session.off('auth-error', __classPrivateFieldGet(this, _a, "f", _Auth_handlers).onError);
            innertube.session.off('update-credentials', __classPrivateFieldGet(this, _a, "f", _Auth_handlers).onCredentials);
        }
    }
    static signIn() {
        const innertube = YouTube2Context_1.default.get('innertube');
        if (innertube?.session) {
            const credentials = YouTube2Context_1.default.getConfigValue('authCredentials');
            if (credentials) {
                YouTube2Context_1.default.set('authStatusInfo', {
                    status: AuthStatus.SigningIn
                });
            }
            else {
                YouTube2Context_1.default.set('authStatusInfo', INITIAL_SIGNED_OUT_STATUS);
            }
            YouTube2Context_1.default.refreshUIConfig();
            innertube.session.signIn(credentials);
        }
    }
    static signOut() {
        const innertube = YouTube2Context_1.default.get('innertube');
        if (innertube?.session?.logged_in) {
            innertube.session.signOut();
            YouTube2Context_1.default.deleteConfigValue('authCredentials');
            YouTube2Context_1.default.toast('success', YouTube2Context_1.default.getI18n('YOUTUBE2_SIGNED_OUT'));
            // Sign in again with empty credentials to reset status to SIGNED_OUT
            // And obtain new device code
            this.signIn();
        }
    }
    static getAuthStatus() {
        return YouTube2Context_1.default.get('authStatusInfo') || INITIAL_SIGNED_OUT_STATUS;
    }
}
exports.default = Auth;
_a = Auth, _Auth_handlePending = function _Auth_handlePending(data) {
    YouTube2Context_1.default.set('authStatusInfo', {
        status: AuthStatus.SignedOut,
        verificationInfo: {
            verificationUrl: data.verification_url,
            userCode: data.user_code
        }
    });
    YouTube2Context_1.default.refreshUIConfig();
}, _Auth_handleSuccess = function _Auth_handleSuccess(data) {
    YouTube2Context_1.default.set('authStatusInfo', {
        status: AuthStatus.SignedIn
    });
    YouTube2Context_1.default.setConfigValue('authCredentials', data.credentials);
    YouTube2Context_1.default.toast('success', YouTube2Context_1.default.getI18n('YOUTUBE2_SIGN_IN_SUCCESS'));
    YouTube2Context_1.default.refreshUIConfig();
}, _Auth_handleError = function _Auth_handleError(err) {
    if (err.info.status === 'DEVICE_CODE_EXPIRED') {
        YouTube2Context_1.default.set('authStatusInfo', INITIAL_SIGNED_OUT_STATUS);
    }
    else {
        YouTube2Context_1.default.set('authStatusInfo', {
            status: AuthStatus.Error,
            error: err
        });
        YouTube2Context_1.default.toast('error', YouTube2Context_1.default.getI18n('YOUTUBE2_ERR_SIGN_IN', YouTube2Context_1.default.getErrorMessage('', err, false)));
    }
    YouTube2Context_1.default.refreshUIConfig();
}, _Auth_handleUpdateCredentials = function _Auth_handleUpdateCredentials(data) {
    YouTube2Context_1.default.setConfigValue('authCredentials', data.credentials);
};
_Auth_handlers = { value: {
        onSuccess: __classPrivateFieldGet(Auth, _a, "m", _Auth_handleSuccess).bind(Auth),
        onPending: __classPrivateFieldGet(Auth, _a, "m", _Auth_handlePending).bind(Auth),
        onError: __classPrivateFieldGet(Auth, _a, "m", _Auth_handleError).bind(Auth),
        onCredentials: __classPrivateFieldGet(Auth, _a, "m", _Auth_handleUpdateCredentials).bind(Auth)
    } };
//# sourceMappingURL=Auth.js.map