import TrackEntity from './TrackEntity';

interface ShowEntity {
  type: 'show';
  url: string;
  name: string;
  thumbnail?: string;
  description: string;
  date: string;
  streamUrl?: string;
  duration?: number;
  tracks?: TrackEntity[];
}

export default ShowEntity;
