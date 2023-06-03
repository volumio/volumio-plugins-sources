import { FilterType } from '../../../model/filter/FilterModel';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedList } from './ViewHandler';
import { GetItemsParams } from '../../../model/BaseModel';
export interface FilterableViewConfig {
    showFilters: boolean;
    saveFiltersKey: string;
    filterTypes: FilterType[];
}
export interface HandleFiltersResult {
    lists: RenderedList[];
    modelQueryParams: GetItemsParams;
}
export default abstract class FilterableViewHandler<V extends View> extends BaseViewHandler<V> {
    #private;
    protected handleFilters(): Promise<HandleFiltersResult>;
    protected abstract getFilterableViewConfig(): FilterableViewConfig;
}
//# sourceMappingURL=FilterableViewHandler.d.ts.map