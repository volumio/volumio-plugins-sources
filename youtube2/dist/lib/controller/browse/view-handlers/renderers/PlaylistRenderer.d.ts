import { type ContentItem, type PageElement } from '../../../../types';
import BaseRenderer, { type RenderedHeader, type RenderedListItem } from './BaseRenderer';
export default class PlaylistRenderer extends BaseRenderer<ContentItem.Playlist, PageElement.PlaylistHeader> {
    renderToListItem(data: ContentItem.Playlist): RenderedListItem | null;
    renderToHeader(data: PageElement.PlaylistHeader): RenderedHeader | null;
}
//# sourceMappingURL=PlaylistRenderer.d.ts.map