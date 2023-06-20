import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface CollectionsView extends View {
    name: 'collections';
}
export default class CollectionsViewHandler extends BaseViewHandler<CollectionsView> {
    browse(): Promise<RenderedPage>;
}
//# sourceMappingURL=CollectionsViewHandler.d.ts.map