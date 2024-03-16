import BaseRenderer, { RenderedListItem } from './BaseRenderer';
import { LiveStreamEntity } from '../../../../entities/LiveStreamEntity';
export default class LiveStreamRenderer extends BaseRenderer<LiveStreamEntity> {
    renderToListItem(liveStream: LiveStreamEntity, asType?: 'folder' | 'playLiveStreamItem'): RenderedListItem | null;
}
//# sourceMappingURL=LiveStreamRenderer.d.ts.map