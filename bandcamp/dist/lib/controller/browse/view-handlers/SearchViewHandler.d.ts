import { SearchItemType } from '../../../model/SearchModel';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedPage } from './ViewHandler';
export interface SearchView extends View {
    name: 'search';
    query: string;
    combinedSearch?: '1';
    itemType?: SearchItemType;
}
export default class SearchViewHandler extends BaseViewHandler<SearchView> {
    browse(): Promise<RenderedPage>;
}
//# sourceMappingURL=SearchViewHandler.d.ts.map