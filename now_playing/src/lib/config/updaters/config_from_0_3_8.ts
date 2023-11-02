import { DefaultThemeSettings, ThemeSettings } from 'now-playing-common';
import np from '../../NowPlayingContext';

/**
 * Update:
 * - `theme`: from string to { active: string; }
 */

const TO_VERSION = '0.4.0';

export function update() {
  updateThemeSetting();
  np.getLogger().info(`[now-playing] Updating config version to ${TO_VERSION}`);
  np.setConfigValue('configVersion', TO_VERSION);
  np.getLogger().info('[now-playing] Update complete');
}

function updateThemeSetting() {
  /**
   * Old version has 'theme' value of string type, current is object { active: themeName }.
   * Here, we test whether theme value is string type and, if so, convert and save it as object.
   * Because np.getConfigValue() will return default value if JSON parse fails,
   * we need to test parsing the raw config value ourselves.
   */
  const rawValue = np.getConfigValue('theme', true);
  let tryParsedValue;
  try {
    tryParsedValue = JSON.parse(rawValue);
  }
  catch (error) {
    tryParsedValue = rawValue;
  }
  if (tryParsedValue === undefined ||
    (typeof tryParsedValue === 'object' && Reflect.has(tryParsedValue, 'active'))) {
    return;
  }
  let updateValue: ThemeSettings | null = null;
  if (typeof tryParsedValue === 'string') {
    updateValue = {
      active: tryParsedValue
    };
  }
  else {
    // `rawValue` is unknown type or object, set default value
    updateValue = {...DefaultThemeSettings};
  }
  if (updateValue) {
    np.setConfigValue('theme', updateValue);
    np.getLogger().info(`[now-playing] Updated config value for 'theme': ${JSON.stringify(updateValue)}`);
  }
}
