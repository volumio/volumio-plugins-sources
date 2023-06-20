import Endpoint from '../../../types/Endpoint';
import PageContent from '../../../types/PageContent';
import GenericViewHandler, { GenericView } from './GenericViewHandler';
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