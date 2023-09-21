import AlbumEntity from './AlbumEntity';
import ArtistEntity from './ArtistEntity';

interface TrackEntity {
  type: 'track';
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
