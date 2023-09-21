import { EntityType } from '.';
import BaseEntity from './BaseEntity';
interface Artist extends BaseEntity {
    type: EntityType.Artist | EntityType.AlbumArtist;
    genres: {
        id: string;
        name: string;
    }[];
}
export default Artist;
//# sourceMappingURL=Artist.d.ts.map