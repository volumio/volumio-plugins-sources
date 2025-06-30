import NodeCache from 'node-cache';
import mcfetch from 'mixcloud-fetch';

export default class Cache {
  #ttl: number;
  #maxEntries: number;
  #cache: NodeCache;

  constructor(ttl: number, maxEntries: number) {
    this.#ttl = ttl;
    this.#maxEntries = maxEntries;
    this.#cache = new NodeCache({
      checkperiod: 600
    });
  }

  setTTL(ttl: number) {
    if (this.#ttl != ttl) {
      const keys = this.#cache.keys();
      keys.forEach((key) => {
        this.#cache.ttl(key, ttl);
      });
    }
    this.#ttl = ttl;
  }

  setMaxEntries(maxEntries: number) {
    const keyCount = this.#cache.keys().length;
    if (keyCount > maxEntries) {
      const keys = this.#cache.keys();
      for (let i = 0; i < keyCount - maxEntries; i++) {
        this.#cache.del(keys[i]);
      }
    }
    this.#maxEntries = maxEntries;
  }

  get<T>(key: string): T | undefined {
    return this.#cache.get<T>(key);
  }

  put<T>(key: string, value: T) {
    const keys = this.#cache.keys();
    if (keys.length === this.#maxEntries) {
      this.#cache.del(keys[0]);
    }
    return this.#cache.set(key, value, this.#ttl);
  }

  clear() {
    this.#cache.flushAll();
    mcfetch.cache.clear();
  }

  close() {
    this.#cache.close();
  }

  getEntryCount() {
    return this.#cache.getStats().keys;
  }

  getMemoryUsageInKB() {
    return (this.#cache.getStats().vsize + this.#cache.getStats().ksize) / 1000;
  }

  async getOrSet<T>(key: string, promiseCallback: () => Promise<T>): Promise<T> {
    const cachedValue = this.get<T>(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    const value = await promiseCallback();
    this.put<T>(key, value);
    return value;
  }
}
