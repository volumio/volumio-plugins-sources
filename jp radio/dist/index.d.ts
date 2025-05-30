import { BrowseResult } from './lib/models/BrowseResultModel';
export = ControllerJpRadio;
declare class ControllerJpRadio {
    private context;
    private commandRouter;
    private logger;
    private configManager;
    private config;
    private readonly serviceName;
    private appRadio;
    constructor(context: any);
    restartPlugin(): Promise<void>;
    private showRestartModal;
    saveServicePort(data: {
        servicePort: string;
    }): Promise<void>;
    saveRadikoAccount(data: {
        radikoUser: string;
        radikoPass: string;
    }): Promise<void>;
    onVolumioStart(): Promise<void>;
    onStart(): Promise<void>;
    onStop(): Promise<void>;
    getUIConfig(): Promise<any>;
    getConfigurationFiles(): string[];
    addToBrowseSources(): void;
    handleBrowseUri(curUri: string): Promise<BrowseResult | {}>;
    clearAddPlayTrack(track: any): Promise<any>;
    seek(timepos: number): Promise<any>;
    stop(): void;
    pause(): void;
    getState(): void;
    parseState(sState: any): void;
    pushState(state: any): any;
    explodeUri(uri: string): Promise<any>;
    search(query: any): Promise<any>;
    goto(data: any): Promise<any>;
}
//# sourceMappingURL=index.d.ts.map