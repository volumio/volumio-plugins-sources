import { Constants } from "yt-cast-receiver";

type ValueOf<T> = T[keyof T];

export type PluginConfigKey = keyof PluginConfigSchema;
export type PluginConfigValue<T extends PluginConfigKey> = PluginConfigSchema[T]['defaultValue'];

export interface PluginConfigSchemaEntry<T, U = false> {
  defaultValue: T;
  json: U;
}

export interface PluginConfigSchema {
  port: PluginConfigSchemaEntry<number>;
  bindToIf: PluginConfigSchemaEntry<string>;
  region: PluginConfigSchemaEntry<string>;
  language: PluginConfigSchemaEntry<string>;
  enableAutoplayOnConnect: PluginConfigSchemaEntry<boolean>;
  resetPlayerOnDisconnect: PluginConfigSchemaEntry<ValueOf<typeof Constants.RESET_PLAYER_ON_DISCONNECT_POLICIES>>;
  prefetch: PluginConfigSchemaEntry<boolean>;
  preferOpus: PluginConfigSchemaEntry<boolean>;
  liveStreamQuality: PluginConfigSchemaEntry<string | 'auto'>;
  'yt-cast-receiver': PluginConfigSchemaEntry<Record<string, any>, true>,
  dataStoreLastModified: PluginConfigSchemaEntry<number | null>;
  debug: PluginConfigSchemaEntry<boolean>;
}

export const PLUGIN_CONFIG_SCHEMA: PluginConfigSchema = {
  port: { defaultValue: 8098, json: false },
  bindToIf: { defaultValue: '', json: false },
  region: { defaultValue: 'US', json: false },
  language: { defaultValue: 'en', json: false },
  enableAutoplayOnConnect: { defaultValue: true, json: false },
  resetPlayerOnDisconnect: { defaultValue: Constants.RESET_PLAYER_ON_DISCONNECT_POLICIES.ALL_DISCONNECTED, json: false },
  prefetch: { defaultValue: true, json: false },
  preferOpus: { defaultValue: false, json: false },
  liveStreamQuality: { defaultValue: 'auto', json: false },
  'yt-cast-receiver': { defaultValue: {}, json: true },
  dataStoreLastModified: { defaultValue: null, json: false },
  debug: { defaultValue: false, json: false }
};
