import { ServerCredentials } from './types/Server';
export declare enum ProxyStatus {
    Stopped = "stopped",
    Started = "started",
    Starting = "starting"
}
export interface ProxyAddress {
    address: string;
    port?: number;
}
export default class Proxy {
    #private;
    constructor(serverCredentials?: ServerCredentials);
    start(): Promise<void>;
    stop(): void;
    getStatus(): ProxyStatus;
    getAddress(): ProxyAddress | null;
    setServerCredentials(serverCredentials?: ServerCredentials): void;
}
//# sourceMappingURL=Proxy.d.ts.map