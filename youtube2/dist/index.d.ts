import { SearchQuery } from './lib/controller/search/SearchController';
import { QueueItem } from './lib/controller/browse/view-handlers/ExplodableViewHandler';
import { NowPlayingPluginSupport } from 'now-playing-common';
import YouTube2NowPlayingMetadataProvider from './lib/util/YouTube2NowPlayingMetadataProvider';
interface GotoParams extends QueueItem {
    type: 'album' | 'artist';
}
declare class ControllerYouTube2 implements NowPlayingPluginSupport {
    #private;
    constructor(context: any);
    getUIConfig(): any;
    onVolumioStart(): any;
    onStart(): any;
    onStop(): any;
    getConfigurationFiles(): string[];
    configSaveI18n(data: any): void;
    configSignOut(): Promise<void>;
    configSaveBrowse(data: any): void;
    configSavePlayback(data: any): void;
    configEnableAddToHistory(): void;
    configSaveYouTubePlaybackMode(data: any): void;
    handleBrowseUri(uri: string): any;
    explodeUri(uri: string): any;
    clearAddPlayTrack(track: any): any;
    stop(): any;
    pause(): any;
    resume(): any;
    seek(position: number): any;
    next(): any;
    previous(): any;
    prefetch(track: QueueItem): any;
    search(query: SearchQuery): any;
    goto(data: GotoParams): any;
    getNowPlayingMetadataProvider(): YouTube2NowPlayingMetadataProvider | null;
}
export = ControllerYouTube2;
//# sourceMappingURL=index.d.ts.map