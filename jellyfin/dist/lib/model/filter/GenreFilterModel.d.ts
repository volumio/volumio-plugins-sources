import BaseModel from '../BaseModel';
import FilterModel, { Filter } from './FilterModel';
export interface GenreFilterModelConfig {
    parentId: string;
    initialSelection?: {
        genreIds?: string[];
    };
}
export default class GenreFilterModel extends BaseModel implements FilterModel {
    getFilter(config?: GenreFilterModelConfig): Promise<Filter>;
    getDefaultSelection(): Promise<Record<string, any>>;
}
//# sourceMappingURL=GenreFilterModel.d.ts.map