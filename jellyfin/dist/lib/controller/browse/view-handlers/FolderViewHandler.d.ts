import FilterableViewHandler, { FilterableViewConfig } from './FilterableViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface FolderView extends View {
    name: 'folder';
    parentId: string;
}
export default class FolderViewHandler extends FilterableViewHandler<FolderView> {
    browse(): Promise<RenderedPage>;
    protected getFilterableViewConfig(): FilterableViewConfig;
}
//# sourceMappingURL=FolderViewHandler.d.ts.map