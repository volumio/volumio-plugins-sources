import BaseRenderer, { type RenderedHeader, type RenderedListItem } from './BaseRenderer';
import type TrackEntity from '../../../../entities/TrackEntity';
export default class TrackRenderer extends BaseRenderer<TrackEntity> {
    renderToListItem(data: TrackEntity, addType?: boolean, fakeAlbum?: boolean, addNonPlayableText?: boolean): RenderedListItem | null;
    renderToHeader(data: TrackEntity): RenderedHeader | null;
}
//# sourceMappingURL=TrackRenderer.d.ts.map