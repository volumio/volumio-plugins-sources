import { type IBrowseResponse, type INextResponse, type ISearchResponse, YTNodes, Misc as YTMisc, type Helpers as YTHelpers, type IParsedResponse } from 'volumio-youtubei.js';
import { type BrowseContinuationEndpoint, type BrowseEndpoint, type EndpointOf, type SearchEndpoint, type WatchEndpoint } from '../types/Endpoint';
import type Endpoint from '../types/Endpoint';
import { EndpointType } from '../types/Endpoint';
import { type ContentItem } from '../types';
import { type SectionItem } from '../types/PageElement';
import { type ContentOf } from '../types/Content';
import { type MetadataLyrics } from 'now-playing-common';
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