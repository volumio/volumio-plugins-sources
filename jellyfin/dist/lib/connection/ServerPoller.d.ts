/// <reference types="node" />
/// <reference types="node" />
import EventEmitter from 'events';
import { Api, Jellyfin } from '@jellyfin/sdk';
import AbortController from 'abort-controller';
import Server from '../entities/Server';
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
export default class ServerPoller extends EventEmitter {
    #private;
    constructor(sdk: Jellyfin);
    addTarget(url: string | string[]): void;
    removeTarget(target: string | PollTarget): void;
    clearTargets(): void;
    getOnlineServers(): Server[];
    findOnlineServer(url: string): Server | null;
    emit(event: 'serverOnline', args: PollEvent): boolean;
    emit(event: 'serverLost', args: PollEvent): boolean;
    on(event: 'serverOnline' | 'serverLost', listener: PollListener): this;
}
export {};
//# sourceMappingURL=ServerPoller.d.ts.map