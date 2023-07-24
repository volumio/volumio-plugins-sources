import { AZFilterModelConfig } from '../../../model/filter/AZFilterModel';
import { FilterFilterModelConfig } from '../../../model/filter/FilterFilterModel';
import { FilterType } from '../../../model/filter/FilterModel';
import { GenreFilterModelConfig } from '../../../model/filter/GenreFilterModel';
import { SortFilterModelConfig } from '../../../model/filter/SortFilterModel';
import { YearFilterModelConfig } from '../../../model/filter/YearFilterModel';
import View from './View';
type FilterModelConfig = AZFilterModelConfig | FilterFilterModelConfig | GenreFilterModelConfig | SortFilterModelConfig | YearFilterModelConfig;
export default class ViewHelper {
    #private;
    static getViewsFromUri(uri: string): View[];
    static constructUriSegmentFromView<V extends View>(view: V): string;
    static getFilterModelConfigFromView(view: View, filterType: FilterType.Year): YearFilterModelConfig | null;
    static getFilterModelConfigFromView(view: View, filterType: FilterType.Sort): SortFilterModelConfig | null;
    static getFilterModelConfigFromView(view: View, filterType: FilterType.Genre): GenreFilterModelConfig | null;
    static getFilterModelConfigFromView(view: View, filterType: FilterType.Filter): FilterFilterModelConfig | null;
    static getFilterModelConfigFromView(view: View, filterType: FilterType.AZ): AZFilterModelConfig | null;
    static getFilterModelConfigFromView(view: View, filterType: FilterType): FilterModelConfig | null;
}
export {};
//# sourceMappingURL=ViewHelper.d.ts.map