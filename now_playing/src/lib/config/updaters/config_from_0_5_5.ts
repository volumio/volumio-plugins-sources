import { DefaultMetadataServiceOptions, MetadataServiceOptions } from '../PluginConfig';
import np from '../../NowPlayingContext';

/**
 * Update:
 * - `theme`: from string to { active: string; }
 */

const TO_VERSION = '0.5.6';

export function update() {
  updateMetadataServiceOptions();
  np.getLogger().info(`[now-playing] Updating config version to ${TO_VERSION}`);
  np.setConfigValue('configVersion', TO_VERSION);
  np.getLogger().info('[now-playing] Update complete');
}

function updateMetadataServiceOptions() {
  /**
   * Old version has 'geniusAccessToken' value of string type, current is held in
   * object of type MetadataServiceOptions{ geniusAccessToken: string; ... }.
   * Here, we test whether geniusAccessToken value exists as a standalone setting and, if so,
   * place it in an object of type MetadataServiceOptions, followed by saving said object.
   */
  const rawValue = np.getConfigValue('geniusAccessToken' as any, true);
  let updateValue: MetadataServiceOptions;
  if (typeof rawValue === 'string') {
    updateValue = {
      ...DefaultMetadataServiceOptions,
      'geniusAccessToken': rawValue
    };
  }
  else {
    updateValue = {...DefaultMetadataServiceOptions};
  }
  np.setConfigValue('metadataService', updateValue);
  np.deleteConfigValue('geniusAccessToken');
  np.getLogger().info('[now-playing] Updated config value for \'metadataService\'');
}
