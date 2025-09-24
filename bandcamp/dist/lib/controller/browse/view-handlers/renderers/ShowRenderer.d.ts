import BaseRenderer, { type RenderedHeader, type RenderedListItem } from './BaseRenderer';
import type ShowEntity from '../../../../entities/ShowEntity';
export default class ShowRenderer extends BaseRenderer<ShowEntity> {
    renderToListItem(data: ShowEntity, playOnClick?: boolean): RenderedListItem | null;
    renderToHeader(data: ShowEntity): RenderedHeader | null;
}
//# sourceMappingURL=ShowRenderer.d.ts.map