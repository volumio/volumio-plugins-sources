import type BandEntity from './BandEntity';
import type LabelEntity from './LabelEntity';

interface ArtistEntity extends BandEntity {
  type: 'artist';
  label?: LabelEntity;
}

export default ArtistEntity;
