import { IBrowseResponse, INextResponse, ISearchResponse, YTNodes, Misc as YTMisc, Helpers as YTHelpers } from 'volumio-youtubei.js';
import Endpoint, { EndpointType } from '../types/Endpoint';
import WatchContent, { WatchContinuationContent } from '../types/WatchContent';
import PageContent from '../types/PageContent';
type ParseableInnertubeResponse = INextResponse | ISearchResponse | IBrowseResponse;
export default class InnertubeResultParser {
    #private;
    static parseResult(data: ParseableInnertubeResponse | {
        contents: any;
    }, originatingEndpointType?: EndpointType.Browse | EndpointType.BrowseContinuation | EndpointType.Search | EndpointType.SearchContinuation): PageContent | null;
    static parseResult(data: ParseableInnertubeResponse | {
        contents: any;
    }, originatingEndpointType: EndpointType.Watch): WatchContent | null;
    static parseResult(data: ParseableInnertubeResponse | {
        contents: any;
    }, originatingEndpointType: EndpointType.WatchContinuation): WatchContinuationContent | null;
    static parseResult(data: ParseableInnertubeResponse | {
        contents: any;
    }, originatingEndpointType?: EndpointType): PageContent | WatchContent | WatchContinuationContent | null;
    static unwrap(data?: string | YTMisc.Text): string;
    static unwrap(data?: YTHelpers.SuperParsedResult<YTHelpers.YTNode> | null): YTHelpers.ObservedArray<YTHelpers.YTNode> | YTHelpers.YTNode | null;
    static unwrap<T>(data?: T): T | null;
    static parseThumbnail(data?: YTMisc.Thumbnail[]): string | null;
    static parseEndpoint(data?: YTNodes.NavigationEndpoint | null): Endpoint | null;
}
export {};
//# sourceMappingURL=InnertubeResultParser.d.ts.map