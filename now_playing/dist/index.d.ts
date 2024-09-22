import * as SystemUtils from './lib/utils/System';
declare class ControllerNowPlaying {
    #private;
    constructor(context: any);
    getUIConfig(): any;
    configureVolumioKiosk(data: {
        display: 'nowPlaying' | 'default';
    }): void;
    restoreVolumioKioskBak(): void;
    configSaveDaemon(data: Record<string, any>): void;
    configConfirmSaveDaemon(data: Record<string, any>): void;
    configSaveStartupOptions(data: Record<string, any>): void;
    configSaveLayouts(data: Record<string, any>): void;
    configSaveContentRegionSettings(data: Record<string, any>): void;
    configSaveTextStyles(data: Record<string, any>): void;
    configSaveWidgetStyles(data: Record<string, any>): void;
    configSaveAlbumartStyles(data: Record<string, any>): void;
    configSaveBackgroundStyles(data: Record<string, any>): void;
    configSaveActionPanelSettings(data: Record<string, any>): void;
    configSaveDockedMenuSettings(data: Record<string, any>): void;
    configSaveDockedActionPanelTriggerSettings(data: Record<string, any>): void;
    configSaveDockedVolumeIndicatorSettings(data: Record<string, any>): void;
    configSaveDockedClockSettings(data: Record<string, any>): void;
    configSaveDockedWeatherSettings(data: Record<string, any>): void;
    configSaveDockedMediaFormatSettings(data: Record<string, any>): void;
    configSaveLocalizationSettings(data: Record<string, any>): void;
    configSaveMetadataServiceSettings(data: Record<string, any>): void;
    configSaveIdleScreenSettings(data: Record<string, any>): void;
    configSaveExtraScreenSettings(data: Record<string, any>): void;
    configSavePerformanceSettings(data: Record<string, any>): void;
    configBackupConfig(data: any): void;
    configRestoreConfigFromBackup(data: any): Promise<void>;
    configDeleteConfigBackup(data: any): void;
    clearMetadataCache(): void;
    clearWeatherCache(): void;
    broadcastRefresh(): void;
    getPluginInfo(): {
        message: string;
        payload: SystemUtils.PluginInfo;
    };
    onVolumioStart(): any;
    onStart(): any;
    onStop(): any;
    getConfigurationFiles(): string[];
}
export = ControllerNowPlaying;
//# sourceMappingURL=index.d.ts.map