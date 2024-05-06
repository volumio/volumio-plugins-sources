import * as semver from 'semver';
import fs from 'fs';
import np from '../NowPlayingContext';
import { getPluginVersion } from '../utils/System';
import path from 'path';

const CONFIG_UPDATER_PATH = path.resolve(`${__dirname}/updaters`);

interface ConfigUpdaterInfo {
  path: string;
  fromVersion: string;
}

export default class ConfigUpdater {

  static async checkAndUpdate() {
    const pluginVersion = getPluginVersion();
    const configVersion = np.getConfigValue('configVersion');

    if (!pluginVersion) {
      np.getLogger().error('[now-playing] ConfigUpdater: failed to obtain plugin version. Not going to update config.');
      return;
    }

    if (!configVersion) {
      np.getLogger().info('[now-playing] ConfigUpdater: config version unavailable. Either this is the first time the plugin is installed, or the previous version is < 0.3.0). Config will not be updated.');
      this.#updateConfigVersion(pluginVersion);
    }
    else if (semver.satisfies(pluginVersion, configVersion)) {
      np.getLogger().info('[now-playing] ConfigUpdater: config is up to date.');
    }
    else if (semver.gt(configVersion, pluginVersion)) {
      np.getLogger().info(`[now-playing] ConfigUpdater: config version is newer than plugin version (${configVersion} > ${pluginVersion}). Config will not be updated.`);
      this.#updateConfigVersion(pluginVersion);
    }
    else if (semver.lt(configVersion, pluginVersion)) {
      np.getLogger().info(`[now-playing] ConfigUpdater: config version is older than plugin version (${configVersion} < ${pluginVersion}). Will check and apply config updates.`);
      await this.#updateConfigData(configVersion, pluginVersion);
    }
  }

  static #getUpdaters(): ConfigUpdaterInfo[] {
    const matchRegEx = /config_from_(.*).js$/;
    return fs.readdirSync(CONFIG_UPDATER_PATH).reduce<ConfigUpdaterInfo[]>((paths, file) => {
      const matches = file.match(matchRegEx);
      if (matches) {
        const _from = matches[1];
        if (_from) {
          paths.push({
            path: path.join(CONFIG_UPDATER_PATH, file),
            fromVersion: _from.replace(/_/g, '.')
          });
        }
      }
      return paths;
    }, [])
      .sort((up1, up2) => semver.lt(up1.fromVersion, up2.fromVersion) ? -1 : 1);
  }

  static async #updateConfigData(fromVersion: string, toVersion: string, remainingUpdaters?: ConfigUpdaterInfo[]) {
    let updaters: ConfigUpdaterInfo[];
    if (remainingUpdaters) {
      updaters = remainingUpdaters;
    }
    else {
      try {
        updaters = this.#getUpdaters();
      }
      catch (e) {
        np.getLogger().error(np.getErrorMessage(`[now-playing] ConfigUpdater: error fetching config updaters from "${CONFIG_UPDATER_PATH}":`, e));
        return;
      }
    }
    const applyIndex = updaters.findIndex((up) => semver.eq(up.fromVersion, fromVersion) || semver.gt(up.fromVersion, fromVersion));
    const applyUpdater = applyIndex >= 0 ? updaters[applyIndex] : null;

    if (!applyUpdater) {
      np.getLogger().info(`[now-playing] ConfigUpdater: no ${remainingUpdaters ? 'more ' : ''}config updaters found.`);
      this.#updateConfigVersion(toVersion);

    }
    else {
      np.getLogger().info(`[now-playing] ConfigUpdater: running config updater at "${applyUpdater.path}"...`);
      try {
        const updater = await import(applyUpdater.path);
        updater.update();
      }
      catch (e) {
        np.getLogger().error(np.getErrorMessage('[now-playing] ConfigUpdater: error running config updater:', e));
        return;
      }

      const updatedVersion = np.getConfigValue('configVersion');
      if (updatedVersion) {
        np.getLogger().info(`[now-playing] ConfigUpdater: config version updated to ${updatedVersion}. Checking if there are further updates to be performed...`);
        this.#updateConfigData(updatedVersion, toVersion, updaters.slice(applyIndex + 1));
      }
      else {
        np.getLogger().error('[now-playing] ConfigUpdater: error reading config version after last update. Aborting update process (config might be corrupt)...');

      }
    }
  }

  static #updateConfigVersion(toVersion: string) {
    np.setConfigValue('configVersion', toVersion);
    np.getLogger().info(`[now-playing] ConfigUpdater: updated config version to ${toVersion}`);
  }
}
