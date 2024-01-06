import { SearchQuery } from './lib/controller/search/SearchController';
import { QueueItem } from './lib/controller/browse/view-handlers/ExplodableViewHandler';
interface GotoParams extends QueueItem {
    type: 'album' | 'artist';
}
declare class ControllerYTMusic {
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
    prefetch(track: QueueItem): any;
    goto(data: GotoParams): any;
}
export = ControllerYTMusic;
//# sourceMappingURL=index.d.ts.map