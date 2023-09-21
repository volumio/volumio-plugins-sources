import { GenresApi } from '@jellyfin/sdk/lib/generated-client/api/genres-api';
import { getGenresApi } from '@jellyfin/sdk/lib/utils/api/genres-api';
import Genre from '../entities/Genre';
import { GetItemsParams, GetItemsResult } from './BaseModel';
import { default as BaseModel } from './BaseModel';
import GenreParser from './parser/GenreParser';

export default class GenreModel extends BaseModel {

  async getGenres(params: GetItemsParams): Promise<GetItemsResult<Genre>> {
    const parser = new GenreParser();
    return this.getItemsFromAPI<Genre, GenresApi>(params, parser, {
      getApi: (api) => getGenresApi(api),
      getItems: 'getGenres'
    });
  }

  getGenre(id: string) {
    const parser = new GenreParser();
    return this.getItemFromApi({ itemId: id }, parser);
  }
}
