import BaseModel, { LoopFetchCallbackParams } from './BaseModel';
export interface PlaylistModelGetPlaylistsParams extends LoopFetchCallbackParams {
    username: string;
}
export default class PlaylistModel extends BaseModel {
    #private;
    getPlaylists(params: PlaylistModelGetPlaylistsParams): Promise<import("./BaseModel").LoopFetchResult<import("../entities/PlaylistEntity").PlaylistEntity>>;
    getPlaylist(playlistId: string): Promise<import("../entities/PlaylistEntity").PlaylistEntity | null>;
}
//# sourceMappingURL=PlaylistModel.d.ts.map