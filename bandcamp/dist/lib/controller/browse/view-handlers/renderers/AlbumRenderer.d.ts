import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import AlbumEntity from '../../../../entities/AlbumEntity';
export default class AlbumRenderer extends BaseRenderer<AlbumEntity> {
    renderToListItem(data: AlbumEntity): RenderedListItem | null;
    renderToHeader(data: AlbumEntity): RenderedHeader | null;
}
//# sourceMappingURL=AlbumRenderer.d.ts.map