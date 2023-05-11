import { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models';
import { EntityType } from '.';
import BaseEntity from './BaseEntity';
interface Song extends BaseEntity {
    type: EntityType.Song;
    artists: {
        id: string;
        name: string;
    }[];
    album: {
        id: string;
        name: string;
        thumbnail: string | null;
    } | null;
    duration: number;
    mediaSources?: MediaSourceInfo[];
    favorite: boolean;
}
export default Song;
//# sourceMappingURL=Song.d.ts.map