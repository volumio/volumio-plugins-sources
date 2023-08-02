import { ActionPanelSettings, BackgroundSettings, IdleScreenSettings, LocalizationSettings, NowPlayingScreenSettings, PerformanceSettings, ThemeSettings } from 'now-playing-common';
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
    geniusAccessToken: PluginConfigSchemaEntry<string>;
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