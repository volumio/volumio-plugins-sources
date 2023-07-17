import { BaseModel } from './BaseModel';
import { I18nOptions, PluginConfigSchema } from '../types/PluginConfig';
export declare const PLUGIN_CONFIG_SCHEMA: PluginConfigSchema;
export default class ConfigModel extends BaseModel {
    #private;
    getI18nOptions(): Promise<I18nOptions>;
    clearCache(): void;
    getRootContentTypeOptions(): {
        label: string;
        value: string;
    }[];
    getLiveStreamQualityOptions(): {
        label: string;
        value: string;
    }[];
}
//# sourceMappingURL=ConfigModel.d.ts.map