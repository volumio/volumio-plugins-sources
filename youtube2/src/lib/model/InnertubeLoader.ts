import yt2 from '../YouTube2Context';
import Innertube from 'volumio-youtubei.js';
import Auth, { AuthEvent } from '../util/Auth';

export interface InnertubeLoaderGetInstanceResult {
  innertube: Innertube;
  auth: Auth;
}

export default class InnertubeLoader {

  static #innertube: Innertube | null = null;
  static #auth: Auth | null = null;
  static #pendingPromise: Promise<InnertubeLoaderGetInstanceResult> | null = null;

  static async getInstance(): Promise<InnertubeLoaderGetInstanceResult> {
    if (this.#innertube && this.#auth) {
      return {
        innertube: this.#innertube,
        auth: this.#auth
      };
    }

    if (this.#pendingPromise) {
      return this.#pendingPromise;
    }

    this.#pendingPromise = new Promise(async (resolve) => {
      yt2.getLogger().info('[youtube2] InnertubeLoader: creating Innertube instance...');
      this.#innertube = await Innertube.create();
      this.applyI18nConfig();

      yt2.getLogger().info('[youtube2] InnertubeLoader: creating Auth instance...');
      this.#auth = Auth.create(this.#innertube);
      this.#auth.on(AuthEvent.SignIn, this.#handleAuthEvent.bind(this, AuthEvent.SignIn, this.#innertube, this.#auth, resolve));
      this.#auth.on(AuthEvent.Pending, this.#handleAuthEvent.bind(this, AuthEvent.Pending, this.#innertube, this.#auth, resolve));
      this.#auth.on(AuthEvent.Error, this.#handleAuthEvent.bind(this, AuthEvent.Error, this.#innertube, this.#auth, resolve));
      this.#auth.signIn();
    });

    return this.#pendingPromise;
  }

  static reset() {
    if (this.#pendingPromise) {
      this.#pendingPromise = null;
    }
    if (this.#auth) {
      this.#auth.dispose();
    }
    this.#auth = null;
    this.#innertube = null;
  }

  static hasInstance() {
    return this.#innertube && this.#auth;
  }

  static #handleAuthEvent(event: AuthEvent, innertube: Innertube, auth: Auth, resolve: (value: InnertubeLoaderGetInstanceResult) => void) {
    if (!this.#pendingPromise) {
      return;
    }
    let status: string;
    switch (event) {
      case AuthEvent.SignIn:
        status = 'signed in';
        break;
      case AuthEvent.Pending:
        status = 'pending sign-in';
        break;
      case AuthEvent.Error:
        status = 'error';
        break;
      default:
        status = 'undefined';
    }
    yt2.getLogger().info(`[youtube2] InnertubeLoader: Auth instance created (status: ${status})`);
    this.#pendingPromise = null;
    auth.removeAllListeners();
    resolve({
      innertube,
      auth
    });
  }

  static applyI18nConfig() {
    if (!this.#innertube) {
      return;
    }

    const region = yt2.getConfigValue('region');
    const language = yt2.getConfigValue('language');

    this.#innertube.session.context.client.gl = region;
    this.#innertube.session.context.client.hl = language;
  }
}
