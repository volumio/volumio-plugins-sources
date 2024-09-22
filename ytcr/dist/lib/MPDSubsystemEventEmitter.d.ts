import { MPDApi } from 'mpd-api';
import { Logger } from 'yt-cast-receiver';
export type SubsystemName = 'database' | 'update' | 'stored_playlist' | 'playlist' | 'player' | 'mixer' | 'output' | 'options' | 'partition' | 'sticker' | 'subscription' | 'message' | 'neighbor' | 'mount';
interface SubsystemEventListener {
    (event: SubsystemEvent): Promise<void>;
}
export declare class SubsystemEvent {
    #private;
    constructor(name: string, propagate?: boolean);
    stopPropagation(): void;
    get propagate(): boolean;
    get name(): string;
}
export default class MPDSubsystemEventEmitter {
    #private;
    constructor(logger: Logger);
    static instance(mpdClient: MPDApi.ClientAPI, logger: Logger): MPDSubsystemEventEmitter;
    enable(): void;
    disable(): void;
    on(event: SubsystemName, listener: SubsystemEventListener): this;
    once(event: SubsystemName, listener: SubsystemEventListener): this;
    off(event: SubsystemName, listener: SubsystemEventListener): this;
    prependOnceListener(event: SubsystemName, listener: SubsystemEventListener): this;
    destroy(): void;
}
export {};
//# sourceMappingURL=MPDSubsystemEventEmitter.d.ts.map