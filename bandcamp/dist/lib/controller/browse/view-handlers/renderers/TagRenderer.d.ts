import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import TagEntity from '../../../../entities/TagEntity';
export interface TagListSelectionRenderParams {
    selected: boolean;
    uri: string;
}
export default class TagRenderer extends BaseRenderer<TagEntity> {
    renderToListItem(data: TagEntity, listSelectionParams: TagListSelectionRenderParams): RenderedListItem | null;
    renderGenreListItem(data: TagEntity): RenderedListItem | null;
    renderToHeader(data: TagEntity): RenderedHeader | null;
}
//# sourceMappingURL=TagRenderer.d.ts.map