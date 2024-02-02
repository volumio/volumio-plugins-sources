/**
 * Mixcloud live streams cannot be handled directly by FFmpeg,
 * at least with the version that came with Volumio:
 * - Live streams are HLS-fMP4 instead of HLS-TS which you get for regular shows.
 * - FFmpeg doesn't handle HLS-fMP4 playlists well and invariably returns
 *   'invalid data' errors beyond the first MP4 fragment. The errors seem to
 *   arise when processing video data contained in the fragments.
 *
 * Instead of passing the live stream URL directly to FFmpeg (through MPD),
 * we use a proxy mechanism:
 * - Use Streamlink (https://github.com/streamlink/streamlink) to handle the
 *   HLS-fMP4 playlist and read the MP4 fragments.
 * - Pipe the stream data produced by Streamlink to an FFmpeg process, where we:
 *   1. Extract audio from the stream data
 *   2. Convert the audio-only stream to MPEG-TS format
 *   3. Set the FFmpeg instance to listener mode with a 'proxy stream URL'.
 *
 * The 'proxy stream URL' will thus return an MPEG-TS audio stream that can be
 * handled correctly by MPD. With FFmpeg (the instance created by the proxy) set
 * in listener mode, the Streamlink + audio extraction / conversion process starts
 * when the proxy stream URL is connected to.
 *
 * Note that this process has been tested to work with MPD + FFmpeg on Volumio.
 * There is no guarantee that it will work elsewhere. In fact, preliminary testing
 * with FFmpeg 6 fails - but that doesn't concern us for now.
 */
export default class LiveStreamProxy {
    #private;
    constructor(liveStreamHLSUrl: string);
    start(): Promise<string>;
    /**
     * Normally you don't have to call this, because streamlink and ffmpeg processes created by
     * the proxy end automatically when the stream playback ends or the connection to the proxy
     * stream URL disconnects (such as when MPD switches to a different song).
     * On the other hand, if MPD fails to connect to the proxy stream URL, then we would have to
     * kill the proxy manually.
     *
     * @returns
     */
    kill(): Promise<void>;
}
//# sourceMappingURL=LiveStreamProxy.d.ts.map