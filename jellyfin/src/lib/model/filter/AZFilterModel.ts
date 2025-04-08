import jellyfin from '../../JellyfinContext';
import BaseModel from '../BaseModel';
import FilterModel, { Filter, FilterType } from './FilterModel';

const AZ = [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z' ];

export interface AZFilterModelConfig {
  initialSelection?: {
    nameStartsWith?: string
  };
}

export default class AZFilterModel extends BaseModel implements FilterModel {

  async getFilter(config?: AZFilterModelConfig): Promise<Filter> {
    const options = AZ.map((c) => ({
      name: c,
      value: c,
      selected: c === config?.initialSelection?.nameStartsWith
    }));

    return {
      type: FilterType.AZ,
      title: jellyfin.getI18n('JELLYFIN_FILTER_AZ_TITLE'),
      placeholder: jellyfin.getI18n('JELLYFIN_FILTER_AZ_PLACEHOLDER'),
      field: 'nameStartsWith',
      icon: 'fa fa-font',
      resettable: true,
      options
    };
  }

  async getDefaultSelection(): Promise<Record<string, any>> {
    return {
      nameStartsWith: undefined
    };
  }
}
