import { type ContentItem } from '../../../../types';
import BaseRenderer, { type RenderedListItem } from './BaseRenderer';
export default class VideoRenderer extends BaseRenderer<ContentItem.Video> {
    renderToListItem(data: ContentItem.Video): RenderedListItem | null;
}
//# sourceMappingURL=VideoRenderer.d.ts.map