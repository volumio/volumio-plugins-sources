import { EntityType } from '../../../entities';
import { ModelType } from '../../../model';
import { Filter, FilterSelection, FilterType, Subfilter } from '../../../model/filter/FilterModel';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
import jellyfin from '../../../JellyfinContext';
import { RenderedList } from './ViewHandler';
import { RenderedListItem } from './renderer/BaseRenderer';
import ViewHelper from './ViewHelper';
import { GetItemsParams } from '../../../model/BaseModel';
import { FilterSelectionView } from './FilterSelectionViewHandler';

export interface FilterableViewConfig {
  showFilters: boolean;
  saveFiltersKey: string;
  filterTypes: FilterType[];
}

export interface HandleFiltersResult {
  lists: RenderedList[];
  modelQueryParams: GetItemsParams
}

export default abstract class FilterableViewHandler<V extends View> extends BaseViewHandler<V> {

  protected async handleFilters(): Promise<HandleFiltersResult> {
    const {showFilters, saveFiltersKey, filterTypes} = this.getFilterableViewConfig();
    if (showFilters) {
      this.#saveFilters(saveFiltersKey);
      const filterList = await this.#getFilterList(saveFiltersKey, ...filterTypes);
      return {
        lists: [ filterList.list ],
        modelQueryParams: this.getModelQueryParams({
          ...this.currentView,
          ...filterList.selection
        })
      };
    }
    return {
      lists: [],
      modelQueryParams: this.getModelQueryParams()
    };
  }

  protected abstract getFilterableViewConfig(): FilterableViewConfig;

  async #getFilterList(saveKey: string, ...filterTypes: FilterType[]): Promise<{ list: RenderedList, selection: View }> {
    const filterSelection = this.#getFilterSelection(saveKey, ...filterTypes);
    const filterView: View = {
      ...this.currentView,
      ...filterSelection
    };

    const promises = filterTypes.map((filterType) => {
      switch (filterType) {
        case FilterType.AZ:
          const azFilterConfig = ViewHelper.getFilterModelConfigFromView(filterView, FilterType.AZ);
          return azFilterConfig ? this.getModel(ModelType.AZFilter).getFilter(azFilterConfig) : Promise.resolve(null);

        case FilterType.Filter:
          const filterFilterConfig = ViewHelper.getFilterModelConfigFromView(filterView, FilterType.Filter);
          return filterFilterConfig ? this.getModel(ModelType.FilterFilter).getFilter(filterFilterConfig) : Promise.resolve(null);

        case FilterType.Genre:
          const genreFilterConfig = ViewHelper.getFilterModelConfigFromView(filterView, FilterType.Genre);
          return genreFilterConfig ? this.getModel(ModelType.GenreFilter).getFilter(genreFilterConfig) : Promise.resolve(null);

        case FilterType.Sort:
          const sortFilterConfig = ViewHelper.getFilterModelConfigFromView(filterView, FilterType.Sort);
          return sortFilterConfig ? this.getModel(ModelType.SortFilter).getFilter(sortFilterConfig) : Promise.resolve(null);

        case FilterType.Year:
          const yearFilterConfig = ViewHelper.getFilterModelConfigFromView(filterView, FilterType.Year);
          return yearFilterConfig ? this.getModel(ModelType.YearFilter).getFilter(yearFilterConfig) : Promise.resolve(null);

        default:
          return Promise.resolve(null);
      }
    });

    const filters = await Promise.all(promises);
    const listItems = filters.reduce<RenderedListItem[]>((result, filter) => {
      if (filter) {
        let title: string;
        if (filter.subfilters) {
          const subfilterTexts = filter.subfilters.map((f) => this.#getFilterListItemText(f));
          title = subfilterTexts.join(', ');
        }
        else {
          title = this.#getFilterListItemText(filter);
        }

        let filterViewName: FilterSelectionView['name'];
        switch (filter.type) {
          case FilterType.AZ:
            filterViewName = 'filter.az';
            break;
          case FilterType.Filter:
            filterViewName = 'filter.filter';
            break;
          case FilterType.Genre:
            filterViewName = 'filter.genre';
            break;
          case FilterType.Sort:
            filterViewName = 'filter.sort';
            break;
          case FilterType.Year:
          default:
            filterViewName = 'filter.year';
        }
        const filterSelectionView: FilterSelectionView = {
          name: filterViewName,
          filterView: JSON.stringify(filterView)
        };

        result.push({
          service: 'jellyfin',
          type: 'jellyfin-filter',
          title,
          icon: filter.icon,
          uri: `${this.uri}/${ViewHelper.constructUriSegmentFromView(filterSelectionView)}`
        });
      }

      return result;
    }, []);

    return {
      list: {
        availableListViews: [ 'list' ],
        items: listItems
      },
      selection: filterView
    };
  }

