import { RenderedList } from '../browse/view-handlers/ViewHandler';
export interface SearchQuery {
    value: string;
}
export default class SearchController {
    #private;
    search(query: SearchQuery): Promise<RenderedList[]>;
    addIcon(s: string): string;
}
//# sourceMappingURL=SearchController.d.ts.map