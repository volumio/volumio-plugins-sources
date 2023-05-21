import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import Song from '../../../../entities/Song';
export default class SongRenderer extends BaseRenderer<Song> {
    renderToListItem(data: Song): RenderedListItem | null;
    renderToHeader(): RenderedHeader | null;
}
//# sourceMappingURL=SongRenderer.d.ts.map