declare class ControllerSqueezeliteMC {
    #private;
    constructor(context: any);
    getUIConfig(): any;
    getConfigurationFiles(): string[];
    /**
     * Plugin lifecycle
     */
    onVolumioStart(): any;
    onStart(): any;
    onStop(): any;
    unsetVolatile(): void;
    onUnsetVolatile(): void;
    /**
     * Config functions
     */
    configStartSqueezelite(data: {
        force?: boolean;
    }): void;
    configSaveServerCredentials(data?: Record<string, string>): void;
    configSwitchToBasicSqueezeliteSettings(): void;
    configSwitchToManualSqueezeliteSettings(): void;
    configSaveBasicSqueezeliteSettings(data: any): Promise<void>;
    configSaveManualSqueezeliteSettings(data: any): Promise<void>;
    /**
     * Volumio playback control functions
     */
    stop(): any;
    play(): any;
    pause(): any;
    resume(): any;
    seek(position: number): any;
    next(): any;
    previous(): any;
    repeat(value: boolean, repeatSingle: boolean): any;
    random(value: boolean): any;
}
export = ControllerSqueezeliteMC;
//# sourceMappingURL=index.d.ts.map