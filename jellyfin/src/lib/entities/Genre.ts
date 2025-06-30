import { EntityType } from '.';
import BaseEntity from './BaseEntity';

interface Genre extends BaseEntity {
  type: EntityType.Genre;
}

export default Genre;
