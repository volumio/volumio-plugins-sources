import { EntityType } from '.';
import BaseEntity from './BaseEntity';
interface Album extends BaseEntity {
    type: EntityType.Album;
    albumArtist: string | null;
    artists: {
        id: string;
        name: string;
    }[];
    duration: number | null;
    year: number | null;
    genres: {
        id: string;
        name: string;
    }[];
}
export default Album;
//# sourceMappingURL=Album.d.ts.map