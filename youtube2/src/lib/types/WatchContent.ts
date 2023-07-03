import { ContentItem, PageElement } from '.';
import Endpoint, { EndpointType } from './Endpoint';

interface WatchContent {
  type: 'watch';
  isContinuation: false;
  playlist?: ContentItem.Playlist;
  autoplay?: Endpoint;
  related?: {
    items: (ContentItem.Video | ContentItem.Playlist)[];
    continuation?: PageElement.Continuation<EndpointType.WatchContinuation>;
  };
}

export interface WatchContinuationContent {
  type: 'watch',
  isContinuation: true;
  items: (ContentItem.Video | ContentItem.Playlist)[];
  continuation?: PageElement.Continuation<EndpointType.WatchContinuation>;
}

export default WatchContent;
