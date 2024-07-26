import { IBrowseResponse, INextResponse, ISearchResponse, YTNodes, Misc as YTMisc, Helpers as YTHelpers, IParsedResponse } from 'volumio-youtubei.js';
import Endpoint, { BrowseContinuationEndpoint, BrowseEndpoint, EndpointOf, EndpointType, SearchEndpoint, WatchEndpoint } from '../types/Endpoint';
import { ContentItem } from '../types';
import { SectionItem } from '../types/PageElement';
import { ContentOf } from '../types/Content';
import { MetadataLyrics } from 'now-playing-common';
type ParseableInnertubeResponse = INextResponse | ISearchResponse | IBrowseResponse | IParsedResponse;
export default class InnertubeResultParser {
    #private;
    static parseResult<T extends Endpoint>(data: ParseableInnertubeResponse | {
        contents: any;
    }, originatingEndpoint: T): ContentOf<T> | null;
    static parseContentItem(data?: YTHelpers.YTNode | null): SectionItem | ContentItem.Automix | null;
    static findRadioEndpoint(data: YTHelpers.YTNode): WatchEndpoint | null;
    static unwrap(data?: 'N/A' | ''): null;
    static unwrap(data?: string | YTMisc.Text): string | null;
    static unwrap(data?: YTHelpers.SuperParsedResult<YTHelpers.YTNode> | null): YTHelpers.ObservedArray<YTHelpers.YTNode> | YTHelpers.YTNode | null;
    static unwrap<T>(data?: T): T | null;
    static parseThumbnail(data?: YTMisc.Thumbnail[], resize?: {
        width: number;
        height: number;
    }): string | null;
    static parseEndpoint(data?: YTNodes.NavigationEndpoint | null): BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | WatchEndpoint | null;
    static parseEndpoint<K extends EndpointType[]>(data?: YTNodes.NavigationEndpoint | null, ...requireTypes: K): EndpointOf<K[number]> | null;
    static parseLyrics(response: IParsedResponse): MetadataLyrics | null;
}
export {};
//# sourceMappingURL=InnertubeResultParser.d.ts.map