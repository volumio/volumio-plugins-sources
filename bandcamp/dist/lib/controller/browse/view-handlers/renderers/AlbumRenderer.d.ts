import BaseRenderer, { type RenderedHeader, type RenderedListItem } from './BaseRenderer';
import type AlbumEntity from '../../../../entities/AlbumEntity';
export default class AlbumRenderer extends BaseRenderer<AlbumEntity> {
    renderToListItem(data: AlbumEntity): RenderedListItem | null;
    renderToHeader(data: AlbumEntity): RenderedHeader | null;
}
//# sourceMappingURL=AlbumRenderer.d.ts.map