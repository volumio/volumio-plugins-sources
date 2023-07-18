import { PlayerStartupParams } from './types/Player';
export declare const SQUEEZELITE_LOG_FILE = "/tmp/squeezelite.log";
export declare class SystemError extends Error {
    code?: SystemErrorCode;
}
export declare enum SystemErrorCode {
    DeviceBusy = -1
}
export declare function initSqueezeliteService(params: PlayerStartupParams): Promise<void>;
export declare function stopSqueezeliteService(): Promise<unknown>;
export declare function getSqueezeliteServiceStatus(): Promise<string>;
export declare function getAlsaFormats(card: string): Promise<string[]>;
//# sourceMappingURL=System.d.ts.map