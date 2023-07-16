import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import Playlist from '../../../../entities/Playlist';
export default class PlaylistRenderer extends BaseRenderer<Playlist> {
    renderToListItem(data: Playlist): RenderedListItem | null;
    renderToHeader(data: Playlist): RenderedHeader | null;
}
//# sourceMappingURL=PlaylistRenderer.d.ts.map