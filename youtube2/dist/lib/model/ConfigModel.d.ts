import { BaseModel } from './BaseModel';
import { I18nOptions } from '../types/ConfigData';
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