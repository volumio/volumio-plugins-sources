export interface SearchQuery {
    value: string;
}
export default class SearchController {
    search(query: SearchQuery): Promise<import("../browse/view-handlers/ViewHandler").RenderedList[]>;
}
//# sourceMappingURL=SearchController.d.ts.map