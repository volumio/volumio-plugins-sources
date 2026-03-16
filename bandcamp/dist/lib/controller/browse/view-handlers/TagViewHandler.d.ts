import type View from './View';
import { type RenderedPage } from './ViewHandler';
import BaseViewHandler from './BaseViewHandler';
export interface TagView extends View {
    name: 'tag';
    tagUrl: string;
    select?: string;
}
export default class TagViewHandler extends BaseViewHandler<TagView> {
    #private;
    browse(): Promise<RenderedPage>;
}
//# sourceMappingURL=TagViewHandler.d.ts.map