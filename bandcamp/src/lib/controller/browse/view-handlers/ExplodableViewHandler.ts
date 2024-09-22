import BaseViewHandler from './BaseViewHandler';
import View from './View';
import UIHelper from '../../../util/UIHelper';
import TrackEntity from '../../../entities/TrackEntity';
import { TrackView } from './TrackViewHandler';
import ViewHelper from './ViewHelper';

export interface ExplodedTrackInfo {
  service: 'bandcamp';
  uri: string;
  albumart?: string;
  artist?: string;
  album?: string;
  name: string;
  title: string;
  duration?: number;
  samplerate?: string;
}

export default abstract class ExplodableViewHandler<V extends View, E extends TrackEntity = TrackEntity> extends BaseViewHandler<V> {

  async explode(): Promise<ExplodedTrackInfo[]> {
    const view = this.currentView;
    if (view.noExplode) {
      return [];
    }

    const tracks = await this.getTracksOnExplode();
    if (!Array.isArray(tracks)) {
      const trackInfo = await this.parseTrackForExplode(tracks);
      return trackInfo ? [ trackInfo ] : [];
    }

    const trackInfoPromises = tracks.map((track) => this.parseTrackForExplode(track));
    return (await Promise.all(trackInfoPromises)).filter((song) => song) as ExplodedTrackInfo[];
  }

  protected async parseTrackForExplode(track: E): Promise<ExplodedTrackInfo | null> {
    const trackUri = this.getTrackUri(track);
    if (!trackUri) {
      return null;
    }
    const trackName = track.streamUrl ? track.name : UIHelper.addNonPlayableText(track.name);
    return {
      service: 'bandcamp',
      uri: trackUri,
      albumart: track.thumbnail,
      artist: track.artist?.name,
      album: track.album?.name,
      name: trackName,
      title: trackName,
      duration: track.duration
    };
  }

  protected abstract getTracksOnExplode(): Promise<E | E[]>;

  /**
   * Track uri:
   * bandcamp/track@trackUrl={trackUrl}@artistUrl={...}@albumUrl={...}
   */
  protected getTrackUri(track: E) {
    if (!track.url) {
      return null;
    }
    const artistUrl = track.artist?.url || null;
    const albumUrl = track.album?.url || artistUrl;
    const trackView: TrackView = {
      name: 'track',
      trackUrl: track.url
    };
    if (artistUrl) {
      trackView.artistUrl = artistUrl;
    }
    if (albumUrl) {
      trackView.albumUrl = albumUrl;
    }

    return `bandcamp/${ViewHelper.constructUriSegmentFromView(trackView)}`;
  }
}
