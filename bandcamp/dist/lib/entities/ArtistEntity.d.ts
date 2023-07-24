import BandEntity from './BandEntity';
import LabelEntity from './LabelEntity';
interface ArtistEntity extends BandEntity {
    type: 'artist';
    label?: LabelEntity;
}
export default ArtistEntity;
//# sourceMappingURL=ArtistEntity.d.ts.map