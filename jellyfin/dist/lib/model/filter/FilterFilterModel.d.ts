import { EntityType } from '../../entities';
import BaseModel from '../BaseModel';
import FilterModel, { Filter } from './FilterModel';
export type FilterFilterItemType = EntityType.Album | EntityType.Artist | EntityType.AlbumArtist | EntityType.Song;
export interface FilterFilterModelConfig {
    itemType: FilterFilterItemType;
    initialSelection?: {
        filters?: string[];
    };
}
export default class FilterFilterModel extends BaseModel implements FilterModel {
    getFilter(config?: FilterFilterModelConfig): Promise<Filter>;
    getDefaultSelection(): Promise<Record<string, any>>;
}
//# sourceMappingURL=FilterFilterModel.d.ts.map