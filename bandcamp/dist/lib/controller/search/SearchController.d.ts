import { RenderedList } from '../browse/view-handlers/ViewHandler';
export interface SearchQuery {
    value: string;
}
export default class SearchController {
    search(query: SearchQuery): Promise<RenderedList[]>;
}
//# sourceMappingURL=SearchController.d.ts.map