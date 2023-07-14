import { SearchQuery } from './lib/controller/search/SearchController';
import { ExplodedTrackInfo } from './lib/controller/browse/view-handlers/Explodable';
interface GotoParams extends ExplodedTrackInfo {
    type: 'album' | 'artist';
}
declare class ControllerJellyfin {
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
}
export = ControllerJellyfin;
//# sourceMappingURL=index.d.ts.map