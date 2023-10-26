import Album from '../../../../entities/Album';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
export default class AlbumRenderer extends BaseRenderer<Album> {
    renderToListItem(data: Album): RenderedListItem | null;
    renderToHeader(data: Album): RenderedHeader | null;
}
//# sourceMappingURL=AlbumRenderer.d.ts.map