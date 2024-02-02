import { IBrowseResponse, INextResponse, ISearchResponse, YTNodes, Misc as YTMisc, Helpers as YTHelpers } from 'volumio-youtubei.js';
import Endpoint, { BrowseContinuationEndpoint, BrowseEndpoint, EndpointOf, EndpointType, SearchContinuationEndpoint, SearchEndpoint, WatchContinuationEndpoint, WatchEndpoint } from '../types/Endpoint';
import { ContentOf } from '../types/Content';
type ParseableInnertubeResponse = INextResponse | ISearchResponse | IBrowseResponse;
export default class InnertubeResultParser {
    #private;
    static parseResult(data: ParseableInnertubeResponse | {
        contents: any;
    }): ContentOf<BrowseEndpoint> | null;
    static parseResult<T extends Endpoint>(data: ParseableInnertubeResponse | {
        contents: any;
    }, originatingEndpoint: T): ContentOf<T> | null;
    static unwrap(data?: string | YTMisc.Text): string | null;
    static unwrap(data?: YTHelpers.SuperParsedResult<YTHelpers.YTNode> | null): YTHelpers.ObservedArray<YTHelpers.YTNode> | YTHelpers.YTNode | null;
    static unwrap<T>(data?: T): T | null;
    static parseThumbnail(data?: YTMisc.Thumbnail[]): string | null;
    static parseEndpoint(data?: YTNodes.NavigationEndpoint | null): BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | WatchEndpoint | WatchContinuationEndpoint | null;
    static parseEndpoint<K extends EndpointType[]>(data?: YTNodes.NavigationEndpoint | null, ...requireTypes: K): EndpointOf<K[number]> | null;
}
export {};
//# sourceMappingURL=InnertubeResultParser.d.ts.map