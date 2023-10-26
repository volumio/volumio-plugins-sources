import AutoplayContext from './AutoplayContext';
import { BrowseContinuationEndpoint, BrowseEndpoint, SearchContinuationEndpoint, SearchEndpoint, WatchEndpoint } from './Endpoint';
export interface MusicItem {
    type: 'video' | 'song';
    videoId: string;
    title: string;
    subtitle?: string;
    trackNumber?: string;
    artists?: Channel[];
    artistText?: string;
    album?: {
        albumId?: string;
        title: string;
        endpoint?: BrowseEndpoint;
        year?: string;
    };
    thumbnail?: string;
    duration?: number;
    endpoint: WatchEndpoint;
    radioEndpoint?: WatchEndpoint;
    autoplayContext?: AutoplayContext;
}
export interface MusicFolder {
    title: string;
    subtitle?: string;
    thumbnail?: string;
    songCount?: string;
    totalDuration?: number;
    endpoint: WatchEndpoint;
    browseEndpoint: BrowseEndpoint;
}
export interface Album extends MusicFolder {
    type: 'album';
    albumId: string;
    artists: Channel[];
    artistText: string;
    year?: string;
}
export interface Playlist extends MusicFolder {
    type: 'playlist';
    playlistId: string;
    author?: Channel;
    authorText?: string;
    items?: MusicItem[];
}
export interface EndpointLink {
    type: 'endpointLink';
    title: string;
    subtitle?: string;
    thumbnail?: string;
    icon?: string;
    endpoint: BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | WatchEndpoint;
}
export interface Channel {
    type: 'channel';
    name: string;
    subtitle?: string;
    channelId?: string;
    thumbnail?: string;
    endpoint?: BrowseEndpoint | null;
}
export interface Automix {
    type: 'automix';
    endpoint: WatchEndpoint;
}
//# sourceMappingURL=ContentItem.d.ts.map