interface VideoPlaybackInfo {
    type: 'video';
    title?: string;
    author: {
        channelId?: string;
        name?: string;
    };
    thumbnail: string;
    isLive?: boolean;
    stream?: VideoStream | null;
    duration?: number;
    addToHistory: () => Promise<any>;
}
interface VideoStream {
    url: string;
    mimeType?: string;
    bitrate?: string | null;
    sampleRate?: string;
    channels?: number;
}
export default VideoPlaybackInfo;
//# sourceMappingURL=VideoPlaybackInfo.d.ts.map