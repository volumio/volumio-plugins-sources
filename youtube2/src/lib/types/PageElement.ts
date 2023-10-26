import { ContentItem } from '.';
import { BrowseContinuationEndpoint, BrowseEndpoint, EndpointOf, EndpointType, SearchContinuationEndpoint, SearchEndpoint, WatchEndpoint } from './Endpoint';

export interface Header {
  type: 'feed' | 'channel' | 'playlist' | 'search';
  title: string;
  subtitles?: string[];
  description?: string;
  thumbnail?: string;
  endpoint?: BrowseEndpoint | WatchEndpoint;
}

export interface PlaylistHeader extends Header {
  type: 'playlist';
  author?: ContentItem.Author;
  shufflePlay?: ContentItem.EndpointLink;
}

export type SectionItem = ContentItem.Channel | ContentItem.EndpointLink | ContentItem.GuideEntry | ContentItem.Playlist | ContentItem.Video | Section;

export interface Section {
  type: 'section';
  title?: string;
  subtitle?: string;
  items: SectionItem[];
  filters?: Option[];
  continuation?: Continuation<EndpointType.BrowseContinuation | EndpointType.SearchContinuation>;
  menus?: Option[];
  buttons?: Button[];
  endpoint?: BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint;
}

export interface Option {
  type: 'option';
  title?: string,
  optionValues: {
    text: string;
    endpoint: BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | null;
    selected: boolean
  }[];
}

export interface Continuation<T extends EndpointType.BrowseContinuation | EndpointType.SearchContinuation | EndpointType.WatchContinuation> {
  type: 'continuation';
  text?: string;
  endpoint: EndpointOf<T>;
}

export interface Button {
  type: 'button';
  text: string;
  endpoint: BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | WatchEndpoint;
}

export interface Tab {
  type: 'tab';
  text: string;
  endpoint: BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint;
  selected: boolean;
}
