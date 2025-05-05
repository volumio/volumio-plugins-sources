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
    'yt-cast-receiver': PluginConfigSchemaEntry<Record<string, any>, true>;
    dataStoreLastModified: PluginConfigSchemaEntry<number | null>;
    debug: PluginConfigSchemaEntry<boolean>;
}
export declare const PLUGIN_CONFIG_SCHEMA: PluginConfigSchema;
export {};
//# sourceMappingURL=PluginConfig.d.ts.map