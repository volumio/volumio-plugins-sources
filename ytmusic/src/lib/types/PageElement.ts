import { ContentItem } from '.';
import { BrowseContinuationEndpoint, BrowseEndpoint, SearchContinuationEndpoint, SearchEndpoint, WatchContinuationEndpoint, WatchEndpoint } from './Endpoint';

export interface Header {
  type: 'album' | 'playlist' | 'channel' | 'search' | 'generic';
  title: string;
  subtitles?: string[];
  description?: string;
  thumbnail?: string;
  endpoint?: WatchEndpoint;
}

export type MusicFolderHeader = Header;

export interface AlbumHeader extends MusicFolderHeader {
  type: 'album';
  artist?: ContentItem.Channel;
}

export interface PlaylistHeader extends MusicFolderHeader {
  type: 'playlist';
  author?: ContentItem.Channel;
  shufflePlay?: ContentItem.EndpointLink & { endpoint: WatchEndpoint };
}

export type SectionItem = ContentItem.Album |
                          ContentItem.Channel |
                          ContentItem.EndpointLink |
                          ContentItem.MusicItem |
                          ContentItem.Playlist |
                          Section;

export interface Section {
  type: 'section';
  title?: string;
  subtitle?: string;
  items: SectionItem[];
  itemLayout?: 'grid' | 'list';
  filters?: Option[];
  continuation?: Continuation & { endpoint: BrowseContinuationEndpoint | SearchContinuationEndpoint };
  buttons?: Button[];
  playlistId?: string; // MusicPlaylistShelf
}

export interface Option {
  type: 'option';
  subtype: 'tab' | 'sortFilter' | 'dropdown' | 'chipCloud'
  title?: string,
  optionValues: {
    text: string;
    endpoint: BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint |
    SearchContinuationEndpoint | null;
    selected: boolean;
    isReset?: boolean; // For 'chipCloud' subtype
  }[];
}

export interface Continuation {
  type: 'continuation';
  text?: string;
  endpoint: BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint |
  SearchContinuationEndpoint | WatchContinuationEndpoint;
}

export interface Button {
  type: 'button';
  text: string;
  endpoint: BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint |
  SearchContinuationEndpoint | WatchEndpoint;
  placement?: 'top' | 'bottom';
}

export interface Tab {
  type: 'tab';
  text: string;
  endpoint: BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint |
  SearchContinuationEndpoint;
  selected: boolean;
}
