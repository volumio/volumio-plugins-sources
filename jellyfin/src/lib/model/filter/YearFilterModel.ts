import { EntityType } from '../../entities';
import jellyfin from '../../JellyfinContext';
import BaseModel, { GetFiltersParams } from '../BaseModel';
import FilterModel, { Filter, FilterOption, FilterType } from './FilterModel';

export type YearFilterItemType = EntityType.Album | EntityType.Song;

export interface YearFilterModelConfig {
  parentId: string;
  itemType: YearFilterItemType,
  initialSelection?: {
    years?: string[]
  };
}

export default class YearFilterModel extends BaseModel implements FilterModel {

  async getFilter(config?: YearFilterModelConfig): Promise<Filter> {
    if (!config) {
      throw Error('Missing config');
    }
    const selectedYears = config.initialSelection?.years || [];
    const params: GetFiltersParams = {
      parentId: config.parentId,
      itemTypes: [ config.itemType ]
    };
    const apiFilters = await this.getFiltersFromApi(params);
    const options = apiFilters.years?.reduce<FilterOption[]>((results, year) => {
      let value, selected = false;
      const yearStr = String(year);
      if (selectedYears.includes(yearStr)) {
        value = selectedYears.join(',');
        selected = true;
      }
      else {
        const newSelectedValues = [ ...selectedYears, year ];
        value = newSelectedValues.join(',');
      }

      results.push({
        name: yearStr,
        value,
        selected
      });

      return results;
    }, []);

    return {
      type: FilterType.Year,
      title: jellyfin.getI18n('JELLYFIN_FILTER_YEAR_TITLE'),
      placeholder: jellyfin.getI18n('JELLYFIN_FILTER_YEAR_PLACEHOLDER'),
      field: 'years',
      icon: 'fa fa-calendar-o',
      resettable: true,
      options
    };
  }

  async getDefaultSelection(): Promise<Record<string, any>> {
    return {
      years: undefined
    };
  }
}
