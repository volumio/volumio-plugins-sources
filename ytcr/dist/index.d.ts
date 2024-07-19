import { VolumioState } from './lib/MPDPlayer.js';
import { NowPlayingPluginSupport } from 'now-playing-common';
import YTCRNowPlayingMetadataProvider from './lib/YTCRNowPlayingMetadataProvider';
declare class ControllerYTCR implements NowPlayingPluginSupport {
    #private;
    constructor(context: any);
    getUIConfig(): any;
    onVolumioStart(): any;
    onStart(): any;
    configSaveConnection(data: any): void;
    configConfirmSaveConnection(data: any): void;
    configSaveI18n(data: any): void;
    configSaveOther(data: any): Promise<void>;
    configClearDataStore(): void;
    configConfirmClearDataStore(): void;
    refreshUIConfig(): void;
    onStop(): any;
    restart(): any;
    getConfigurationFiles(): string[];
    setVolatile(): void;
    unsetVolatile(): void;
    onUnsetVolatile(): Promise<boolean>;
    pushIdleState(): void;
    pushState(state?: VolumioState): Promise<void>;
    isCurrentService(): boolean;
    stop(): any;
    play(): any;
    pause(): any;
    resume(): any;
    seek(position: number): any;
    next(): any;
    previous(): any;
    getNowPlayingMetadataProvider(): YTCRNowPlayingMetadataProvider | null;
}
export = ControllerYTCR;
//# sourceMappingURL=index.d.ts.map