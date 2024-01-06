import Playlist from '../entities/Playlist';
import { GetItemsParams, GetItemsResult } from './BaseModel';
import { default as BaseModel } from './BaseModel';
export default class PlaylistModel extends BaseModel {
    getPlaylists(params: GetItemsParams): Promise<GetItemsResult<Playlist>>;
    getPlaylist(id: string): Promise<Playlist | null>;
}
//# sourceMappingURL=PlaylistModel.d.ts.map