import { SearchQuery } from './lib/controller/search/SearchController';
import { ExplodedTrackInfo } from './lib/controller/browse/view-handlers/ExplodableViewHandler';
interface GotoParams extends ExplodedTrackInfo {
    type: 'album' | 'artist';
}
declare class ControllerBandcamp {
    #private;
    constructor(context: any);
    getUIConfig(): any;
    refreshUIConfig(): void;
    configSaveGeneralSettings(data: any): void;
    configSaveMyBandcampSettings(data: any): void;
    configSaveCacheSettings(data: any): void;
    configClearCache(): void;
    onVolumioStart(): any;
    onStart(): any;
    onStop(): any;
    getConfigurationFiles(): string[];
    handleBrowseUri(uri: string): any;
    explodeUri(uri: string): any;
    clearAddPlayTrack(track: any): any;
    stop(): any;
    pause(): any;
    resume(): any;
    seek(position: number): any;
    next(): any;
    previous(): any;
    prefetch(track: any): any;
    search(query: SearchQuery): any;
    goto(data: GotoParams): any;
    saveDefaultDiscoverParams(data: any): void;
    saveDefaultArticleCategory(data: any): void;
}
export = ControllerBandcamp;
//# sourceMappingURL=index.d.ts.map