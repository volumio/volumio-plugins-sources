import winston from 'winston';
import Cache from './util/Cache';
declare class BandcampContext {
    #private;
    constructor();
    set(key: string, value: any): void;
    get<T>(key: string, defaultValue: T): T;
    delete(key: string): void;
    init(pluginContext: any, pluginConfig: any): void;
    toast(type: 'success' | 'info' | 'error' | 'warning', message: string, title?: string): void;
    getLogger(): winston.Logger;
    getConfigValue<T>(key: string, defaultValue: T, json?: boolean): T;
    deleteConfigValue(key: string): void;
    setConfigValue(key: string, value: any, json?: boolean): void;
    getAlbumArtPlugin(): any;
    getMpdPlugin(): any;
    getStateMachine(): any;
    getCache(): Cache;
    getPlaylistManager(): any;
    reset(): void;
    getI18n(key: string, ...formatValues: any[]): string;
    get volumioCoreCommand(): any;
}
declare const _default: BandcampContext;
export default _default;
//# sourceMappingURL=BandcampContext.d.ts.map