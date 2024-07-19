import { Player, PlayerState, Video, Volume } from 'yt-cast-receiver';
import { MPD } from 'mpd2';
import { SubsystemName } from './MPDSubsystemEventEmitter.js';
import VolumeControl from './VolumeControl.js';
import VideoLoader, { VideoInfo } from './VideoLoader.js';
export interface MPDPlayerError {
    message: string;
}
export interface ActionEvent {
    name: 'play' | 'pause' | 'resume' | 'stop' | 'seek' | 'setVolume';
    data?: Record<string, any>;
}
export interface MPDPlayerConfig {
    mpd: MPD.Config;
    volumeControl: VolumeControl;
    videoLoader: VideoLoader;
    prefetch: boolean;
}
export interface MPDPlayerVideoInfo extends VideoInfo {
    mpdSongId: string;
}
interface MPDStatus {
    repeat: boolean;
    random: boolean;
    single: boolean;
    consume: boolean;
    playlist: number;
    playlistlength: number;
    mixrampdb: number;
    state: 'play' | 'pause' | 'stop';
    song: number;
    songid: number;
    time: {
        elapsed: number;
        total: number;
    };
    elapsed: number;
    bitrate: string;
    duration: number;
    audio: {
        sample_rate: number;
        bits: string;
        channels: number;
        sample_rate_short: {
            value: number;
            unit: string;
        };
        original_value: string;
    };
}
export interface VolumioState {
    service: string;
    status: 'play' | 'pause' | 'stop';
    title?: string;
    artist?: string;
    album?: string;
    albumart: string;
    uri: string;
    trackType: string;
    seek?: number;
    duration: number;
    samplerate?: string;
    bitdepth?: string;
    bitrate?: string;
    channels?: number;
    volume: number;
    mute: boolean;
    isStreaming?: boolean;
}
export default class MPDPlayer extends Player {
    #private;
    constructor(config: MPDPlayerConfig);
    init(): Promise<void>;
    protected doPlay(video: Video, position: number): Promise<boolean>;
    next(AID?: number | null | undefined): Promise<boolean>;
    protected doPause(): Promise<boolean>;
    protected doResume(): Promise<boolean>;
    protected doStop(): Promise<boolean>;
    protected doSeek(position: number): Promise<boolean>;
    protected doSetVolume(volume: Volume): Promise<boolean>;
    protected doGetVolume(): Promise<Volume>;
    protected doGetPosition(): Promise<number>;
    protected doGetDuration(): Promise<number>;
    enablePrefetch(value: boolean): Promise<void>;
    destroy(): Promise<void>;
    sleep(): void;
    wake(): void;
    resolveOnMPDStatusChanged(action: () => Promise<void>, subsystem: SubsystemName, resolveOn?: Record<string, string>): Promise<{
        result: boolean;
        mpdStatus: MPDStatus;
    }>;
    getVolumioState(): Promise<VolumioState | null>;
    get videoLoader(): VideoLoader;
    get currentVideo(): MPDPlayerVideoInfo | null;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    on(event: 'action', listener: (args: ActionEvent) => void): this;
    on(event: 'error', listener: (args: MPDPlayerError) => void): this;
    on(event: 'state', listener: (data: {
        AID: string;
        current: PlayerState;
        previous: PlayerState | null;
    }) => void): this;
}
export {};
//# sourceMappingURL=MPDPlayer.d.ts.map