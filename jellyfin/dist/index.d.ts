import { SearchQuery } from './lib/controller/search/SearchController';
import { ExplodedTrackInfo } from './lib/controller/browse/view-handlers/Explodable';
import { NowPlayingPluginSupport } from 'now-playing-common';
import JellyfinNowPlayingMetadataProvider from './lib/util/JellyfinNowPlayingMetadataProvider';
interface GotoParams extends ExplodedTrackInfo {
    type: 'album' | 'artist';
}
declare class ControllerJellyfin implements NowPlayingPluginSupport {
    #private;
    constructor(context: any);
    getUIConfig(): any;
    refreshUIConfig(): void;
    configAddServer(data: any): void;
    configRemoveServer(data: any): Promise<void>;
    configSaveBrowseSettings(data: any): void;
    configSavePlayAddSettings(data: any): void;
    configSaveSearchSettings(data: any): void;
    configSaveMyMediaLibrarySettings(data: any): void;
    onVolumioStart(): any;
    onStart(): any;
    onStop(): any;
    getConfigurationFiles(): string[];
    handleBrowseUri(uri: string): any;
    explodeUri(uri: string): any;
    clearAddPlayTrack(track: any): Promise<void> | undefined;
    stop(): any;
    pause(): any;
    resume(): any;
    seek(position: number): any;
    next(): any;
    previous(): any;
    prefetch(track: any): any;
    search(query: SearchQuery): any;
    goto(data: GotoParams): any;
    addToFavourites(data: {
        uri: string;
        service: string;
    }): any;
    removeFromFavourites(data: {
        uri: string;
        service: string;
    }): any;
    getNowPlayingMetadataProvider(): JellyfinNowPlayingMetadataProvider | null;
}
export = ControllerJellyfin;
//# sourceMappingURL=index.d.ts.map