import { DataStore } from 'yt-cast-receiver';
import ytcr from './YTCRContext';

const BUNDLE_KEY = 'yt-cast-receiver';
const TTL = 3600000;

export default class ReceiverDataStore extends DataStore {

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  set<T>(key: string, value: T): Promise<void> {
    const bundle = ytcr.getConfigValue(BUNDLE_KEY);
    bundle[key] = value;
    ytcr.setConfigValue(BUNDLE_KEY, bundle);
    ytcr.setConfigValue('dataStoreLastModified', new Date().getTime());
    return Promise.resolve();
  }

  get<T>(key: string): Promise<T | null> {
    const bundle = ytcr.getConfigValue(BUNDLE_KEY);
    return Promise.resolve(bundle[key] || null);
  }

  clear() {
    ytcr.deleteConfigValue(BUNDLE_KEY);
    ytcr.deleteConfigValue('dataStoreLastModified');
  }

  isExpired() {
    const lastModified = ytcr.getConfigValue('dataStoreLastModified');
    if (lastModified === null) {
      return false;
    }
    return new Date().getTime() - lastModified >= TTL;
  }
}
