import { EntityType } from '.';

interface BaseEntity {
  type: EntityType;
  id: string;
  name: string;
  thumbnail: string | null;
}

export default BaseEntity;
