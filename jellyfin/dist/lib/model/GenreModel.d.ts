import Genre from '../entities/Genre';
import { GetItemsParams, GetItemsResult } from './BaseModel';
import { default as BaseModel } from './BaseModel';
export default class GenreModel extends BaseModel {
    getGenres(params: GetItemsParams): Promise<GetItemsResult<Genre>>;
    getGenre(id: string): Promise<Genre | null>;
}
//# sourceMappingURL=GenreModel.d.ts.map