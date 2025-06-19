import { type I18nOptions, type PluginConfigSchema } from '../types/PluginConfig';
import { BaseModel } from './BaseModel';
export declare const PLUGIN_CONFIG_SCHEMA: PluginConfigSchema;
export default class ConfigModel extends BaseModel {
    #private;
    getI18nOptions(): Promise<I18nOptions>;
    clearCache(): void;
    getDefaultI18nOptions(): I18nOptions;
}
//# sourceMappingURL=ConfigModel.d.ts.map