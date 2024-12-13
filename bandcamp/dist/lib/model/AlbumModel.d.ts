import BaseModel from './BaseModel';
import type AlbumEntity from '../entities/AlbumEntity';
export default class AlbumModel extends BaseModel {
    #private;
    getAlbum(albumUrl: string): Promise<AlbumEntity>;
}
//# sourceMappingURL=AlbumModel.d.ts.map