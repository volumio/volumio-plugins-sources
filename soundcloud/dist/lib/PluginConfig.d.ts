export type PluginConfigKey = keyof PluginConfigSchema;
export type PluginConfigValue<T extends PluginConfigKey> = PluginConfigSchema[T]['defaultValue'];
export interface PluginConfigSchemaEntry<T, U = false> {
    defaultValue: T;
    json: U;
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
    cacheMaxEntries: PluginConfigSchemaEntry<number>;
    cacheTTL: PluginConfigSchemaEntry<number>;
    logTranscodings: PluginConfigSchemaEntry<boolean>;
}
export declare const PLUGIN_CONFIG_SCHEMA: PluginConfigSchema;
//# sourceMappingURL=PluginConfig.d.ts.map