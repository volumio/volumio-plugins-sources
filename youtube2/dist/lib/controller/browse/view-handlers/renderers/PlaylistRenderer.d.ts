import { ContentItem, PageElement } from '../../../../types';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
export default class PlaylistRenderer extends BaseRenderer<ContentItem.Playlist, PageElement.PlaylistHeader> {
    renderToListItem(data: ContentItem.Playlist): RenderedListItem | null;
    renderToHeader(data: PageElement.PlaylistHeader): RenderedHeader | null;
}
//# sourceMappingURL=PlaylistRenderer.d.ts.map