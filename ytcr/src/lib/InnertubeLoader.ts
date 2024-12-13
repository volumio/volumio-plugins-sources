import fetch from 'node-fetch';
import Innertube from 'volumio-youtubei.js';
import BG, { type BgConfig } from 'bgutils-js';
import { JSDOM } from 'jsdom';
import { type Logger } from 'yt-cast-receiver';
import ytcr from './YTCRContext';

export interface InnertubeLoaderGetInstanceResult {
  innertube: Innertube;
}

enum Stage {
  Init = '1 - Init',
  PO = '2 - PO'
}

interface POToken {
  params: {
    visitorData?: string;
  }
  value: string;
  ttl?: number;
  refreshThreshold?: number;
}

export default class InnertubeLoader {

  #innertube: Innertube | null = null;
  #pendingPromise: Promise<InnertubeLoaderGetInstanceResult> | null = null;
  #poTokenRefreshTimer: NodeJS.Timeout | null = null;
  #logger: Logger | null = null;
  #onCreate?: (innertube: Innertube) => void;

  constructor(logger: Logger, onCreate?: (innertube: Innertube) => void) {
    this.#logger = logger;
    this.#onCreate = onCreate;
  }

  async getInstance(): Promise<InnertubeLoaderGetInstanceResult> {
    if (this.#innertube) {
      return {
        innertube: this.#innertube,
      };
    }

    if (this.#pendingPromise) {
      return this.#pendingPromise;
    }

    this.#pendingPromise = new Promise<InnertubeLoaderGetInstanceResult>((resolve, reject) => {
      this.#createInstance(Stage.Init, resolve)
        .catch((error: unknown) => {
          reject(error instanceof Error ? error : Error(String(error)))
        });
    });

    return this.#pendingPromise;
  }

  async #recreateWithPOToken(innertube: Innertube, resolve: (value: InnertubeLoaderGetInstanceResult) => void, lastToken?: POToken) {
    const visitorData = lastToken?.params.visitorData || innertube.session.context.client.visitorData;
    let poTokenResult;
    if (visitorData) {
      this.#logger?.info(`[ytcr] InnertubeLoader: obtaining po_token by visitorData...`);
      try {
        poTokenResult = await this.#generatePoToken(visitorData);
        this.#logger?.info(`[ytcr] InnertubeLoader: obtained po_token (expires in ${poTokenResult.ttl} seconds)`);
      }
      catch (error: unknown) {
        this.#logger?.error('[ytcr] InnertubeLoader: failed to get poToken:', error);
      }
      if (poTokenResult) {
        this.#logger?.info(`[ytcr] InnertubeLoader: re-create Innertube instance with po_token`);
        this.#createInstance(Stage.PO, resolve, {
          params: {
            visitorData
          },
          value: poTokenResult.token,
          ttl: poTokenResult.ttl,
          refreshThreshold: poTokenResult.refreshThreshold
        })
          .catch((error: unknown) => {
            this.#logger?.error('[ytcr] InnertubeLoader: error creating Innertube instance:', error);
          });
        return;
      }
    }
    this.#logger?.warn('[ytcr] InnertubeLoader: po_token was not used to create Innertube instance. Playback of YouTube content might fail.');
    this.#resolveGetInstanceResult(innertube, resolve);
  }

  async #createInstance(stage: Stage.PO, resolve: (value: InnertubeLoaderGetInstanceResult) => void, poToken: POToken): Promise<void>;
  async #createInstance(stage: Stage.Init, resolve: (value: InnertubeLoaderGetInstanceResult) => void, poToken?: undefined): Promise<void>;
  async #createInstance(stage: Stage.Init | Stage.PO, resolve: (value: InnertubeLoaderGetInstanceResult) => void, poToken?: POToken) {
    this.#logger?.info(`[ytcr] InnertubeLoader: creating Innertube instance${poToken?.value ? ' with po_token' : ''}...`);
    const innertube = await Innertube.create({
      visitor_data: poToken?.params.visitorData,
      po_token: poToken?.value
    });
    switch (stage) {
      case Stage.Init:
        await this.#recreateWithPOToken(innertube, resolve);
        break;
      case Stage.PO:
        this.#resolveGetInstanceResult(innertube, resolve, poToken);
        break;
    }
  }

  reset() {
    this.#clearPOTokenRefreshTimer();
    if (this.#pendingPromise) {
      this.#pendingPromise = null;
    }
    this.#innertube = null;
  }

  #clearPOTokenRefreshTimer() {
    if (this.#poTokenRefreshTimer) {
      clearTimeout(this.#poTokenRefreshTimer);
      this.#poTokenRefreshTimer = null;
    }
  }

  hasInstance() {
    return !!this.#innertube;
  }

  #resolveGetInstanceResult(innertube: Innertube, resolve: (value: InnertubeLoaderGetInstanceResult) => void, poToken?: POToken) {
    this.#pendingPromise = null;
    this.#innertube = innertube;
    this.applyI18nConfig();
    this.#clearPOTokenRefreshTimer();
    if (poToken) {
      const { ttl, refreshThreshold = 100 } = poToken;
      if (ttl) {
        const timeout = ttl - refreshThreshold;
        this.#logger?.info(`[ytcr] InnertubeLoader: going to refresh po_token in ${timeout} seconds`);
        this.#poTokenRefreshTimer = setTimeout(() => this.#refreshPOToken(poToken), timeout * 1000);
      }
    }
    if (this.#onCreate) {
      this.#onCreate(innertube);
    }
    resolve({
      innertube,
    });
  }

  #refreshPOToken(lastToken: POToken) {
    const innertube = this.#innertube;
    if (!innertube) {
      return;
    }
    this.reset();
    this.#pendingPromise = new Promise((resolve) => {
      this.#logger?.info('[ytcr] InnertubeLoader: refresh po_token');
      this.#recreateWithPOToken(innertube, resolve, lastToken)
        .catch((error: unknown) => {
          this.#logger?.error('[ytcr] InnertubeLoader: error creating Innertube instance (while refreshing po_token):', error);
        });
    });
  }

  applyI18nConfig() {
    if (!this.#innertube) {
      return;
    }

    const region = ytcr.getConfigValue('region', 'US');
    const language = ytcr.getConfigValue('language', 'en');

    this.#innertube.session.context.client.gl = region;
    this.#innertube.session.context.client.hl = language;
  }

  /**
   * Required for initializing innertube, otherwise videos will return 403
   * Much of this taken from https://github.com/LuanRT/BgUtils/blob/main/examples/node/index.ts
   * @returns
   */
  async #generatePoToken(identifier: string) {
    const requestKey = 'O43z0dpjhgX20SCx4KAo';
    const bgConfig: BgConfig = {
      fetch: (url, options) => fetch(url as any, options as any) as any,
      globalObj: globalThis,
      identifier,
      requestKey
    };

    const dom = new JSDOM();
    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document
    });

    const bgChallenge = await BG.Challenge.create(bgConfig);
    if (!bgChallenge) {
      throw new Error('Could not get challenge');
    }

    const interpreterJavascript = bgChallenge.interpreterJavascript.privateDoNotAccessOrElseSafeScriptWrappedValue;
    if (interpreterJavascript) {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      new Function(interpreterJavascript)();
    }
    else throw new Error('Could not load VM');

    const poTokenResult = await BG.PoToken.generate({
      program: bgChallenge.program,
      globalName: bgChallenge.globalName,
      bgConfig
    });

    return {
      token: poTokenResult.poToken,
      ttl: poTokenResult.integrityTokenData.estimatedTtlSecs,
      refreshThreshold: poTokenResult.integrityTokenData.mintRefreshThreshold
    };
  }
}
