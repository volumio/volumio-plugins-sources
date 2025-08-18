import BaseRenderer, { type RenderedHeader, type RenderedListItem } from './BaseRenderer';
import type LabelEntity from '../../../../entities/LabelEntity';
import type ArtistEntity from '../../../../entities/ArtistEntity';
import type BandEntity from '../../../../entities/BandEntity';
export default class BandRenderer extends BaseRenderer<ArtistEntity | LabelEntity> {
    renderToListItem(data: ArtistEntity | LabelEntity | BandEntity): RenderedListItem | null;
    renderToHeader(data: ArtistEntity | LabelEntity): RenderedHeader | null;
}
//# sourceMappingURL=BandRenderer.d.ts.map