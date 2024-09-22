import Artist from '../../../../entities/Artist';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
export default class ArtistRenderer extends BaseRenderer<Artist> {
    renderToListItem(data: Artist, options?: {
        noParent: boolean;
    }): RenderedListItem | null;
    renderToHeader(data: Artist): RenderedHeader | null;
}
//# sourceMappingURL=ArtistRenderer.d.ts.map