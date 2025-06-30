export type PluginConfigKey = keyof PluginConfigSchema;
export type PluginConfigValue<T extends PluginConfigKey> = PluginConfigSchema[T]['defaultValue'];
export interface PluginConfigSchemaEntry<T, U = false> {
    defaultValue: T;
    json: U;
}
export interface PluginConfigSchema {
    region: PluginConfigSchemaEntry<string>;
    language: PluginConfigSchemaEntry<string>;
    loadFullPlaylists: PluginConfigSchemaEntry<boolean>;
    autoplay: PluginConfigSchemaEntry<boolean>;
    autoplayClearQueue: PluginConfigSchemaEntry<boolean>;
    addToHistory: PluginConfigSchemaEntry<boolean>;
    prefetch: PluginConfigSchemaEntry<boolean>;
    preferOpus: PluginConfigSchemaEntry<boolean>;
    cookie: PluginConfigSchemaEntry<string>;
    activeChannelHandle: PluginConfigSchemaEntry<string>;
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
export interface Account {
    name: string;
    photo: string | null;
    active: boolean;
    handle: string;
    pageId?: string;
    datasyncIdToken: string;
}
//# sourceMappingURL=PluginConfig.d.ts.map