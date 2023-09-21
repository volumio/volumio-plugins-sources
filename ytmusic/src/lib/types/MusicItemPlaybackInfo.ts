import { WatchEndpoint } from './Endpoint';

interface MusicItemPlaybackInfo {
  title?: string;
  artist: {
    channelId?: string;
    name?: string;
  };
  album: {
    albumId?: string;
    title?: string;
  }
  thumbnail?: string;
  stream?: MusicItemStream | null;
  duration?: number;
  addToHistory: () => Promise<any>;
  radioEndpoint?: WatchEndpoint;
}

interface MusicItemStream {
  url: string;
  mimeType?: string;
  bitrate?: string | null;
  sampleRate?: string;
  channels?: number;
}

export default MusicItemPlaybackInfo;
