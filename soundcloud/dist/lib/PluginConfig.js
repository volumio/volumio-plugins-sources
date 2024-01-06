"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLUGIN_CONFIG_SCHEMA = void 0;
exports.PLUGIN_CONFIG_SCHEMA = {
    accessToken: { defaultValue: '', json: false },
    locale: { defaultValue: 'en', json: false },
    itemsPerPage: { defaultValue: 47, json: false },
    itemsPerSection: { defaultValue: 11, json: false },
    combinedSearchResults: { defaultValue: 11, json: false },
    loadFullPlaylistAlbum: { defaultValue: false, json: false },
    skipPreviewTracks: { defaultValue: false, json: false },
    addPlayedToHistory: { defaultValue: true, json: false },
    cacheMaxEntries: { defaultValue: 5000, json: false },
    cacheTTL: { defaultValue: 1800, json: false },
    // Soundcloud-testing
    logTranscodings: { defaultValue: false, json: false }
};
//# sourceMappingURL=PluginConfig.js.map