import winston from 'winston';
declare class YouTube2Context {
    #private;
    constructor();
    set<T>(key: string, value: T): void;
    get<T>(key: string): T | null;
    get<T>(key: string, defaultValue: T): T;
    delete(key: string): void;
    init(pluginContext: any, pluginConfig: any): void;
    toast(type: 'success' | 'info' | 'error' | 'warning', message: string, title?: string): void;
    refreshUIConfig(): void;
    getLogger(): winston.Logger;
    getErrorMessage(message: string, error: any, stack?: boolean): string;
    getConfigValue<T>(key: string, defaultValue: T, json?: boolean): T;
    deleteConfigValue(key: string): void;
    setConfigValue<T>(key: string, value: T, json?: boolean): void;
    getAlbumArtPlugin(): any;
    getMpdPlugin(): any;
    getStateMachine(): any;
    reset(): void;
    getI18n(key: string, ...formatValues: any[]): string;
    get volumioCoreCommand(): any;
}
declare const _default: YouTube2Context;
export default _default;
//# sourceMappingURL=YouTube2Context.d.ts.map