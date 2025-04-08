import { type ContentItem, type PageElement } from '../../../../types';
import BaseRenderer, { type RenderedHeader, type RenderedListItem } from './BaseRenderer';
export default class ChannelRenderer extends BaseRenderer<ContentItem.Channel, PageElement.Header> {
    renderToListItem(data: ContentItem.Channel): RenderedListItem | null;
    renderToHeader(data: PageElement.Header): RenderedHeader | null;
}
//# sourceMappingURL=ChannelRenderer.d.ts.map