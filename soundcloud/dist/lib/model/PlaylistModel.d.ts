import BaseModel from './BaseModel';
import PlaylistEntity from '../entities/PlaylistEntity';
export interface PlaylistModelGetPlaylistsParams {
    search?: string;
    userId?: number;
    pageToken?: string;
    pageOffset?: number;
    limit?: number;
}
export interface PlaylistModelGetPlaylistParams {
    tracksOffset?: number;
    tracksLimit?: number;
    loadTracks?: boolean;
    type?: 'system';
}
export default class PlaylistModel extends BaseModel {
    #private;
    getPlaylists(params: PlaylistModelGetPlaylistsParams): Promise<import("./BaseModel").LoopFetchResult<import("../entities/PlaylistEntity").RegularPlaylistEntity | import("../entities/PlaylistEntity").SystemPlaylistEntity>>;
    getPlaylist(playlistId: string | number, options?: PlaylistModelGetPlaylistParams): Promise<PlaylistEntity | null>;
}
//# sourceMappingURL=PlaylistModel.d.ts.map