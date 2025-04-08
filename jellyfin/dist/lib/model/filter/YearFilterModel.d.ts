import { EntityType } from '../../entities';
import BaseModel from '../BaseModel';
import FilterModel, { Filter } from './FilterModel';
export type YearFilterItemType = EntityType.Album | EntityType.Song;
export interface YearFilterModelConfig {
    parentId: string;
    itemType: YearFilterItemType;
    initialSelection?: {
        years?: string[];
    };
}
export default class YearFilterModel extends BaseModel implements FilterModel {
    getFilter(config?: YearFilterModelConfig): Promise<Filter>;
    getDefaultSelection(): Promise<Record<string, any>>;
}
//# sourceMappingURL=YearFilterModel.d.ts.map