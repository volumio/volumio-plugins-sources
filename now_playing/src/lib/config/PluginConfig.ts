import lodash from 'lodash';
import { ActionPanelSettings, BackgroundSettings, DefaultActionPanelSettings, DefaultBackgroundSettings, DefaultIdleScreenSettings, DefaultLocalizationSettings, DefaultNowPlayingScreenSettings, DefaultPerformanceSettings, DefaultThemeSettings, IdleScreenSettings, LocalizationSettings, NowPlayingScreenSettings, PerformanceSettings, ThemeSettings } from 'now-playing-common';
import { ContentRegionSettings, DefaultContentRegionSettings } from 'now-playing-common/dist/config/ContentRegionSettings';
import { DefaultStartupOptions, StartupOptions } from 'now-playing-common/dist/config/StartupOptions';

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
  // What is being displayed on the kiosk screen (i.e. the one attached to Volumio device)?
  // - 'default' - Default Volumio interface
  // - 'nowPlaying' - Now Playing page served by the plugin
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

export const DefaultMetadataServiceOptions: MetadataServiceOptions = {
  geniusAccessToken: '',
  excludeParenthesized: false,
  parenthesisType: 'round',
  queryMusicServices: true,
  enableSyncedLyrics: true
};

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
  startup: { defaultValue: lodash.cloneDeep(DefaultStartupOptions), json: true },
  metadataService: { defaultValue: lodash.cloneDeep(DefaultMetadataServiceOptions), json: true },
  contentRegion: { defaultValue: lodash.cloneDeep(DefaultContentRegionSettings), json: true },
  'screen.nowPlaying': { defaultValue: lodash.cloneDeep(DefaultNowPlayingScreenSettings), json: true },
  background: { defaultValue: lodash.cloneDeep(DefaultBackgroundSettings), json: true },
  actionPanel: { defaultValue: lodash.cloneDeep(DefaultActionPanelSettings), json: true },
  'screen.idle': { defaultValue: lodash.cloneDeep(DefaultIdleScreenSettings), json: true },
  theme: { defaultValue: lodash.cloneDeep(DefaultThemeSettings), json: true },
  performance: { defaultValue: lodash.cloneDeep(DefaultPerformanceSettings), json: true },
  localization: { defaultValue: lodash.cloneDeep(DefaultLocalizationSettings), json: true },
  kioskDisplay: { defaultValue: 'default', json: false },
  configVersion: { defaultValue: null, json: false }
};
