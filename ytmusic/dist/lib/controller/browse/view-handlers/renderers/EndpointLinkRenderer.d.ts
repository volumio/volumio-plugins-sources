import { type ContentItem } from '../../../../types';
import BaseRenderer, { type RenderedListItem } from './BaseRenderer';
export default class EndpointLinkRenderer extends BaseRenderer<ContentItem.EndpointLink> {
    #private;
    renderToListItem(data: ContentItem.EndpointLink): RenderedListItem | null;
}
//# sourceMappingURL=EndpointLinkRenderer.d.ts.map