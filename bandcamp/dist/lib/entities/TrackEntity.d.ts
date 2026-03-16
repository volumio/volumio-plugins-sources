import type AlbumEntity from './AlbumEntity';
import type ArtistEntity from './ArtistEntity';
interface TrackEntity {
    type: 'track';
    id?: number;
    name: string;
    url?: string;
    duration?: number;
    thumbnail?: string;
    streamUrl?: string;
    album?: AlbumEntity;
    artist?: ArtistEntity;
    position?: number;
}
export default TrackEntity;
//# sourceMappingURL=TrackEntity.d.ts.map