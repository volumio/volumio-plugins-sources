export type PluginConfigKey = keyof PluginConfigSchema;
export type PluginConfigValue<T extends PluginConfigKey> = PluginConfigSchema[T]['defaultValue'];

export interface PluginConfigSchemaEntry<T, U = false> {
  defaultValue: T;
  json: U;
}

export enum LongStreamFormat {
  Opus = 'opus',
  MP3 = 'mp3'
}

export interface PluginConfigSchema {
  accessToken: PluginConfigSchemaEntry<string>;
  locale: PluginConfigSchemaEntry<string>;
  itemsPerPage: PluginConfigSchemaEntry<number>;
  itemsPerSection: PluginConfigSchemaEntry<number>;
  combinedSearchResults: PluginConfigSchemaEntry<number>;
  loadFullPlaylistAlbum: PluginConfigSchemaEntry<boolean>;
  skipPreviewTracks: PluginConfigSchemaEntry<boolean>;
  addPlayedToHistory: PluginConfigSchemaEntry<boolean>;
  longStreamFormat: PluginConfigSchemaEntry<LongStreamFormat>;
  cacheMaxEntries: PluginConfigSchemaEntry<number>;
  cacheTTL: PluginConfigSchemaEntry<number>;
  // Soundcloud-testing
  logTranscodings: PluginConfigSchemaEntry<boolean>;
}

export const PLUGIN_CONFIG_SCHEMA: PluginConfigSchema = {
  accessToken: { defaultValue: '', json: false },
  locale: { defaultValue: 'en', json: false },
  itemsPerPage: { defaultValue: 47, json: false },
  itemsPerSection: { defaultValue: 11, json: false },
  combinedSearchResults: { defaultValue: 11, json: false },
  loadFullPlaylistAlbum: { defaultValue: false, json: false },
  skipPreviewTracks: { defaultValue: false, json: false },
  addPlayedToHistory: { defaultValue: true, json: false },
  longStreamFormat: { defaultValue: LongStreamFormat.Opus, json: false },
  cacheMaxEntries: { defaultValue: 5000, json: false },
  cacheTTL: { defaultValue: 1800, json: false },
  // Soundcloud-testing
  logTranscodings: { defaultValue: false, json: false }
};
