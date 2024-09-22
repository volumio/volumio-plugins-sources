import Innertube, { Credentials, OAuthAuthPendingData, Utils as YTUtils } from 'volumio-youtubei.js';
import EventEmitter from 'events';
import ytmusic from '../YTMusicContext';

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

export enum AuthEvent {
  SignIn = 'SignIn',
  Pending = 'Pending',
  Error = 'Error'
}

export default class Auth extends EventEmitter {

  #innertube: Innertube | null;
  #handlers: any;

  constructor() {
    super();
    this.#innertube = null;
  }

  static create(innertube: Innertube) {
    const auth = new Auth();
    auth.#innertube = innertube;
    auth.#handlers = {
      onSuccess: auth.#handleSuccess.bind(auth),
      onPending: auth.#handlePending.bind(auth),
      onError: auth.#handleError.bind(auth),
      onCredentials: auth.#handleSuccess.bind(auth)
    };
    auth.#registerHandlers();
    return auth;
  }

  dispose() {
    this.#unregisterHandlers();
    this.removeAllListeners();
    this.#innertube = null;
  }

  #handlePending(data: OAuthAuthPendingData) {
    ytmusic.set<AuthStatusInfo>('authStatusInfo', {
      status: AuthStatus.SignedOut,
      verificationInfo: {
        verificationUrl: data.verification_url,
        userCode: data.user_code
      }
    });

    ytmusic.refreshUIConfig();
    this.emit(AuthEvent.Pending);
  }

  #handleSuccess(data: { credentials: Credentials }) {
    const oldStatusInfo = ytmusic.get<AuthStatusInfo>('authStatusInfo');
    ytmusic.set<AuthStatusInfo>('authStatusInfo', {
      status: AuthStatus.SignedIn
    });
    ytmusic.setConfigValue('authCredentials', data.credentials);
    if (!oldStatusInfo || oldStatusInfo.status !== AuthStatus.SignedIn) {
      ytmusic.getLogger().info('[ytmusic] Auth success');
      ytmusic.toast('success', ytmusic.getI18n('YTMUSIC_SIGN_IN_SUCCESS'));
      ytmusic.refreshUIConfig();
      this.emit(AuthEvent.SignIn);
    }
    else {
      ytmusic.getLogger().info('[ytmusic] Auth credentials updated');
    }
  }

  #handleError(err: YTUtils.OAuthError) {
    if (err.info.status === 'DEVICE_CODE_EXPIRED') {
      ytmusic.set('authStatusInfo', INITIAL_SIGNED_OUT_STATUS);
    }
    else {
      ytmusic.set<AuthStatusInfo>('authStatusInfo', {
        status: AuthStatus.Error,
        error: err
      });

      ytmusic.toast('error', ytmusic.getI18n('YTMUSIC_ERR_SIGN_IN',
        ytmusic.getErrorMessage('', err, false)));
    }

    ytmusic.refreshUIConfig();
    this.emit(AuthEvent.Error);
  }

  #registerHandlers() {
    if (this.#innertube?.session) {
      this.#innertube.session.on('auth', this.#handlers.onSuccess);
      this.#innertube.session.on('auth-pending', this.#handlers.onPending);
      this.#innertube.session.on('auth-error', this.#handlers.onError);
      this.#innertube.session.on('update-credentials', this.#handlers.onCredentials);
    }
  }

  #unregisterHandlers() {
    if (this.#innertube?.session) {
      this.#innertube.session.off('auth', this.#handlers.onSuccess);
      this.#innertube.session.off('auth-pending', this.#handlers.onPending);
      this.#innertube.session.off('auth-error', this.#handlers.onError);
      this.#innertube.session.off('update-credentials', this.#handlers.onCredentials);
    }
  }

  signIn() {
    if (this.#innertube?.session) {
      const credentials = ytmusic.getConfigValue('authCredentials');
      if (credentials) {
        ytmusic.set<AuthStatusInfo>('authStatusInfo', {
          status: AuthStatus.SigningIn
        });
      }
      else {
        ytmusic.set('authStatusInfo', INITIAL_SIGNED_OUT_STATUS);
      }

      ytmusic.refreshUIConfig();
      this.#innertube.session.signIn(credentials);
    }
  }

  async signOut() {
    if (this.#innertube?.session?.logged_in) {
      await this.#innertube.session.signOut();

      ytmusic.deleteConfigValue('authCredentials');

      ytmusic.toast('success', ytmusic.getI18n('YTMUSIC_SIGNED_OUT'));

      // Sign in again with empty credentials to reset status to SIGNED_OUT
      // And obtain new device code
      this.signIn();
    }
  }

  getStatus() {
    return ytmusic.get<AuthStatusInfo>('authStatusInfo') || INITIAL_SIGNED_OUT_STATUS;
  }
}
