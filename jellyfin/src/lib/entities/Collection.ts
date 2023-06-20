import { EntityType } from '.';
import BaseEntity from './BaseEntity';

interface Collection extends BaseEntity {
  type: EntityType.Collection;
  year: number | null;
}

export default Collection;
