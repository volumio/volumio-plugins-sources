import Player from './types/Player';
import { ServerCredentials } from './types/Server';
export default class CommandDispatcher {
    #private;
    constructor(player: Player, serverCredentials: ServerCredentials);
    sendPlay(): Promise<any>;
    sendPause(): Promise<any>;
    sendStop(): Promise<any>;
    sendNext(): Promise<any>;
    sendPrevious(): Promise<any>;
    sendSeek(time: number): Promise<any>;
    sendRepeat(value: number): Promise<any>;
    sendShuffle(value: number): Promise<any>;
    sendVolume(value: number): Promise<any>;
    sendPref(prefName: string, value: any): Promise<any>;
}
//# sourceMappingURL=CommandDispatcher.d.ts.map