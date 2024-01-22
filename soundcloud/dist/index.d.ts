import { SearchQuery } from './lib/controller/search/SearchController';
import { QueueItem } from './lib/controller/browse/view-handlers/ExplodableViewHandler';
interface GotoParams extends QueueItem {
    type: 'album' | 'artist';
}
declare class ControllerSoundCloud {
    #private;
    constructor(context: any);
    getUIConfig(): any;
    configSaveGeneralSettings(data: any): void;
    configSaveCacheSettings(data: any): void;
    configSavePlaybackSettings(data: any): void;
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
    search(query: SearchQuery): any;
    goto(data: GotoParams): any;
}
export = ControllerSoundCloud;
//# sourceMappingURL=index.d.ts.map