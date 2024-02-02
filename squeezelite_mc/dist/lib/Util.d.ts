import Server, { ServerCredentials } from './types/Server';
import { BasicPlayerStartupParams } from './types/Player';
export interface ServerConnectParams {
    host?: string;
    port?: string;
    username?: string;
    password?: string;
}
export interface NetworkInterfaces {
    [ifName: string]: {
        address: string;
        mac: string;
    }[];
}
export declare function getNetworkInterfaces(): NetworkInterfaces;
export declare function encodeBase64(str: string): string;
export declare function getServerConnectParams(server: Server, serverCredentials: ServerCredentials | undefined, connectType: 'rpc' | 'cli'): ServerConnectParams;
export declare function jsPromiseToKew<T>(promise: Promise<T>): any;
export declare function kewToJSPromise(promise: any): Promise<any>;
export declare class PlaybackTimer {
    #private;
    constructor();
    start(seek?: number): void;
    stop(): void;
    getSeek(): number;
}
export declare function basicPlayerStartupParamsToSqueezeliteOpts(params: BasicPlayerStartupParams): string;
//# sourceMappingURL=Util.d.ts.map