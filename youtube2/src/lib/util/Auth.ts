import Innertube, { Credentials, OAuthAuthPendingData, Utils as YTUtils } from 'volumio-youtubei.js';
import yt2 from '../YouTube2Context';

export enum AuthStatus {
  SignedIn = 'SignedIn',
  SignedOut = 'SignedOut',
  SigningIn = 'SigningIn',
  Error = 'Error'
}

export interface AuthStatusInfo {
  status: AuthStatus;
  verificationInfo?: {
    verificationUrl: string,
    userCode: string
  } | null;
  error?: YTUtils.OAuthError;
}

const INITIAL_SIGNED_OUT_STATUS: AuthStatusInfo = {
  status: AuthStatus.SignedOut,
  verificationInfo: null
};

export default class Auth {

  static #handlers = {
    onSuccess: Auth.#handleSuccess.bind(Auth),
    onPending: Auth.#handlePending.bind(Auth),
    onError: Auth.#handleError.bind(Auth),
    onCredentials: Auth.#handleUpdateCredentials.bind(Auth)
  };

  static #handlePending(data: OAuthAuthPendingData) {
    yt2.set<AuthStatusInfo>('authStatusInfo', {
      status: AuthStatus.SignedOut,
      verificationInfo: {
        verificationUrl: data.verification_url,
        userCode: data.user_code
      }
    });

    yt2.refreshUIConfig();
  }

  static #handleSuccess(data: { credentials: Credentials }) {
    yt2.set<AuthStatusInfo>('authStatusInfo', {
      status: AuthStatus.SignedIn
    });

    yt2.setConfigValue('authCredentials', data.credentials);

    yt2.toast('success', yt2.getI18n('YOUTUBE2_SIGN_IN_SUCCESS'));
    yt2.refreshUIConfig();
  }

  static #handleError(err: YTUtils.OAuthError) {
    if (err.info.status === 'DEVICE_CODE_EXPIRED') {
      yt2.set('authStatusInfo', INITIAL_SIGNED_OUT_STATUS);
    }
    else {
      yt2.set<AuthStatusInfo>('authStatusInfo', {
        status: AuthStatus.Error,
        error: err
      });

      yt2.toast('error', yt2.getI18n('YOUTUBE2_ERR_SIGN_IN',
        yt2.getErrorMessage('', err, false)));
    }

    yt2.refreshUIConfig();
  }

  static #handleUpdateCredentials(data: { credentials: Credentials }) {
    yt2.setConfigValue('authCredentials', data.credentials);
  }

  static registerHandlers() {
    const innertube = yt2.get<Innertube>('innertube');
    if (innertube?.session) {
      innertube.session.on('auth', this.#handlers.onSuccess);
      innertube.session.on('auth-pending', this.#handlers.onPending);
      innertube.session.on('auth-error', this.#handlers.onError);
      innertube.session.on('update-credentials', this.#handlers.onCredentials);
    }
  }

  static unregisterHandlers() {
    const innertube = yt2.get<Innertube>('innertube');
    if (innertube?.session) {
      innertube.session.off('auth', this.#handlers.onSuccess);
      innertube.session.off('auth-pending', this.#handlers.onPending);
      innertube.session.off('auth-error', this.#handlers.onError);
      innertube.session.off('update-credentials', this.#handlers.onCredentials);
    }
  }

  static signIn() {
    const innertube = yt2.get<Innertube>('innertube');
    if (innertube?.session) {
      const credentials = yt2.getConfigValue('authCredentials');
      if (credentials) {
        yt2.set<AuthStatusInfo>('authStatusInfo', {
          status: AuthStatus.SigningIn
        });
      }
      else {
        yt2.set('authStatusInfo', INITIAL_SIGNED_OUT_STATUS);
      }

      yt2.refreshUIConfig();
      innertube.session.signIn(credentials);
    }
  }

  static signOut() {
    const innertube = yt2.get<Innertube>('innertube');
    if (innertube?.session?.logged_in) {
      innertube.session.signOut();

      yt2.deleteConfigValue('authCredentials');

      yt2.toast('success', yt2.getI18n('YOUTUBE2_SIGNED_OUT'));

      // Sign in again with empty credentials to reset status to SIGNED_OUT
      // And obtain new device code
      this.signIn();
    }
  }

  static getAuthStatus() {
    return yt2.get<AuthStatusInfo>('authStatusInfo') || INITIAL_SIGNED_OUT_STATUS;
  }
}
