import { DataStore } from 'yt-cast-receiver';
import ytcr from './YTCRContext.js';

const BUNDLE_KEY = 'yt-cast-receiver';

export default class ReceiverDataStore extends DataStore {

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  set<T>(key: string, value: T): Promise<void> {
    const bundle = ytcr.getConfigValue(BUNDLE_KEY, {}, true);
    bundle[key] = value;
    ytcr.setConfigValue(BUNDLE_KEY, bundle, true);
    return Promise.resolve();
  }

  get<T>(key: string): Promise<T | null> {
    const bundle = ytcr.getConfigValue(BUNDLE_KEY, {}, true);
    return Promise.resolve(bundle[key] || null);
  }

  clear() {
    ytcr.deleteConfigValue(BUNDLE_KEY);
  }
}
