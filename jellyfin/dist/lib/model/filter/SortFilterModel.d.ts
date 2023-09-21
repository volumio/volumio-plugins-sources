import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models';
import { EntityType } from '../../entities';
import BaseModel from '../BaseModel';
import FilterModel, { Filter } from './FilterModel';
export type SortFilterItemType = EntityType.Album | EntityType.Song | EntityType.Folder;
export interface SortFilterModelConfig {
    itemType: SortFilterItemType;
    initialSelection?: {
        sortBy?: string;
        sortOrder?: SortOrder;
    };
}
export interface SortFilterSelection {
    sortBy: string;
    sortOrder: SortOrder;
}
export default class SortFilterModel extends BaseModel implements FilterModel {
    #private;
    getFilter(config?: SortFilterModelConfig): Promise<Filter>;
    getDefaultSelection(targetType: SortFilterItemType): Promise<SortFilterSelection>;
}
//# sourceMappingURL=SortFilterModel.d.ts.map