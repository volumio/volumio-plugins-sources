import UserEntity from './UserEntity';

interface TrackEntity {
  type: 'track';
  id?: number;
  urn?: string | null;
  title?: string | null;
  album?: string | null;
  thumbnail: string | null;
  playableState: 'blocked' | 'snipped' | 'allowed';
  duration?: number;
  transcodings: {
    url?: string | null;
    protocol?: string | null;
    mimeType?: string | null;
    quality?: string | null;
  }[];
  user: UserEntity | null;
}

export default TrackEntity;
