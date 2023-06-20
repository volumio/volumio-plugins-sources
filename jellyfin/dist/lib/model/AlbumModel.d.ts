import Album from '../entities/Album';
import BaseModel, { GetItemsParams, GetItemsResult } from './BaseModel';
export interface GetSimilarAlbumsParams {
    album: Album;
    limit?: number;
}
export default class AlbumModel extends BaseModel {
    getAlbums(params: GetItemsParams): Promise<GetItemsResult<Album>>;
    getAlbum(id: string): Promise<Album | null>;
    getSimilarAlbums(params: GetSimilarAlbumsParams): Promise<Album[]>;
}
//# sourceMappingURL=AlbumModel.d.ts.map