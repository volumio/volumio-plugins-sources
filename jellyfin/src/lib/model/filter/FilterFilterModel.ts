import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models';
import { EntityType } from '../../entities';
import jellyfin from '../../JellyfinContext';
import BaseModel from '../BaseModel';
import FilterModel, { Filter, FilterOption, FilterType } from './FilterModel';

export type FilterFilterItemType = EntityType.Album | EntityType.Artist |
    EntityType.AlbumArtist | EntityType.Song;

export interface FilterFilterModelConfig {
  itemType: FilterFilterItemType;
  initialSelection?: {
    filters?: string[]
  };
}

interface FilterSetEntry {
  i18nKey: string;
  value: typeof ItemFilter.IsFavorite | typeof ItemFilter.IsPlayed | typeof ItemFilter.IsUnplayed
}

const FILTER_SETS: Record<FilterFilterItemType, FilterSetEntry[]> = {
  [EntityType.Album]: [
    { i18nKey: 'JELLYFIN_FAVORITES', value: ItemFilter.IsFavorite }
  ],
  [EntityType.Artist]: [
    { i18nKey: 'JELLYFIN_FAVORITES', value: ItemFilter.IsFavorite }
  ],
  [EntityType.AlbumArtist]: [
    { i18nKey: 'JELLYFIN_FAVORITES', value: ItemFilter.IsFavorite }
  ],
  [EntityType.Song]: [
    { i18nKey: 'JELLYFIN_FAVORITES', value: ItemFilter.IsFavorite },
    { i18nKey: 'JELLYFIN_PLAYED', value: ItemFilter.IsPlayed },
    { i18nKey: 'JELLYFIN_UNPLAYED', value: ItemFilter.IsUnplayed }
  ]
};

export default class FilterFilterModel extends BaseModel implements FilterModel {

  async getFilter(config?: FilterFilterModelConfig): Promise<Filter> {
    if (!config) {
      throw Error('Missing config');
    }
    const selectedValues = config.initialSelection?.filters || [];
    const options = FILTER_SETS[config.itemType].reduce<FilterOption[]>((results, f) => {
      let value, selected = false;
      if (selectedValues.includes(f.value)) {
        value = selectedValues.join(',');
        selected = true;
      }
      else {
        const newSelectedValues = [ ...selectedValues, f.value ];
        value = newSelectedValues.join(',');
      }

      results.push({
        name: jellyfin.getI18n(f.i18nKey),
        value,
        selected
      });

      return results;
    }, []);

    return {
      type: FilterType.Filter,
      title: jellyfin.getI18n('JELLYFIN_FILTER_FILTER_TITLE'),
      placeholder: jellyfin.getI18n('JELLYFIN_FILTER_FILTER_PLACEHOLDER'),
      field: 'filters',
      icon: 'fa fa-filter',
      resettable: true,
      options
    };
  }

  async getDefaultSelection(): Promise<Record<string, any>> {
    return {
      filters: undefined
    };
  }
}
