import Genre from '../../../../entities/Genre';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
export default class GenreRenderer extends BaseRenderer<Genre> {
    renderToListItem(data: Genre): RenderedListItem | null;
    renderToHeader(data: Genre): RenderedHeader | null;
}
//# sourceMappingURL=GenreRenderer.d.ts.map