import SetEntity from '../../../../entities/SetEntity';
import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
export default abstract class SetRenderer<T extends SetEntity> extends BaseRenderer<T> {
    renderToListItem(data: T, showIcon?: boolean): RenderedListItem | null;
    renderToHeader(data: T): RenderedHeader | null;
    protected abstract getListItemUri(data: T): string;
    protected abstract getListItemAlbum(data: T): string;
}
//# sourceMappingURL=SetRenderer.d.ts.map