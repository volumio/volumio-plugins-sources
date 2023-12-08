"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLUGIN_CONFIG_SCHEMA = void 0;
exports.PLUGIN_CONFIG_SCHEMA = {
    itemsPerPage: { defaultValue: 47, json: false },
    showAllAlbumTracks: { defaultValue: true, json: false },
    showAllPlaylistTracks: { defaultValue: true, json: false },
    rememberFilters: { defaultValue: true, json: false },
    markFavoriteTarget: { defaultValue: 'all', json: false },
    maxTracks: { defaultValue: 100, json: false },
    noMaxTracksSingleAlbum: { defaultValue: true, json: false },
    noMaxTracksSinglePlaylist: { defaultValue: true, json: false },
    gaplessPlayback: { defaultValue: true, json: false },
    searchAlbums: { defaultValue: true, json: false },
    searchAlbumsResultCount: { defaultValue: 11, json: false },
    searchArtists: { defaultValue: true, json: false },
    searchArtistsResultCount: { defaultValue: 11, json: false },
    searchSongs: { defaultValue: true, json: false },
    searchSongsResultCount: { defaultValue: 11, json: false },
    showLatestMusicSection: { defaultValue: true, json: false },
    latestMusicSectionItems: { defaultValue: 11, json: false },
    showRecentlyPlayedSection: { defaultValue: true, json: false },
    recentlyPlayedSectionItems: { defaultValue: 5, json: false },
    showFrequentlyPlayedSection: { defaultValue: true, json: false },
    frequentlyPlayedSectionItems: { defaultValue: 5, json: false },
    showFavoriteArtistsSection: { defaultValue: true, json: false },
    favoriteArtistsSectionItems: { defaultValue: 5, json: false },
    showFavoriteAlbumsSection: { defaultValue: true, json: false },
    favoriteAlbumsSectionItems: { defaultValue: 5, json: false },
    showFavoriteSongsSection: { defaultValue: true, json: false },
    favoriteSongsSectionItems: { defaultValue: 5, json: false },
    collectionInSectionItems: { defaultValue: 11, json: false },
    connectionDeviceIds: { defaultValue: {}, json: true },
    savedFilters: { defaultValue: null, json: true },
    servers: { defaultValue: [], json: true }
};
//# sourceMappingURL=PluginConfig.js.map