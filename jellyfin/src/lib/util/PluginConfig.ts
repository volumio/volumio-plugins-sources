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

export const PLUGIN_CONFIG_SCHEMA: PluginConfigSchema = {
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
