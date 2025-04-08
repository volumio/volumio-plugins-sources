/// <reference types="node" />
import EventEmitter from 'events';
import { ServerCredentials } from './types/Server';
export declare enum PlayerFinderStatus {
    Started = "started",
    Stopped = "stopped"
}
export interface PlayerFinderOptions {
    serverCredentials?: ServerCredentials;
    eventFilter?: {
        playerIP?: string | string[];
        playerName?: string | string[];
        playerId?: string | string[];
    };
}
export default class PlayerFinder extends EventEmitter {
    #private;
    constructor();
    start(opts?: PlayerFinderOptions): Promise<void>;
    stop(): Promise<void>;
    getStatus(): PlayerFinderStatus;
}
//# sourceMappingURL=PlayerFinder.d.ts.map