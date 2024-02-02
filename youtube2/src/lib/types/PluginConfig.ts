import { Credentials } from 'volumio-youtubei.js';
import Endpoint from './Endpoint';

export type PluginConfigKey = keyof PluginConfigSchema;
export type PluginConfigValue<T extends PluginConfigKey> = PluginConfigSchema[T]['defaultValue'];

export interface PluginConfigSchemaEntry<T, U = false> {
  defaultValue: T;
  json: U;
}

export interface PluginConfigSchema {
  region: PluginConfigSchemaEntry<string>;
  language: PluginConfigSchemaEntry<string>;
  rootContentType: PluginConfigSchemaEntry<'full' | 'simple'>,
  loadFullPlaylists: PluginConfigSchemaEntry<boolean>;
  autoplay: PluginConfigSchemaEntry<boolean>;
  autoplayClearQueue: PluginConfigSchemaEntry<boolean>;
  autoplayPrefMixRelated: PluginConfigSchemaEntry<boolean>;
  addToHistory: PluginConfigSchemaEntry<boolean>;
  liveStreamQuality: PluginConfigSchemaEntry<'auto' | '144p' | '240p' | '360p' | '480p' | '720p' | '1080p'>;
  prefetch: PluginConfigSchemaEntry<boolean>;
  ytPlaybackMode: PluginConfigSchemaEntry<YouTubePlaybackMode, true>;
  authCredentials: PluginConfigSchemaEntry<Credentials | undefined, true>;
}

export interface YouTubePlaybackMode {
  feedVideos: boolean;
  playlistVideos: boolean;
}

export interface I18nOptions {
  language?: {
    label: string;
    optionValues: I18nOptionValue[];
  };
  region?: {
    label: string;
    optionValues: I18nOptionValue[];
  }
}

export interface I18nOptionValue {
  label: string;
  value: string;
}

export interface Account {
  name: string;
  photo: string | null;
  channel?: {
    title: string;
    endpoint: Endpoint | null;
  };
}
