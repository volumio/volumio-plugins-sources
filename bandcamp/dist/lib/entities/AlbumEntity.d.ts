import type ArtistEntity from './ArtistEntity';
import type TrackEntity from './TrackEntity';
interface AlbumEntity {
    type: 'album';
    name: string;
    url?: string;
    thumbnail?: string;
    artist?: ArtistEntity;
    tracks?: TrackEntity[];
    featuredTrack?: TrackEntity;
    releaseDate?: string;
}
export default AlbumEntity;
//# sourceMappingURL=AlbumEntity.d.ts.map