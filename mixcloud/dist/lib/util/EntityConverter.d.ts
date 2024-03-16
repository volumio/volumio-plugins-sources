import { Category, Cloudcast, LiveStream, Playlist, Tag, User } from 'mixcloud-fetch';
import { UserEntity } from '../entities/UserEntity.js';
import { CloudcastEntity } from '../entities/CloudcastEntity.js';
import { PlaylistEntity } from '../entities/PlaylistEntity.js';
import { SlugEntity } from '../entities/SlugEntity.js';
import { LiveStreamEntity } from '../entities/LiveStreamEntity.js';
export default class EntityConverter {
    static convertCloudcast(data: Cloudcast): CloudcastEntity;
    static convertUser(data: User): UserEntity;
    static convertPlaylist(data: Playlist): PlaylistEntity;
    static convertSlugLike(data: Category | Tag): SlugEntity;
    static convertLiveStream(data: LiveStream): LiveStreamEntity;
}
//# sourceMappingURL=EntityConverter.d.ts.map