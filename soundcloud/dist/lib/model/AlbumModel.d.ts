import BaseModel from './BaseModel';
import AlbumEntity from '../entities/AlbumEntity';
export interface AlbumModelGetAlbumsParams {
    search?: string;
    userId?: number;
    pageToken?: string;
    pageOffset?: number;
    limit?: number;
}
export interface AlbumModelGetAlbumParams {
    tracksOffset?: number;
    tracksLimit?: number;
    loadTracks?: boolean;
}
export default class AlbumModel extends BaseModel {
    #private;
    getAlbums(params: AlbumModelGetAlbumsParams): Promise<import("./BaseModel").LoopFetchResult<AlbumEntity>>;
    getAlbum(albumId: number, options?: AlbumModelGetAlbumParams): Promise<AlbumEntity | null>;
}
//# sourceMappingURL=AlbumModel.d.ts.map