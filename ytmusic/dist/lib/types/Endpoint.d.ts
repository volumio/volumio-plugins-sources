export declare enum EndpointType {
    Browse = "browse",
    Watch = "watch",
    Search = "search",
    BrowseContinuation = "browseContinuation",
    WatchContinuation = "watchContinuation",
    SearchContinuation = "searchContinuation"
}
export type EndpointOf<T extends EndpointType> = T extends EndpointType.Browse ? BrowseEndpoint : T extends EndpointType.BrowseContinuation ? BrowseContinuationEndpoint : T extends EndpointType.Search ? SearchEndpoint : T extends EndpointType.SearchContinuation ? SearchContinuationEndpoint : T extends EndpointType.Watch ? WatchEndpoint : T extends EndpointType.WatchContinuation ? WatchContinuationEndpoint : null;
interface Endpoint {
    type: EndpointType.Browse | EndpointType.BrowseContinuation | EndpointType.Search | EndpointType.SearchContinuation | EndpointType.Watch | EndpointType.WatchContinuation;
    payload: Record<string, any>;
}
export interface BrowseEndpoint extends Endpoint {
    type: EndpointType.Browse;
    pageType?: string;
    payload: {
        browseId: string;
        params?: string;
        formData?: any;
    };
}
export interface BrowseContinuationEndpoint {
    type: EndpointType.BrowseContinuation;
    isReloadContinuation?: boolean;
    payload: {
        token: string;
    };
}
export interface WatchEndpoint extends Endpoint {
    type: EndpointType.Watch;
    musicVideoType?: string;
    payload: {
        playlistId: string;
        params?: string;
        videoId?: string;
        index?: number;
        playlistSetVideoId?: string;
    };
}
export interface WatchContinuationEndpoint {
    type: EndpointType.WatchContinuation;
    payload: {
        token: string;
        playlistId: string;
        params?: string;
        videoId?: string;
        index?: number;
        playlistSetVideoId?: string;
    };
}
export interface SearchEndpoint extends Endpoint {
    type: EndpointType.Search;
    payload: {
        query: string;
        params?: string;
    };
}
export interface SearchContinuationEndpoint extends Endpoint {
    type: EndpointType.SearchContinuation;
    payload: {
        token: string;
    };
}
export default Endpoint;
//# sourceMappingURL=Endpoint.d.ts.map