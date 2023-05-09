import { EntityType } from '.';
import BaseEntity from './BaseEntity';

interface Album extends BaseEntity {
  type: EntityType.Album;
  artist: string | null;
  duration: number | null;
  year: number | null;
  genres: {
    id: string,
    name: string
  }[];
}

export default Album;
