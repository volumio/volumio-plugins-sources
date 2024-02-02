import { UserEntity } from './UserEntity';

export interface PlaylistEntity {
  type: 'playlist';
  id: string;
  name: string;
  description?: string;
  url?: string;
  owner?: UserEntity;
}
