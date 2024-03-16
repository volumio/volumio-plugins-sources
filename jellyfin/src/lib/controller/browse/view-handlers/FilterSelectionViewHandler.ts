import { ModelType } from '../../../model';
import FilterModel, { Filter, FilterOption, FilterType, Subfilter } from '../../../model/filter/FilterModel';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import ViewHelper from './ViewHelper';
import jellyfin from '../../../JellyfinContext';
import { RenderedListItem } from './renderer/BaseRenderer';

export interface FilterSelectionView extends View {
  name: 'filter.az' | 'filter.filter' | 'filter.genre' | 'filter.sort' | 'filter.year';
  filterView: string;
}

export default class FilterSelectionViewHandler extends BaseViewHandler<FilterSelectionView> {

  async browse(): Promise<RenderedPage> {
    const prevUri = this.constructPrevUri();
    const lastView = this.previousViews[this.previousViews.length - 1];
    const filterView = JSON.parse(this.currentView.filterView);
    const combinedView: View = {
      ...lastView,
      ...filterView
    };

    let filterType: FilterType;
    let model: FilterModel;
    switch (this.currentView.name) {
      case 'filter.az':
        filterType = FilterType.AZ;
        model = this.getModel(ModelType.AZFilter);
        break;
      case 'filter.filter':
        filterType = FilterType.Filter;
        model = this.getModel(ModelType.FilterFilter);
        break;
      case 'filter.genre':
        filterType = FilterType.Genre;
        model = this.getModel(ModelType.GenreFilter);
        break;
      case 'filter.sort':
        filterType = FilterType.Sort;
        model = this.getModel(ModelType.SortFilter);
        break;
      case 'filter.year':
        filterType = FilterType.Year;
        model = this.getModel(ModelType.YearFilter);
        break;
      default:
        throw Error(`Unknown filter: ${this.currentView. name}`);
    }

    const modelConfig = ViewHelper.getFilterModelConfigFromView(combinedView, filterType);
    if (!modelConfig) {
      throw Error('Invalid filter view');
    }

    const filter = await model.getFilter(modelConfig);
    let lists;
    if (filter.subfilters) {
      const sublists = filter.subfilters.map((f) => this.#getFilterOptionsList(f));
      lists = sublists.reduce((result, list) => {
        return [
          ...result,
          ...list
        ];
      }, []);
    }
    else {
      lists = this.#getFilterOptionsList(filter);
    }

    return {
      navigation: {
        prev: { uri: prevUri },
        lists
      }
    };
  }

  constructPrevUri(): string {
    return this.previousViews.map((view) =>
      ViewHelper.constructUriSegmentFromView(view)).join('/');
  }

  #getBaseUri(field: string): string {
    const previousViews = [ ...this.previousViews ];
    const lastView: View = {...previousViews[previousViews.length - 1]};
    delete lastView[field];
    delete lastView.startIndex;
    previousViews.pop();
    const segments = previousViews.map((view) => ViewHelper.constructUriSegmentFromView(view));
    segments.push(ViewHelper.constructUriSegmentFromView(lastView));
    return segments.join('/');
  }

  #getFilterOptionsList(filter: Filter | Subfilter): RenderedList[] {
    if (!filter.field || !filter.options) {
      return [];
    }
    const baseUri = this.#getBaseUri(filter.field);
    const remember = jellyfin.getConfigValue('rememberFilters');
    const items = filter.options.map<RenderedListItem>((option) => ({
      service: 'jellyfin',
      type: 'jellyfin-filter-option',
      title: option.name,
      icon: option.selected ? 'fa fa-check' : 'fa',
      uri: this.#getFilterOptionUri(baseUri, filter, option, remember)
    }));
    const lists: RenderedList[] = [];
    if (filter.resettable) {
      lists.push({
        availableListViews: [ 'list' ],
        items: [
          {
            service: 'jellyfin',
            type: 'jellyfin-filter-option',
            title: jellyfin.getI18n('JELLYFIN_RESET'),
            icon: 'fa fa-ban',
            uri: this.#getFilterOptionUri(baseUri, filter, null, remember)
          }
        ]
      });
    }
    lists.push({
      availableListViews: [ 'list' ],
      items
    });
    lists[0].title = filter.title;
    return lists;
  }

  #getFilterOptionUri(baseUri: string, filter: Filter | Subfilter, option: FilterOption | null, remember: boolean) {
    // `filter: null` corresponds to reset filter item
    const uri = option ? baseUri + (option.value ? `@${filter.field}=${encodeURIComponent(option.value)}` : '') : baseUri;

    if (remember) {
      const saveFilter = {
        field: filter.field,
        value: option ? option.value : null
      };
      return `${uri}@saveFilter=${encodeURIComponent(JSON.stringify(saveFilter))}`;
    }

    return uri;
  }
}
