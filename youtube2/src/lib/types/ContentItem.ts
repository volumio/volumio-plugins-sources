import Endpoint from './Endpoint';

export interface Video {
  type: 'video';
  videoId: string;
  title: string;
  author: Author;
  thumbnail: string;
  viewCount: string;
  published: string;
  duration: number;
  endpoint: Endpoint;
}

export interface Playlist {
  type: 'playlist';
  playlistId: string;
  title: string;
  author?: Author;
  thumbnail?: string;
  videoCount?: string;
  endpoint?: Endpoint;
  browseEndpoint?: Endpoint;
  items?: Video[];
  currentIndex?: number;
  isMix?: boolean;
}

export interface EndpointLink {
  type: 'endpointLink';
  title: string;
  thumbnail?: string;
  icon?: string;
  endpoint: Endpoint;
}

export interface Channel {
  type: 'channel';
  name: string;
  channelId: string;
  thumbnail: string;
  subscribers: string;
  endpoint: Endpoint;
}

export interface GuideEntry {
  type: 'guideEntry';
  title: string;
  thumbnail: string;
  icon: string;
  endpoint: Endpoint;
  isPrimary: boolean;
}

export interface Author {
  channelId?: string;
  name: string;
  thumbnail?: string | null;
  endpoint?: Endpoint | null;
}
