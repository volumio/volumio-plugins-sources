import { SearchQuery } from './lib/controller/search/SearchController';
import { QueueItem } from './lib/controller/browse/view-handlers/ExplodableViewHandler';
interface GotoParams extends QueueItem {
    type: 'album' | 'artist';
}
declare class ControllerYouTube2 {
    #private;
    constructor(context: any);
    getUIConfig(): any;
    onVolumioStart(): any;
    onStart(): any;
    onStop(): any;
    getConfigurationFiles(): string[];
    configSaveI18n(data: any): void;
    configSignOut: () => void;
    configSaveBrowse: (data: any) => void;
    configSavePlayback(data: any): void;
    configEnableAddToHistory(): void;
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
}
export = ControllerYouTube2;
//# sourceMappingURL=index.d.ts.map