import TrackEntity from '../../../../entities/TrackEntity';
import { TrackOrigin } from '../TrackViewHandler';
import BaseRenderer, { RenderedListItem } from './BaseRenderer';
export default class TrackRenderer extends BaseRenderer<TrackEntity> {
    renderToListItem(data: TrackEntity, origin?: TrackOrigin | null): RenderedListItem | null;
}
//# sourceMappingURL=TrackRenderer.d.ts.map