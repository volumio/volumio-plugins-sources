import Endpoint, { EndpointType } from '../types/Endpoint';
import PageContent from '../types/PageContent';
import WatchContent, { WatchContinuationContent } from '../types/WatchContent';
import EndpointModel from './EndpointModel';
export default class PlaylistModel extends EndpointModel {
    #private;
    getContents(endpoint: Endpoint & {
        type: EndpointType.Watch;
    }): Promise<WatchContent | null>;
    getContents(endpoint: Endpoint & {
        type: EndpointType.WatchContinuation;
    }): Promise<WatchContinuationContent | null>;
    getContents(endpoint: Endpoint & {
        type: EndpointType.Browse | EndpointType.Search | EndpointType.BrowseContinuation | EndpointType.SearchContinuation;
    }): Promise<PageContent | null>;
    getContents(endpoint: Endpoint & {
        type: EndpointType;
    }): Promise<WatchContent | PageContent | null>;
}
//# sourceMappingURL=PlaylistModel.d.ts.map