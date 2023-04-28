import { Logger, Video } from 'yt-cast-receiver';
import { AbortSignal } from 'abort-controller';
interface BasicInfo {
    id: string;
    src?: 'yt' | 'ytmusic';
    title?: string;
    channel?: string;
    artist?: string;
    album?: string;
}
export interface VideoInfo extends BasicInfo {
    errMsg?: string;
    thumbnail?: string;
    isLive?: boolean;
    streamUrl?: string | null;
    bitrate?: string;
    samplerate?: number;
    channels?: number;
}
export default class VideoLoader {
    #private;
    constructor(logger: Logger);
    refreshI18nConfig(): void;
    getInfo(video: Video, abortSignal: AbortSignal): Promise<VideoInfo>;
}
export {};
//# sourceMappingURL=VideoLoader.d.ts.map