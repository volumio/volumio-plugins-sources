import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface FilterSelectionView extends View {
    name: 'filter.az' | 'filter.filter' | 'filter.genre' | 'filter.sort' | 'filter.year';
    filterView: string;
}
export default class FilterSelectionViewHandler extends BaseViewHandler<FilterSelectionView> {
    #private;
    browse(): Promise<RenderedPage>;
    constructPrevUri(): string;
}
//# sourceMappingURL=FilterSelectionViewHandler.d.ts.map