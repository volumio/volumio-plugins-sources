import { type ContentItem, type PageElement } from '../../../../types';
import { type MusicFolderView } from '../MusicFolderViewHandler';
import type View from '../View';
import BaseRenderer, { type RenderedHeader, type RenderedListItem } from './BaseRenderer';
export default abstract class MusicFolderRenderer<T extends ContentItem.MusicFolder, K extends PageElement.MusicFolderHeader> extends BaseRenderer<T, K> {
    renderToListItem(data: T): RenderedListItem | null;
    renderToHeader(data: K): RenderedHeader | null;
    protected abstract getTargetViewForListItem(data: T): MusicFolderView | null;
    protected abstract getTargetViewForHeader(data: K): View | null;
    protected abstract getSubtitleForListItem(data: T): string | null | undefined;
    protected abstract getSubtitleForHeader(data: K): string | null | undefined;
}
//# sourceMappingURL=MusicFolderRenderer.d.ts.map