import { type PageContent } from '../../../types/Content';
import type Endpoint from '../../../types/Endpoint';
import GenericViewHandler, { type GenericView } from './GenericViewHandler';
export interface SearchView extends Omit<GenericView, 'name'> {
    name: 'search';
    query: string;
}
export default class SearchViewHandler extends GenericViewHandler<SearchView> {
    #private;
    protected getEndpoint(): Endpoint | null;
    protected getContents(): Promise<PageContent>;
}
//# sourceMappingURL=SearchViewHandler.d.ts.map