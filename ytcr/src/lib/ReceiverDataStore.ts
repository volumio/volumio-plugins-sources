import { DataStore } from 'yt-cast-receiver';
import ytcr from './YTCRContext.js';

const BUNDLE_KEY = 'yt-cast-receiver';

export default class ReceiverDataStore extends DataStore {

  async set<T>(key: string, value: T): Promise<void> {
    const bundle = ytcr.getConfigValue(BUNDLE_KEY, {}, true);
    bundle[key] = value;
    ytcr.setConfigValue(BUNDLE_KEY, bundle, true);
  }

  async get<T>(key: string): Promise<T | null> {
    const bundle = ytcr.getConfigValue(BUNDLE_KEY, {}, true);
    return bundle[key] || null;
  }

  clear() {
    ytcr.deleteConfigValue(BUNDLE_KEY);
  }
}
