import { Album, LibraryItem, Playlist, Selection, SystemPlaylist, Track, User } from 'soundcloud-fetch';
import UserEntity from '../entities/UserEntity';
import PlaylistEntity from '../entities/PlaylistEntity';
import TrackEntity from '../entities/TrackEntity';
import AlbumEntity from '../entities/AlbumEntity';
import SelectionEntity from '../entities/SelectionEntity';
export default class Mapper {
    #private;
    static mapUser(data: User): Promise<UserEntity>;
    static mapPlaylist(data: Playlist | SystemPlaylist): Promise<PlaylistEntity>;
    static mapTrack(data: Track): Promise<TrackEntity>;
    static mapLibraryItem(data: LibraryItem): Promise<AlbumEntity | PlaylistEntity | null>;
    static mapAlbum(data: Album): Promise<AlbumEntity>;
    static mapSelection(data: Selection): Promise<SelectionEntity>;
}
//# sourceMappingURL=Mapper.d.ts.map