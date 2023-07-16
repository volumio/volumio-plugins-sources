import bcfetch, { Track } from 'bandcamp-fetch';
import bandcamp from '../BandcampContext';
import BaseModel from './BaseModel';
import TrackEntity from '../entities/TrackEntity';
import EntityConverter from '../util/EntityConverter';

export default class TrackModel extends BaseModel {

  getTrack(trackUrl: string) {
    // Unlike other resources, tracks are converted to TrackEntitys
    // Before being cached. See also AlbumModel#getAlbum(), where we
    // Cache an album's tracks that have been converted to entities.
    return bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('track', { trackUrl }),
      () => this.#doGetTrack(trackUrl));
  }

  async #doGetTrack(trackUrl: string) {
    const queryParams = {
      trackUrl,
      albumImageFormat: this.getAlbumImageFormat(),
      artistImageFormat: this.getArtistImageFormat(),
      includeRawData: false
    };
    const trackInfo = await bcfetch.limiter.track.getInfo(queryParams);

    return this.#convertFetchedTrackToEntity(trackInfo);
  }

  #convertFetchedTrackToEntity(item: Track): TrackEntity {
    return EntityConverter.convertTrack(item);
  }
}
