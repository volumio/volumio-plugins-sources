import I18nSchema from '../i18n/strings_en.json';
import winston from 'winston';
export type I18nKey = keyof typeof I18nSchema;
declare class JellyfinServerContext {
    #private;
    constructor();
    init(pluginContext: any): void;
    toast(type: 'success' | 'info' | 'error' | 'warning', message: string, title?: string): void;
    getLogger(): winston.Logger;
    getErrorMessage(message: string, error: any, stack?: boolean): string;
    reset(): void;
    getI18n(key: I18nKey, ...formatValues: any[]): string;
    getDeviceInfo(): any;
    get volumioCoreCommand(): any;
}
declare const _default: JellyfinServerContext;
export default _default;
//# sourceMappingURL=JellyfinServerContext.d.ts.map