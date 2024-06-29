declare class SettingsAPI {
    getSettings({ category }: {
        category: string;
    }): Promise<import("now-playing-common").DeepRequired<import("now-playing-common").BackgroundSettings> | import("now-playing-common").DeepRequired<import("now-playing-common/dist/config/ContentRegionSettings").ContentRegionSettings> | import("now-playing-common").DeepRequired<import("now-playing-common").IdleScreenSettings> | import("now-playing-common").DeepRequired<import("now-playing-common").LocalizationSettings> | import("now-playing-common").DeepRequired<import("now-playing-common").NowPlayingScreenSettings> | import("now-playing-common").DeepRequired<import("now-playing-common").PerformanceSettings> | import("now-playing-common").DeepRequired<import("now-playing-common/dist/config/StartupOptions").StartupOptions> | import("now-playing-common").DeepRequired<import("now-playing-common").ThemeSettings> | import("now-playing-common").DeepRequired<import("now-playing-common").ActionPanelSettings>>;
}
declare const settingsAPI: SettingsAPI;
export default settingsAPI;
//# sourceMappingURL=SettingsAPI.d.ts.map