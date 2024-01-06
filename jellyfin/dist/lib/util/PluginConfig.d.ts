import ServerConnection from '../connection/ServerConnection';
import { FilterSelection } from '../model/filter/FilterModel';
import { ServerConfEntry } from './ServerHelper';
export type PluginConfigKey = keyof PluginConfigSchema;
export type PluginConfigValue<T extends PluginConfigKey> = PluginConfigSchema[T]['defaultValue'];
export interface PluginConfigSchemaEntry<T, U = false> {
    defaultValue: T;
    json: U;
}
export interface PluginConfigSchema {
    itemsPerPage: PluginConfigSchemaEntry<number>;
    showAllAlbumTracks: PluginConfigSchemaEntry<boolean>;
    showAllPlaylistTracks: PluginConfigSchemaEntry<boolean>;
    rememberFilters: PluginConfigSchemaEntry<boolean>;
    markFavoriteTarget: PluginConfigSchemaEntry<'all' | 'serverOnly'>;
    maxTracks: PluginConfigSchemaEntry<number>;
    noMaxTracksSingleAlbum: PluginConfigSchemaEntry<boolean>;
    noMaxTracksSinglePlaylist: PluginConfigSchemaEntry<boolean>;
    gaplessPlayback: PluginConfigSchemaEntry<boolean>;
    searchAlbums: PluginConfigSchemaEntry<boolean>;
    searchAlbumsResultCount: PluginConfigSchemaEntry<number>;
    searchArtists: PluginConfigSchemaEntry<boolean>;
    searchArtistsResultCount: PluginConfigSchemaEntry<number>;
    searchSongs: PluginConfigSchemaEntry<boolean>;
    searchSongsResultCount: PluginConfigSchemaEntry<number>;
    showLatestMusicSection: PluginConfigSchemaEntry<boolean>;
    latestMusicSectionItems: PluginConfigSchemaEntry<number>;
    showRecentlyPlayedSection: PluginConfigSchemaEntry<boolean>;
    recentlyPlayedSectionItems: PluginConfigSchemaEntry<number>;
    showFrequentlyPlayedSection: PluginConfigSchemaEntry<boolean>;
    frequentlyPlayedSectionItems: PluginConfigSchemaEntry<number>;
    showFavoriteArtistsSection: PluginConfigSchemaEntry<boolean>;
    favoriteArtistsSectionItems: PluginConfigSchemaEntry<number>;
    showFavoriteAlbumsSection: PluginConfigSchemaEntry<boolean>;
    favoriteAlbumsSectionItems: PluginConfigSchemaEntry<number>;
    showFavoriteSongsSection: PluginConfigSchemaEntry<boolean>;
    favoriteSongsSectionItems: PluginConfigSchemaEntry<number>;
    collectionInSectionItems: PluginConfigSchemaEntry<number>;
    connectionDeviceIds: PluginConfigSchemaEntry<Record<ServerConnection['id'], string>, true>;
    savedFilters: PluginConfigSchemaEntry<FilterSelection | null, true>;
    servers: PluginConfigSchemaEntry<ServerConfEntry[], true>;
}
export declare const PLUGIN_CONFIG_SCHEMA: PluginConfigSchema;
//# sourceMappingURL=PluginConfig.d.ts.map