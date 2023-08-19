import TrackEntity from './TrackEntity';
import UserEntity from './UserEntity';

interface SetEntity {
  id?: any;
  title?: string | null;
  description?: string | null;
  thumbnail: string | null;
  permalink?: string | null;
  user: UserEntity | null;
  tracks: TrackEntity[];
  trackCount?: number;
  isLiked?: boolean;
  isPublic?: boolean;
}

export default SetEntity;
