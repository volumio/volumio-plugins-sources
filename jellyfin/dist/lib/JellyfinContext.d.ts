import winston from 'winston';
import { PluginConfigKey, PluginConfigValue } from './util/PluginConfig';
interface DeviceInfo {
    name: string;
    id: string;
    host: string;
}
declare class JellyfinContext {
    #private;
    constructor();
    set(key: string, value: any): void;
    get<T>(key: string, defaultValue: T): T;
    delete(key: string): void;
    init(pluginContext: any, pluginConfig: any): void;
    toast(type: 'success' | 'info' | 'error' | 'warn', message: string, title?: string): void;
    getLogger(): winston.Logger;
    getDeviceInfo(): DeviceInfo;
    hasConfigKey<T extends PluginConfigKey>(key: T): boolean;
    getConfigValue<T extends PluginConfigKey>(key: T): PluginConfigValue<T>;
    deleteConfigValue(key: string): void;
    setConfigValue<T extends PluginConfigKey>(key: T, value: PluginConfigValue<T>): void;
    getAlbumArtPlugin(): any;
    getMpdPlugin(): any;
    getStateMachine(): any;
    getPlaylistManager(): any;
    reset(): void;
    getI18n(key: string, ...formatValues: any[]): string;
    get volumioCoreCommand(): any;
}
declare const _default: JellyfinContext;
export default _default;
//# sourceMappingURL=JellyfinContext.d.ts.map