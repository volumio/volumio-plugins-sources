import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import { PlaylistEntity } from '../../../../entities/PlaylistEntity';
export default class PlaylistRenderer extends BaseRenderer<PlaylistEntity> {
    renderToListItem(playlist: PlaylistEntity): RenderedListItem | null;
    renderToHeader(playlist: PlaylistEntity): RenderedHeader | null;
}
//# sourceMappingURL=PlaylistRenderer.d.ts.map