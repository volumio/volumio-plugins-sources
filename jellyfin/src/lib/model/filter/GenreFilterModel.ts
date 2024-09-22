import jellyfin from '../../JellyfinContext';
import BaseModel from '../BaseModel';
import GenreModel from '../GenreModel';
import FilterModel, { Filter, FilterOption, FilterType } from './FilterModel';

export interface GenreFilterModelConfig {
  parentId: string;
  initialSelection?: {
    genreIds?: string[]
  };
}

export default class GenreFilterModel extends BaseModel implements FilterModel {

  async getFilter(config?: GenreFilterModelConfig): Promise<Filter> {
    if (!config) {
      throw Error('Missing config');
    }
    const selectedGenreIds = config.initialSelection?.genreIds || [];
    const model = new GenreModel(this.connection);
    const genres = await model.getGenres({
      parentId: config.parentId
    });
    const options = genres.items.reduce<FilterOption[]>((results, genre) => {
      let value, selected = false;
      if (selectedGenreIds.includes(genre.id)) {
        value = selectedGenreIds.join(',');
        selected = true;
      }
      else {
        const newSelectedValues = [ ...selectedGenreIds, genre.id ];
        value = newSelectedValues.join(',');
      }

      results.push({
        name: genre.name,
        value,
        selected
      });

      return results;
    }, []);

    return {
      type: FilterType.Genre,
      title: jellyfin.getI18n('JELLYFIN_FILTER_GENRE_TITLE'),
      placeholder: jellyfin.getI18n('JELLYFIN_FILTER_GENRE_PLACEHOLDER'),
      field: 'genreIds',
      icon: 'fa fa-music',
      resettable: true,
      options
    };
  }

  async getDefaultSelection(): Promise<Record<string, any>> {
    return {
      genreIds: []
    };
  }
}
