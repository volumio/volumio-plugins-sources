import View from './View';
import { RenderedPage } from './ViewHandler';
import BaseViewHandler from './BaseViewHandler';
export interface TagView extends View {
    name: 'tags';
    keywords: string;
}
export default class TagViewHandler extends BaseViewHandler<TagView> {
    #private;
    browse(): Promise<RenderedPage>;
}
//# sourceMappingURL=TagViewHandler.d.ts.map