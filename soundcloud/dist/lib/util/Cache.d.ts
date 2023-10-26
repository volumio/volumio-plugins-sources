export default class Cache {
    #private;
    constructor(ttl: number, maxEntries: number);
    setTTL(ttl: number): void;
    setMaxEntries(maxEntries: number): void;
    get<T>(key: string): T | undefined;
    put<T>(key: string, value: T): boolean;
    clear(): void;
    close(): void;
    getEntryCount(): number;
    getMemoryUsageInKB(): number;
    getOrSet<T>(key: string, promiseCallback: () => Promise<T>): Promise<T>;
}
//# sourceMappingURL=Cache.d.ts.map