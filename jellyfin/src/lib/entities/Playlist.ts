import { EntityType } from '.';
import BaseEntity from './BaseEntity';

interface Playlist extends BaseEntity {
  type: EntityType.Playlist;
}

export default Playlist;
