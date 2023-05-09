import EventEmitter from 'events';
import { Api, Jellyfin, Jellyfin as JellyfinSdk } from '@jellyfin/sdk';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import AbortController from 'abort-controller';
import { EntityType } from '../entities';
import Server from '../entities/Server';
import jellyfin from '../JellyfinContext';
import ServerHelper from '../util/ServerHelper';

export interface PollListener {
  (event: PollEvent): void;
}

export interface PollEvent {
  eventName: 'online' | 'lost';
  server: Server;
  api: Api;
}

interface PollTarget {
  url: string;
  connectionUrl: string;
  api: Api;
  pollTimer?: NodeJS.Timeout | null;
  abortController?: AbortController | null;
  lastEvent?: PollEvent;
}

const POLL_INTERVAL = 30000;

export default class ServerPoller extends EventEmitter {

  #targets: PollTarget[];
  #sdk: JellyfinSdk;

  constructor(sdk: Jellyfin) {
    super();
    this.#targets = [];
    this.#sdk = sdk;
  }

  addTarget(url: string | string[]) {
    if (Array.isArray(url)) {
      url.forEach((u) => this.addTarget(u));
      return;
    }

    const connectionUrl = ServerHelper.getConnectionUrl(url);
    if (this.#targets.find((target) => target.connectionUrl === connectionUrl)) {
      return;
    }
    const target = {
      url,
      connectionUrl,
      api: this.#sdk.createApi(connectionUrl)
    };
    this.#targets.push(target);
    this.#poll(target);
  }

  removeTarget(target: string | PollTarget) {
    const index = typeof target === 'string' ? this.#targets.findIndex(
      (t) => t.connectionUrl === ServerHelper.getConnectionUrl(target)) : this.#targets.indexOf(target);
    if (index < 0) {
      return;
    }
    const pt = this.#targets[index];
    if (pt.pollTimer) {
      clearTimeout(pt.pollTimer);
      pt.pollTimer = null;
    }
    if (pt.abortController) {
      pt.abortController.abort();
      pt.abortController = null;
    }
    this.#targets.splice(index, 1);
  }

  clearTargets() {
    [ ...this.#targets ].forEach((target) => this.removeTarget(target));
  }

  getOnlineServers(): Server[] {
    return this.#targets.reduce<Server[]>((s, target) => {
      if (target.lastEvent?.eventName === 'online') {
        s.push(target.lastEvent.server);
      }
      return s;
    }, []);
  }

  findOnlineServer(url: string): Server | null {
    const connectionUrl = ServerHelper.getConnectionUrl(url);
    const target = this.#targets.find((target) => target.connectionUrl === connectionUrl);
    if (target?.lastEvent?.eventName === 'online') {
      return target.lastEvent.server;
    }
    return null;
  }

  async #poll(target: PollTarget) {
    if (!target.abortController) {
      target.abortController = new AbortController();
    }
    const wasOnline = target.lastEvent?.eventName === 'online';
    let isLost = false;
    try {
      const systemApi = getSystemApi(target.api);
      const systemInfo = await systemApi.getPublicSystemInfo();

      if (target.abortController.signal.aborted) {
        return;
      }

      if (systemInfo.data?.Id && systemInfo.data?.ServerName) {
        if (!wasOnline) {
          const event: PollEvent = {
            eventName: 'online',
            server: {
              type: EntityType.Server,
              id: systemInfo.data.Id,
              url: target.url,
              connectionUrl: target.connectionUrl,
              name: systemInfo.data.ServerName,
              thumbnail: null
            },
            api: target.api
          };
          target.lastEvent = event;
          jellyfin.getLogger().info(`[jellyfin-poller] Polled ${target.url}: online`);
          this.emit('serverOnline', event);
        }
      }
      else if (wasOnline) {
        isLost = true;
      }
      else {
        jellyfin.getLogger().info(`[jellyfin-poller] Polled ${target.url}: offline (system info unavailable)`);
      }
    }
    catch (error: any) {
      isLost = wasOnline;
      jellyfin.getLogger().info(`[jellyfin-poller] Polled ${target.url}: offline${isLost ? ' (lost)' : ''}`);
    }
    if (isLost && target.lastEvent) {
      target.lastEvent.eventName = 'lost';
      this.emit('serverLost', target.lastEvent);
    }

    target.pollTimer = setTimeout(() => {
      this.#poll(target);
    }, POLL_INTERVAL);
  }

  emit(event: 'serverOnline', args: PollEvent): boolean;
  emit(event: 'serverLost', args: PollEvent): boolean;
  emit(event: string | symbol, ...args: any[]): boolean {
    return super.emit(event, args);
  }

  on(event: 'serverOnline' | 'serverLost', listener: PollListener): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
}
