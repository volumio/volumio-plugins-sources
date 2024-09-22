import EndpointModel from './EndpointModel';
export default class SearchModel extends EndpointModel {
    getSearchResultsByQuery(query: string): Promise<import("../types/Content").PageContent | null>;
}
//# sourceMappingURL=SearchModel.d.ts.map