import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models';
import { EntityType } from '../../entities';
import jellyfin from '../../JellyfinContext';
import BaseModel from '../BaseModel';
import FilterModel, { Filter, FilterType, Subfilter } from './FilterModel';

export type SortFilterItemType = EntityType.Album | EntityType.Song | EntityType.Folder;

export interface SortFilterModelConfig {
  itemType: SortFilterItemType;
  initialSelection?: {
    sortBy?: string,
    sortOrder?: SortOrder
  };
}

export interface SortFilterSelection {
  sortBy: string,
  sortOrder: SortOrder
}

interface SortBySetEntry {
  i18nKey: string;
  value: string;
  default?: boolean;
}

interface SortOrderSetEntry {
  i18nKey: string;
  value: typeof SortOrder.Ascending | typeof SortOrder.Descending
}

const SORT_BY_SETS: Record<SortFilterItemType, SortBySetEntry[]> = {
  [EntityType.Album]: [
    { i18nKey: 'JELLYFIN_NAME', value: 'SortName' },
    { i18nKey: 'JELLYFIN_ALBUM_ARTIST', value: 'AlbumArtist,SortName' },
    { i18nKey: 'JELLYFIN_COMMUNITY_RATING', value: 'CommunityRating,SortName' },
    { i18nKey: 'JELLYFIN_CRITIC_RATING', value: 'CriticRating,SortName' },
    { i18nKey: 'JELLYFIN_DATE_ADDED', value: 'DateCreated,SortName' },
    { i18nKey: 'JELLYFIN_RELEASE_DATE', value: 'ProductionYear,PremiereDate,SortName' },
    { i18nKey: 'JELLYFIN_RANDOM', value: 'Random,SortName' }
  ],
  [EntityType.Song]: [
    { i18nKey: 'JELLYFIN_TRACK_NAME', value: 'Name' },
    { i18nKey: 'JELLYFIN_ALBUM', value: 'Album,SortName' },
    { i18nKey: 'JELLYFIN_ALBUM_ARTIST', value: 'AlbumArtist,Album,SortName' },
    { i18nKey: 'JELLYFIN_ARTIST', value: 'Artist,Album,SortName' },
    { i18nKey: 'JELLYFIN_DATE_ADDED', value: 'DateCreated,SortName' },
    { i18nKey: 'JELLYFIN_DATE_PLAYED', value: 'DatePlayed,SortName' },
    { i18nKey: 'JELLYFIN_PLAY_COUNT', value: 'PlayCount,SortName' },
    { i18nKey: 'JELLYFIN_RELEASE_DATE', value: 'PremiereDate,AlbumArtist,Album,SortName' },
    { i18nKey: 'JELLYFIN_RUNTIME', value: 'Runtime,AlbumArtist,Album,SortName' },
    { i18nKey: 'JELLYFIN_RANDOM', value: 'Random,SortName' }
  ],
  [EntityType.Folder]: [
    { i18nKey: 'JELLYFIN_NAME', value: 'SortName' },
    { i18nKey: 'JELLYFIN_COMMUNITY_RATING', value: 'CommunityRating,SortName' },
    { i18nKey: 'JELLYFIN_CRITIC_RATING', value: 'CriticRating,SortName' },
    { i18nKey: 'JELLYFIN_DATE_ADDED', value: 'DateCreated,SortName' },
    { i18nKey: 'JELLYFIN_DATE_PLAYED', value: 'DatePlayed,SortName' },
    { i18nKey: 'JELLYFIN_FOLDERS', value: 'IsFolder,SortName', default: true },
    { i18nKey: 'JELLYFIN_PLAY_COUNT', value: 'PlayCount,SortName' },
    { i18nKey: 'JELLYFIN_RELEASE_DATE', value: 'ProductionYear,PremiereDate,SortName' },
    { i18nKey: 'JELLYFIN_RUNTIME', value: 'Runtime,SortName' }
  ]
};

const SORT_ORDERS: SortOrderSetEntry[] = [
  { i18nKey: 'JELLYFIN_ASCENDING', value: SortOrder.Ascending },
  { i18nKey: 'JELLYFIN_DESCENDING', value: SortOrder.Descending }
];

export default class SortFilterModel extends BaseModel implements FilterModel {

  async getFilter(config?: SortFilterModelConfig): Promise<Filter> {
    if (!config) {
      throw Error('Missing config');
    }

    const sortByFilter = await this.#getSortByFilter(config);
    const sortOrderFilter = this.#getSortOrderFilter(config);

    return {
      type: FilterType.Sort,
      subfilters: [
        sortByFilter,
        sortOrderFilter
      ],
      icon: 'fa fa-sort',
      placeholder: ''
    };
  }

  async #getSortByFilter(config: SortFilterModelConfig): Promise<Subfilter> {
    const defaultSortBy = (await this.getDefaultSelection(config.itemType)).sortBy;
    const selectedSortByValue = config.initialSelection?.sortBy || defaultSortBy;

    const options = SORT_BY_SETS[config.itemType].map((sortBy) => ({
      name: jellyfin.getI18n(sortBy.i18nKey),
      value: sortBy.value,
      selected: selectedSortByValue == sortBy.value
    }));

    return {
      title: jellyfin.getI18n('JELLYFIN_FILTER_SORT_BY_TITLE'),
      field: 'sortBy',
      icon: 'fa fa-sort',
      resettable: false,
      placeholder: '',
      options
    };
  }

  #getSortOrderFilter(config: SortFilterModelConfig): Subfilter {
    const selectedSortOrderValue = config.initialSelection?.sortOrder || SORT_ORDERS[0].value;

    const options = SORT_ORDERS.map((sortOrder) => ({
      name: jellyfin.getI18n(sortOrder.i18nKey),
      value: sortOrder.value,
      selected: selectedSortOrderValue == sortOrder.value
    }));

    return {
      title: jellyfin.getI18n('JELLYFIN_FILTER_SORT_ORDER_TITLE'),
      field: 'sortOrder',
      icon: 'fa fa-sort',
      resettable: false,
      placeholder: '',
      options
    };
  }

  async getDefaultSelection(targetType: SortFilterItemType): Promise<SortFilterSelection> {
    const defaultSortByIndex = Math.max(SORT_BY_SETS[targetType].findIndex((s) => s.default), 0);
    return {
      sortBy: SORT_BY_SETS[targetType][defaultSortByIndex].value,
      sortOrder: SORT_ORDERS[0].value
    };
  }
}
