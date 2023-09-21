import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import TrackEntity from '../../../../entities/TrackEntity';
export default class TrackRenderer extends BaseRenderer<TrackEntity> {
    renderToListItem(data: TrackEntity, addType?: boolean, fakeAlbum?: boolean, addNonPlayableText?: boolean): RenderedListItem | null;
    renderToHeader(data: TrackEntity): RenderedHeader | null;
}
//# sourceMappingURL=TrackRenderer.d.ts.map