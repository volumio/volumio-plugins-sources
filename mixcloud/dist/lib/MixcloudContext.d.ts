import winston from 'winston';
import Cache from './util/Cache';
import { PluginConfigKey, PluginConfigValue } from './util/PluginConfig';
declare class MixcloudContext {
    #private;
    constructor();
    set(key: string, value: any): void;
    get<T>(key: string, defaultValue: T): T;
    delete(key: string): void;
    init(pluginContext: any, pluginConfig: any): void;
    toast(type: 'success' | 'info' | 'error' | 'warning', message: string, title?: string): void;
    getLogger(): winston.Logger;
    getErrorMessage(message: string, error: any, stack?: boolean): string;
    getConfigValue<T extends PluginConfigKey>(key: T): PluginConfigValue<T>;
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
declare const _default: MixcloudContext;
export default _default;
//# sourceMappingURL=MixcloudContext.d.ts.map