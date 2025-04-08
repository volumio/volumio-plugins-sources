import { EntityType } from '../../../entities';
import { AZFilterModelConfig } from '../../../model/filter/AZFilterModel';
import { FilterFilterModelConfig, FilterFilterItemType } from '../../../model/filter/FilterFilterModel';
import { FilterType } from '../../../model/filter/FilterModel';
import { GenreFilterModelConfig } from '../../../model/filter/GenreFilterModel';
import { SortFilterItemType, SortFilterModelConfig } from '../../../model/filter/SortFilterModel';
import { YearFilterItemType, YearFilterModelConfig } from '../../../model/filter/YearFilterModel';
import ServerHelper from '../../../util/ServerHelper';
import View from './View';

type FilterModelConfig = AZFilterModelConfig | FilterFilterModelConfig |
  GenreFilterModelConfig | SortFilterModelConfig | YearFilterModelConfig;


export default class ViewHelper {

  static getViewsFromUri(uri: string): View[] {
    const segments = uri.split('/');
    if (segments[0] !== 'jellyfin') {
      return [];
    }

    const result: View[] = [];

    let serverId: string;
    let username: string;
    segments.forEach((segment, index) => {
      let view: View;
      if (index === 0) { // 'jellyfin/...'
        view = {
          name: 'root'
        };
      }
      else if (index === 1) { // 'jellyfin/username@serverId/...'
        view = {
          name: 'userViews'
        };
        const segmentParts = segment.split('@');
        if (segmentParts.length === 2) {
          username = decodeURIComponent(segmentParts[0]);
          serverId = decodeURIComponent(segmentParts[1]);
        }
        else {
          username = '';
          serverId = decodeURIComponent(segmentParts[0]);
        }
        view.serverId = serverId;
        view.username = username;
      }
      else {
        view = this.#getViewFromUriSegment(segment);
        view.serverId = serverId;
        view.username = username;
      }
      result.push(view);
    });

    return result;
  }

  static constructUriSegmentFromView<V extends View>(view: V) {
    let segment: string;
    if (view.name === 'root') {
      segment = 'jellyfin';
    }
    else if (view.name === 'userViews' && view.serverId && view.username) {
      segment = ServerHelper.generateConnectionId(view.username, view.serverId);
    }
    else {
      segment = view.name;
    }

    const skip = [ 'name', 'startIndex', 'serverId', 'username', 'saveFilter', 'noExplode' ];
    Object.keys(view).filter((key) => !skip.includes(key)).forEach((key) => {
      if (view[key] !== undefined) {
        segment += `@${key}=${encodeURIComponent(view[key])}`;
      }
    });

    if (view.startIndex) {
      segment += `@startIndex=${view.startIndex}`;
    }

    return segment;
  }

  static #getViewFromUriSegment(segment: string): View {
    const result: View = {
      name: '',
      startIndex: 0
    };
    segment.split('@').forEach((s) => {
      const equalIndex = s.indexOf('=');
      if (equalIndex < 0) {
        result.name = s;
      }
      else {
        const key = s.substring(0, equalIndex);
        const value = s.substring(equalIndex + 1);
        if (key === 'startIndex') {
          result[key] = parseInt(value, 10);
        }
        else {
          result[key] = decodeURIComponent(value);
        }
      }
    });

    return result;
  }

  static getFilterModelConfigFromView(view: View, filterType: FilterType.Year): YearFilterModelConfig | null;
  static getFilterModelConfigFromView(view: View, filterType: FilterType.Sort): SortFilterModelConfig | null;
  static getFilterModelConfigFromView(view: View, filterType: FilterType.Genre): GenreFilterModelConfig | null;
  static getFilterModelConfigFromView(view: View, filterType: FilterType.Filter): FilterFilterModelConfig | null;
  static getFilterModelConfigFromView(view: View, filterType: FilterType.AZ): AZFilterModelConfig | null;
  static getFilterModelConfigFromView(view: View, filterType: FilterType): FilterModelConfig | null;
  static getFilterModelConfigFromView(view: any, filterType: any): FilterModelConfig | null {
    switch (filterType) {
      case FilterType.AZ:
        return view.nameStartsWith ? {
          initialSelection: { nameStartsWith: view.nameStartsWith }
        } as AZFilterModelConfig : {};

      case FilterType.Filter:
        let filterFilterItemType: FilterFilterItemType;
        switch (view.name) {
          case 'albums':
            filterFilterItemType = EntityType.Album;
            break;
          case 'songs':
            filterFilterItemType = EntityType.Song;
            break;
          case 'artists':
            filterFilterItemType = EntityType.Artist;
            break;
          case 'albumArtists':
            filterFilterItemType = EntityType.AlbumArtist;
            break;
          default:
            return null;
        }
        const filterFilterConfig: FilterFilterModelConfig = {
          itemType: filterFilterItemType
        };
        if (view.filters) {
          filterFilterConfig.initialSelection = {
            filters: view.filters.split(',')
          };
        }
        return filterFilterConfig;

      case FilterType.Genre:
        if (!view.parentId) {
          return null;
        }
        const genreFilterConfig: GenreFilterModelConfig = {
          parentId: view.parentId
        };
        if (view.genreIds) {
          genreFilterConfig.initialSelection = {
            genreIds: view.genreIds.split(',')
          };
        }
        return genreFilterConfig;

      case FilterType.Sort:
        let sortFilterItemType: SortFilterItemType;
        switch (view.name) {
          case 'albums':
            sortFilterItemType = EntityType.Album;
            break;
          case 'songs':
            sortFilterItemType = EntityType.Song;
            break;
          case 'folder':
            sortFilterItemType = EntityType.Folder;
            break;
          default:
            return null;
        }
        const sortFilterConfig: SortFilterModelConfig = {
          itemType: sortFilterItemType
        };
        if (view.sortBy || view.sortOrder) {
          sortFilterConfig.initialSelection = {};
          if (view.sortBy) {
            sortFilterConfig.initialSelection.sortBy = view.sortBy;
          }
          if (view.sortOrder) {
            sortFilterConfig.initialSelection.sortOrder = view.sortOrder;
          }
        }
        return sortFilterConfig;

      case FilterType.Year:
        if (!view.parentId) {
          return null;
        }
        let yearFilterItemType: YearFilterItemType;
        switch (view.name) {
          case 'albums':
            yearFilterItemType = EntityType.Album;
            break;
          case 'songs':
            yearFilterItemType = EntityType.Song;
            break;
          default:
            return null;
        }
        const yearFilterConfig: YearFilterModelConfig = {
          parentId: view.parentId,
          itemType: yearFilterItemType
        };
        if (view.years) {
          yearFilterConfig.initialSelection = {
            years: view.years.split(',')
          };
        }
        return yearFilterConfig;

      default:
        return null;
    }
  }
}
