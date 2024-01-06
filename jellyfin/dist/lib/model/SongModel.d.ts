import Song from '../entities/Song';
import BaseModel, { GetItemsParams, GetItemsResult } from './BaseModel';
export default class SongModel extends BaseModel {
    getSongs(params: GetItemsParams): Promise<GetItemsResult<Song>>;
    getSong(id: string): Promise<Song | null>;
}
//# sourceMappingURL=SongModel.d.ts.map