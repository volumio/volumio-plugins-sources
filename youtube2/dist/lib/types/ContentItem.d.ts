import { BrowseContinuationEndpoint, BrowseEndpoint, SearchContinuationEndpoint, SearchEndpoint, WatchEndpoint } from './Endpoint';
export interface Video {
    type: 'video';
    videoId: string;
    title: string;
    author?: Author;
    thumbnail?: string;
    viewCount?: string;
    published?: string;
    duration?: number;
    endpoint: WatchEndpoint;
}
export interface Playlist {
    type: 'playlist';
    playlistId?: string;
    title: string;
    author?: Author;
    thumbnail?: string;
    videoCount?: string;
    endpoint?: WatchEndpoint;
    browseEndpoint?: BrowseEndpoint;
    items?: Video[];
    currentIndex?: number;
    isMix?: boolean;
}
export interface EndpointLink {
    type: 'endpointLink';
    title: string;
    thumbnail?: string;
    icon?: string;
    endpoint: BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | WatchEndpoint;
}
export interface Channel {
    type: 'channel';
    name: string;
    channelId?: string;
    thumbnail?: string;
    subscribers?: string;
    endpoint: BrowseEndpoint;
}
export interface GuideEntry {
    type: 'guideEntry';
    title: string;
    thumbnail?: string;
    icon?: string;
    endpoint: BrowseEndpoint;
    isPrimary: boolean;
}
export interface Author {
    channelId?: string;
    name: string;
    thumbnail?: string | null;
    endpoint?: BrowseEndpoint | null;
}
//# sourceMappingURL=ContentItem.d.ts.map