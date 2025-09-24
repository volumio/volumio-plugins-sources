import EventEmitter from 'events';
import { type Logger, type Video } from 'yt-cast-receiver';
import type VideoLoader from './VideoLoader';
export default class VideoPrefetcher extends EventEmitter {
    #private;
    constructor(videoLoader: VideoLoader, logger: Logger);
    startPrefetchOnTimeout(video: Video, seconds: number): void;
    abortPrefetch(): void;
    isPrefetching(): boolean;
    isPending(): boolean;
    getCurrentTarget(): Video | null;
}
//# sourceMappingURL=VideoPrefetcher.d.ts.map