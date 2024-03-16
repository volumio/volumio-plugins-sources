export type PluginConfigKey = keyof PluginConfigSchema;
export type PluginConfigValue<T extends PluginConfigKey> = PluginConfigSchema[T]['defaultValue'];

export interface PluginConfigSchemaEntry<T, U = false> {
  defaultValue: T;
  json: U;
}

export interface PluginConfigSchema {
  itemsPerPage: PluginConfigSchemaEntry<number>;
  itemsPerSection: PluginConfigSchemaEntry<number>;
  cacheMaxEntries: PluginConfigSchemaEntry<number>;
  cacheTTL: PluginConfigSchemaEntry<number>;
}

export const PLUGIN_CONFIG_SCHEMA: PluginConfigSchema = {
  itemsPerPage: { defaultValue: 47, json: false },
  itemsPerSection: { defaultValue: 11, json: false },
  cacheMaxEntries: { defaultValue: 5000, json: false },
  cacheTTL: { defaultValue: 1800, json: false }
};
