import { ActionPanelSettings, BackgroundSettings, IdleScreenSettings, LocalizationSettings, NowPlayingScreenSettings, PerformanceSettings, ThemeSettings } from 'now-playing-common';
import { ContentRegionSettings } from 'now-playing-common/dist/config/ContentRegionSettings';
import { StartupOptions } from 'now-playing-common/dist/config/StartupOptions';
export type PluginConfigKey = keyof PluginConfigSchema;
export type PluginConfigValue<T extends PluginConfigKey> = PluginConfigSchema[T]['defaultValue'];
export interface PluginConfigSchemaEntry<T, U = false> {
    defaultValue: T;
    json: U;
}
export interface PluginConfigSchema {
    port: PluginConfigSchemaEntry<number>;
    startup: PluginConfigSchemaEntry<StartupOptions, true>;
    metadataService: PluginConfigSchemaEntry<MetadataServiceOptions, true>;
    contentRegion: PluginConfigSchemaEntry<ContentRegionSettings, true>;
    ['screen.nowPlaying']: PluginConfigSchemaEntry<NowPlayingScreenSettings, true>;
    background: PluginConfigSchemaEntry<BackgroundSettings, true>;
    actionPanel: PluginConfigSchemaEntry<ActionPanelSettings, true>;
    ['screen.idle']: PluginConfigSchemaEntry<IdleScreenSettings, true>;
    theme: PluginConfigSchemaEntry<ThemeSettings, true>;
    performance: PluginConfigSchemaEntry<PerformanceSettings, true>;
    localization: PluginConfigSchemaEntry<LocalizationSettings, true>;
    kioskDisplay: PluginConfigSchemaEntry<'default' | 'nowPlaying'>;
    configVersion: PluginConfigSchemaEntry<string | null>;
}
export interface MetadataServiceOptions {
    geniusAccessToken: string;
    excludeParenthesized: boolean;
    parenthesisType: 'round' | 'square' | 'round+square';
    queryMusicServices: boolean;
    enableSyncedLyrics: boolean;
}
export declare const DefaultMetadataServiceOptions: MetadataServiceOptions;
export interface I18nOptions {
    language: {
        label: string;
        optionValues: I18nOptionValue[];
    };
    region: {
        label: string;
        optionValues: I18nOptionValue[];
    };
}
export interface I18nOptionValue {
    label: string;
    value: string;
}
export declare const PLUGIN_CONFIG_SCHEMA: PluginConfigSchema;
//# sourceMappingURL=PluginConfig.d.ts.map