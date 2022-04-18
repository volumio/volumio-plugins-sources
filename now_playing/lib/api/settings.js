const np = require(nowPlayingPluginLibRoot + '/np');

async function getCustomStyles() {
    return np.getConfigValue('styles', {}, true);
}

async function getTheme() {
    return np.getConfigValue('theme', 'default');
}

async function getPerformanceSettings() {
    return np.getConfigValue('performance', null, true);
}

module.exports = {
    getCustomStyles,
    getTheme,
    getPerformanceSettings
};
