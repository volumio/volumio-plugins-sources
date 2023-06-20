import Artist from '../entities/Artist';
import { GetItemsParams, GetItemsResult } from './BaseModel';
import { default as BaseModel } from './BaseModel';
export default class ArtistModel extends BaseModel {
    getArtists(params: GetItemsParams): Promise<GetItemsResult<Artist>>;
    getArtist(id: string): Promise<Artist | null>;
    getAlbumArtists(params: GetItemsParams): Promise<GetItemsResult<Artist>>;
    getAlbumArtist(id: string): Promise<Artist | null>;
}
//# sourceMappingURL=ArtistModel.d.ts.map