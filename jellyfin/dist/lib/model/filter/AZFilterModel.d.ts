import BaseModel from '../BaseModel';
import FilterModel, { Filter } from './FilterModel';
export interface AZFilterModelConfig {
    initialSelection?: {
        nameStartsWith?: string;
    };
}
export default class AZFilterModel extends BaseModel implements FilterModel {
    getFilter(config?: AZFilterModelConfig): Promise<Filter>;
    getDefaultSelection(): Promise<Record<string, any>>;
}
//# sourceMappingURL=AZFilterModel.d.ts.map