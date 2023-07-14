import { BaseModel } from './BaseModel';
import Endpoint, { EndpointType } from '../types/Endpoint';
import WatchContent, { WatchContinuationContent } from '../types/WatchContent';
import PageContent from '../types/PageContent';
export default class EndpointModel extends BaseModel {
    getContents(endpoint: Endpoint & {
        type: EndpointType.Watch;
    }): Promise<WatchContent | null>;
    getContents(endpoint: Endpoint & {
        type: EndpointType.WatchContinuation;
    }): Promise<WatchContinuationContent | null>;
    getContents(endpoint: Endpoint & {
        type: EndpointType.Browse | EndpointType.BrowseContinuation | EndpointType.Search | EndpointType.SearchContinuation;
    }): Promise<PageContent | null>;
    getContents(endpoint: Endpoint & {
        type: EndpointType;
    }): Promise<PageContent | WatchContent | null>;
}
//# sourceMappingURL=EndpointModel.d.ts.map