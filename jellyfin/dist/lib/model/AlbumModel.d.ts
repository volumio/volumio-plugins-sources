import Album from '../entities/Album';
import BaseModel, { GetItemsParams, GetItemsResult } from './BaseModel';
export default class AlbumModel extends BaseModel {
    getAlbums(params: GetItemsParams): Promise<GetItemsResult<Album>>;
    getAlbum(id: string): Promise<Album | null>;
}
//# sourceMappingURL=AlbumModel.d.ts.map