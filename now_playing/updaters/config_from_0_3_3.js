const np = require(nowPlayingPluginLibRoot + '/np');

/**
 * Technical notes:
 * This updater actually does nothing other than update the config version.
 * This is strictly not necessary when there are no settings to be modified.
 * The updater is merely for testing purpose (but no harm leaving it here).
 */

const TO_VERSION = '0.3.4';

function update() {
    np.getLogger().info(`[now-playing-config] Updating config version to ${TO_VERSION}`);
    np.setConfigValue('configVersion', TO_VERSION);
    np.getLogger().info(`[now-playing-config] Update complete`);
}

module.exports = {
    update
};
