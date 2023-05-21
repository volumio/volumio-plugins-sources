export enum FilterType {
  AZ = 'AZ',
  Genre = 'Genre',
  Year = 'Year',
  Filter = 'Filter',
  Sort = 'Sort'
}

export interface Filter {
  type: FilterType,
  title?: string,
  placeholder: string,
  field?: string,
  icon?: string,
  resettable?: boolean,
  options?: FilterOption[],
  subfilters?: Subfilter[]
}

export type Subfilter = Omit<Filter, 'type'>;

export interface FilterOption {
  name: string,
  value: any,
  selected?: boolean
}

export type FilterSelection = Record<string, FilterOption['value']>;

interface FilterModel {
  getFilter(config?: any): Promise<Filter>;
  getDefaultSelection(params: any): Promise<FilterSelection>;
}

export default FilterModel;
