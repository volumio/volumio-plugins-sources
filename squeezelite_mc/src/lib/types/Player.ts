import Server from './Server';

interface Player {
  id: string;
  uuid: string;
  ip: string;
  name: string;
  server: Server
}

export type PlayerStartupParams = BasicPlayerStartupParams | ManualPlayerStartupParams;

export interface AlsaConfig {
  card: string;
  mixerType: 'Hardware' | 'Software' | 'None';
  mixer: string | null;
}

export interface BasicPlayerStartupParams extends AlsaConfig {
  type: 'basic';
  playerName: string;
  dsdFormat: string | null;
}

export interface ManualPlayerStartupParams extends AlsaConfig {
  type: 'manual';
  startupOptions: string;
}

export interface PlayerStatus {
  mode: 'play' | 'stop' | 'pause';
  time?: number;
  volume?: number;
  repeatMode?: number;
  shuffleMode?: number;
  canSeek?: number;
  currentTrack?: {
    type?: string;
    title?: string;
    artist?: string;
    trackArtist?: string;
    albumArtist?: string;
    album?: string;
    remoteTitle?: string;
    artworkUrl?: string;
    coverArt?: string;
    duration?: number;
    sampleRate?: number;
    sampleSize?: number;
    bitrate?: string;
  };
}

export enum PlayerRunState {
  Normal = 0,
  StartError = -1,
  ConfigRequireRestart = -2,
  ConfigRequireRevalidate = -3
}

export default Player;
