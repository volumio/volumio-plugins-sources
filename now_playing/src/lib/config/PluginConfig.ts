import { ActionPanelSettings, BackgroundSettings, DefaultActionPanelSettings, DefaultBackgroundSettings, DefaultIdleScreenSettings, DefaultLocalizationSettings, DefaultNowPlayingScreenSettings, DefaultPerformanceSettings, DefaultThemeSettings, IdleScreenSettings, LocalizationSettings, NowPlayingScreenSettings, PerformanceSettings, ThemeSettings } from 'now-playing-common';

export type PluginConfigKey = keyof PluginConfigSchema;
export type PluginConfigValue<T extends PluginConfigKey> = PluginConfigSchema[T]['defaultValue'];

export interface PluginConfigSchemaEntry<T, U = false> {
  defaultValue: T;
  json: U;
}

export interface PluginConfigSchema {
  port: PluginConfigSchemaEntry<number>;
  geniusAccessToken: PluginConfigSchemaEntry<string>;
  ['screen.nowPlaying']: PluginConfigSchemaEntry<NowPlayingScreenSettings, true>;
  background: PluginConfigSchemaEntry<BackgroundSettings, true>;
  actionPanel: PluginConfigSchemaEntry<ActionPanelSettings, true>;
  ['screen.idle']: PluginConfigSchemaEntry<IdleScreenSettings, true>;
  theme: PluginConfigSchemaEntry<ThemeSettings, true>;
  performance: PluginConfigSchemaEntry<PerformanceSettings, true>;
  localization: PluginConfigSchemaEntry<LocalizationSettings, true>;
  // What is being displayed on the kiosk screen (i.e. the one attached to Volumio device)?
  // - 'default' - Default Volumio interface
  // - 'nowPlaying' - Now Playing page served by the plugin
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
  }
}

export interface I18nOptionValue {
  label: string;
  value: string;
}

export const PLUGIN_CONFIG_SCHEMA: PluginConfigSchema = {
  port: { defaultValue: 4004, json: false },
  geniusAccessToken: { defaultValue: '', json: false },
  'screen.nowPlaying': { defaultValue: DefaultNowPlayingScreenSettings, json: true },
  background: { defaultValue: DefaultBackgroundSettings, json: true },
  actionPanel: { defaultValue: DefaultActionPanelSettings, json: true },
  'screen.idle': { defaultValue: DefaultIdleScreenSettings, json: true },
  theme: { defaultValue: DefaultThemeSettings, json: true },
  performance: { defaultValue: DefaultPerformanceSettings, json: true },
  localization: { defaultValue: DefaultLocalizationSettings, json: true },
  kioskDisplay: { defaultValue: 'default', json: false },
  configVersion: { defaultValue: null, json: false }
};
