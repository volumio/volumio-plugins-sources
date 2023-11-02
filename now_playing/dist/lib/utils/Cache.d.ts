export default class Cache {
    #private;
    constructor(ttl?: {
        [type: string]: number;
    }, maxEntries?: {
        [type: string]: number;
    });
    setTTL(type: string, ttl: number): void;
    setMaxEntries(type: string, maxEntries: number): void;
    getMaxEntries(type: string): number;
    isEnabled(): boolean;
    setEnabled(value: boolean): void;
    get<T>(type: string, key: string): T | undefined;
    put<T>(type: string, key: string, value: T): boolean | undefined;
    getKeys(type: string): string[];
    clear(type?: string): void;
    getOrSet<T>(type: string, key: string, promiseCallback: () => Promise<T>): Promise<T>;
}
//# sourceMappingURL=Cache.d.ts.map