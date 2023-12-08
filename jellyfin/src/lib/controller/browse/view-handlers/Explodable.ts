import { Song } from '../../../entities';
import { ModelType } from '../../../model';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { MediaSourceInfo, MediaStream } from '@jellyfin/sdk/lib/generated-client/models';
import SongHelper from '../../../util/SongHelper';

export interface ExplodedTrackInfo {
  service: 'jellyfin';
  uri: string;
  albumart: string | null;
  artist?: string;
  album?: string;
  name: string;
  title: string;
  bitdepth?: string;
  samplerate?: string;
  trackType?: string;
  duration: number;
}

export interface AudioStreamMetadata {
  source: MediaSourceInfo;
  stream: MediaStream;
}

type Constructor<V extends View> = new (...args: any[]) => BaseViewHandler<V> & { getSongsOnExplode: () => Promise<Song[]> };

export function Explodable<V extends View, TBase extends Constructor<V>>(Base: TBase) {

  return class ExplodableViewHandler extends Base {

    async explode(): Promise<ExplodedTrackInfo[]> {
      const view = this.currentView;
      if (view.noExplode) {
        return [];
      }

      const songs = await this.getSongsOnExplode();
      if (!Array.isArray(songs)) {
        const trackInfo = await this._parseSongForExplode(songs);
        return trackInfo ? [ trackInfo ] : [];
      }

      const trackInfoPromises = songs.map((song) => this._parseSongForExplode(song));
      const tracks = (await Promise.all(trackInfoPromises)).filter((song) => song) as ExplodedTrackInfo[];

      return tracks;
    }

    async _parseSongForExplode(song: Song): Promise<ExplodedTrackInfo | null> {
      const trackUri = this._getTrackUri(song);
      if (!trackUri) {
        return null;
      }
      // Because we set consume update service (mpd) to ignore metadata,
      // We need to also provide the samplerate and bitdepth
      let bitdepth, samplerate, trackType;
      const { source, stream } = this._getAudioStreamMetadata(song) || {};
      if (stream && stream.BitDepth && stream.SampleRate) {
        bitdepth = `${stream.BitDepth} bit`;
        samplerate = `${stream.SampleRate / 1000} kHz`;
        // Special handling for DSDs
        if (stream.Codec && stream.Codec.startsWith('dsd_')) {
          bitdepth = '1 bit';
          switch (stream.BitDepth * stream.SampleRate) {
            case 2822400: // DSD64
              samplerate = '2.82 MHz';
              break;
            case 5644800: // DSD128
              samplerate = '5.64 MHz';
              break;
            case 11289600: // DSD256
              samplerate = '11.2 MHz';
              break;
            case 22579200: // DSD512
              samplerate = '22.58 MHz';
              break;
            case 45158400: // DSD1024
              samplerate = '45.2 MHz';
              break;
            default:
              samplerate = '{ Math.round(stream.BitDepth * stream.SampleRate / 10000) / 100 } MHz';
          }
        }
        else {
          bitdepth = `${stream.BitDepth} bit`;
          samplerate = `${stream.SampleRate / 1000} kHz`;
        }
      }
      if (source?.Container) {
        const container = source.Container.toLowerCase();
        trackType = container;
      }

      const result: ExplodedTrackInfo = {
        service: 'jellyfin',
        uri: trackUri,
        albumart: this.getAlbumArt(song),
        artist: song.artists.map((artist) => artist.name).join(', '),
        album: '',
        name: song.name,
        title: song.name,
        bitdepth: bitdepth,
        samplerate: samplerate,
        duration: song.duration
      };

      if (song.album?.name) {
        result.album = song.album.name;
      }
      else if (song.album?.id) {
        // Some songs don't have Album names, e.g. WAV files.
        // If album Id is available, then obtain the name from album.
        const albumModel = this.getModel(ModelType.Album);
        const album = await albumModel.getAlbum(song.album.id);
        if (album?.name) {
          result.album = album.name;
        }
      }

      if (trackType) {
        result.trackType = trackType;
      }

      return result;
    }

    _getAudioStreamMetadata(song: Song): AudioStreamMetadata | null {
      const source = song.mediaSources?.[0];
      const stream = source?.MediaStreams?.find((stream) => stream.Type === 'Audio');
      if (source && stream) {
        return { source, stream };
      }
      return null;
    }

    /**
     * Track uri is the canonical uri of the song:
     * jellyfin/{username}@{serverId}/song@songId={songId}
     */
    _getTrackUri(song: Song): string | null {
      return SongHelper.getCanonicalUri(song, this.serverConnection);
    }
  };
}
