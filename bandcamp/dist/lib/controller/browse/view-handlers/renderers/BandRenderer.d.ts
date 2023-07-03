import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import LabelEntity from '../../../../entities/LabelEntity';
import ArtistEntity from '../../../../entities/ArtistEntity';
import BandEntity from '../../../../entities/BandEntity';
export default class BandRenderer extends BaseRenderer<ArtistEntity | LabelEntity> {
    renderToListItem(data: ArtistEntity | LabelEntity | BandEntity): RenderedListItem | null;
    renderToHeader(data: ArtistEntity | LabelEntity): RenderedHeader | null;
}
//# sourceMappingURL=BandRenderer.d.ts.map