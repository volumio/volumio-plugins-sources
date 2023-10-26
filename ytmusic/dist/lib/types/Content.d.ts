import { ContentItem, PageElement } from '.';
import { BrowseContinuationEndpoint, BrowseEndpoint, SearchContinuationEndpoint, SearchEndpoint, WatchContinuationEndpoint, WatchEndpoint } from './Endpoint';
export type ContentOf<T> = T extends BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint ? PageContent : T extends WatchEndpoint ? WatchContent : T extends WatchContinuationEndpoint ? WatchContinuationContent : never;
export interface PageContent {
    type: 'page';
    isContinuation: boolean;
    isReload: boolean;
    header?: PageElement.Header;
    sections: PageElement.Section[];
    tabs?: PageElement.Tab[];
}
export interface WatchContent {
    type: 'watch';
    isContinuation: false;
    playlist?: Omit<ContentItem.Playlist, 'endpoint' | 'browseEndpoint'>;
    automix?: ContentItem.Automix;
    continuation?: PageElement.Continuation & {
        endpoint: WatchContinuationEndpoint;
    };
}
export interface WatchContinuationContent {
    type: 'watch';
    isContinuation: true;
    items: (ContentItem.MusicItem)[];
    continuation?: PageElement.Continuation & {
        endpoint: WatchContinuationEndpoint;
    };
}
//# sourceMappingURL=Content.d.ts.map