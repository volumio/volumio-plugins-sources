/// <reference types="node" />
import EventEmitter from 'events';
import Player, { PlayerStatus } from './types/Player';
import { ServerCredentials } from './types/Server';
export default class PlayerStatusMonitor extends EventEmitter {
    #private;
    constructor(player: Player, serverCredentials: ServerCredentials);
    start(): Promise<void>;
    stop(): Promise<void>;
    getPlayer(): Player;
    requestUpdate(): void;
    on(event: 'update', listener: (data: {
        player: Player;
        status: PlayerStatus;
    }) => void): this;
    on(event: 'disconnect', listener: (player: Player) => void): this;
}
//# sourceMappingURL=PlayerStatusMonitor.d.ts.map