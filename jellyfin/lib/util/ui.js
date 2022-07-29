const fs = require('fs');

function supportsEnhancedTitles() {
    return !isManifestUI();
}

function isManifestUI() {
    let volumioManifestUIFlagFile = '/data/manifestUI';
    let volumioManifestUIDisabledFile = '/data/disableManifestUI';
    return fs.existsSync(volumioManifestUIFlagFile) && !fs.existsSync(volumioManifestUIDisabledFile);
}

module.exports = {
    supportsEnhancedTitles
};
