import { UserEntity } from './UserEntity.js';
export interface LiveStreamEntity {
    type: 'liveStream';
    id: string;
    name: string;
    description?: string;
    status: string;
    isLive: boolean;
    owner?: UserEntity;
    thumbnail?: string;
    streams?: {
        hls?: string;
    };
}
//# sourceMappingURL=LiveStreamEntity.d.ts.map