  /**
   * Returns object:
   * {
   *  sortBy: ...
   *  sortOrder: ...
   *  genreIds: ...
   *  ...
   * }
   * @param {string} saveKey Key used to retrieve a saved selection
   * @param {...FilterType} types Filter types
   */
  #getFilterSelection(saveKey: string, ...types: FilterType[]): Record<string, any> {
    const defaultSelection = this.#getDefaultFilterSelection(...types);
    const savedSelection = this.#getSavedFilterSelection(saveKey);

    const selectionFromView: Record<string, any> = {};
    const fields = Object.keys(defaultSelection);
    const view = this.currentView;
    fields.forEach((f) => {
      if (view[f] !== undefined) {
        selectionFromView[f] = view[f];
      }
    });

    // Remove fields with undefined values from default selection
    const cleanDefaultSelection: Record<string, any> = {};
    for (const [ field, value ] of Object.entries(defaultSelection)) {
      if (value !== undefined) {
        cleanDefaultSelection[field] = value;
      }
      else if (Array.isArray(value)) {
        cleanDefaultSelection[field] = value.join(',');
      }
    }

    return {
      ...cleanDefaultSelection,
      ...savedSelection,
      ...selectionFromView
    };
  }

  async #getDefaultFilterSelection(...filterTypes: FilterType[]): Promise<FilterSelection> {
    const promises = filterTypes.map((filterType) => {
      switch (filterType) {
        case FilterType.AZ:
          return this.getModel(ModelType.AZFilter).getDefaultSelection();
        case FilterType.Filter:
          return this.getModel(ModelType.FilterFilter).getDefaultSelection();
        case FilterType.Genre:
          return this.getModel(ModelType.GenreFilter).getDefaultSelection();
        case FilterType.Sort:
          switch (this.currentView.name) {
            case 'albums':
              return this.getModel(ModelType.SortFilter).getDefaultSelection(EntityType.Album);
            case 'songs':
              return this.getModel(ModelType.SortFilter).getDefaultSelection(EntityType.Song);
            case 'folder':
              return this.getModel(ModelType.SortFilter).getDefaultSelection(EntityType.Folder);
            default:
              return Promise.resolve(null);
          }
        case FilterType.Year:
          return this.getModel(ModelType.YearFilter).getDefaultSelection();
      }
    });

    const filterSelections = await Promise.all(promises);
    const result: FilterSelection = {};
    filterSelections.forEach((selection) => {
      if (selection) {
        Object.assign(result, selection);
      }
    });

    return result;
  }

  #getSavedFilterSelection(key: string): FilterSelection {
    const remember = jellyfin.getConfigValue('rememberFilters');
    if (remember && this.serverConnection) {
      const savedSelections = jellyfin.getConfigValue('savedFilters');
      if (savedSelections) {
        const fullKey = `${this.serverConnection.id}.${key}`;
        return savedSelections[fullKey] || {};
      }
    }
    return {};
  }

  #getFilterListItemText(filter: Filter | Subfilter): string {
    const selected = filter.options?.filter((o) => o.selected) || [];
    if (selected.length > 0) {
      return selected.map((o) => o.name).join(', ');
    }

    return filter.placeholder;
  }

  #saveFilters(key: string) {
    const remember = jellyfin.getConfigValue('rememberFilters');
    const view = this.currentView;
    if (remember && view.saveFilter && this.serverConnection) {
      const saveFilterData = JSON.parse(view.saveFilter);
      const savedFilters = jellyfin.getConfigValue('savedFilters') || {};
      const fullKey = `${this.serverConnection.id}.${key}`;
      if (!savedFilters[fullKey]) {
        savedFilters[fullKey] = {};
      }
      if (saveFilterData.value != null) {
        savedFilters[fullKey][saveFilterData.field] = saveFilterData.value;
      }
      else {
        delete savedFilters[fullKey][saveFilterData.field];
      }
      jellyfin.setConfigValue('savedFilters', savedFilters);

      jellyfin.getLogger().info('[jellyfin-browse] Filters saved: ', savedFilters);
    }
  }
}
