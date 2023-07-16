import { ServerCredentials } from './types/Server';

export type PluginConfigKey = keyof PluginConfigSchema;
export type PluginConfigValue<T extends PluginConfigKey> = PluginConfigSchema[T]['defaultValue'];

export type DSDPlayback = 'pcm' | 'dop' | 'DSD_U8' | 'DSD_U16_LE' | 'DSD_U16_BE' | 'DSD_U32_LE' | 'DSD_U32_BE' | 'auto';

export interface PluginConfigSchemaEntry<T, U = false> {
  defaultValue: T;
  json: U;
}

export interface BasicPlayerConfig {
  type: 'basic';
  playerNameType: 'hostname' | 'custom';
  playerName: string;
  dsdPlayback: DSDPlayback;
  fadeOnPauseResume: boolean;
}

export interface ManualPlayerConfig {
  type: 'manual';
  fadeOnPauseResume: boolean;
  startupOptions: string;
}

export type PlayerConfig = BasicPlayerConfig | ManualPlayerConfig;

export interface PluginConfigSchema {
  playerConfigType: PluginConfigSchemaEntry<'basic' | 'manual'>;
  basicPlayerConfig: PluginConfigSchemaEntry<BasicPlayerConfig, true>;
  manualPlayerConfig: PluginConfigSchemaEntry<ManualPlayerConfig, true>;
  serverCredentials: PluginConfigSchemaEntry<ServerCredentials, true>;
}

const defaultBasicPlayerConfig: BasicPlayerConfig = {
  type: 'basic',
  playerNameType: 'hostname',
  playerName: '',
  dsdPlayback: 'auto',
  fadeOnPauseResume: true
} as const;

const defaultManualPlayerConfig: ManualPlayerConfig = {
  type: 'manual',
  fadeOnPauseResume: true,
  startupOptions: ''
} as const;

export const PLUGIN_CONFIG_SCHEMA: PluginConfigSchema = {
  playerConfigType: { defaultValue: 'basic', json: false },
  basicPlayerConfig: { defaultValue: defaultBasicPlayerConfig, json: true },
  manualPlayerConfig: { defaultValue: defaultManualPlayerConfig, json: true },
  serverCredentials: { defaultValue: {}, json: true }
};
