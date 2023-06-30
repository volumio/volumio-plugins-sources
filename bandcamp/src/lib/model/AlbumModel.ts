import bcfetch, { Album } from 'bandcamp-fetch';
import bandcamp from '../BandcampContext';
import BaseModel from './BaseModel';
import AlbumEntity from '../entities/AlbumEntity';
import EntityConverter from '../util/EntityConverter';

export default class AlbumModel extends BaseModel {

  async getAlbum(albumUrl: string): Promise<AlbumEntity> {
    const queryParams = {
      albumUrl,
      albumImageFormat: this.getAlbumImageFormat(),
      artistImageFormat: this.getArtistImageFormat(),
      includeRawData: false
    };
    const album = await bandcamp.getCache().getOrSet(
      this.getCacheKeyForFetch('album', queryParams),
      () => bcfetch.limiter.album.getInfo(queryParams));

    const albumEntity = this.#converFetchedAlbumToEntity(album);

    this.#cacheTracks(albumEntity.tracks);

    return albumEntity;
  }

  #cacheTracks(tracks: Album['tracks']) {
    if (!tracks) {
      return;
    }
    tracks.forEach((track) => {
      if (track.url) {
        bandcamp.getCache().put(this.getCacheKeyForFetch('track', { trackUrl: track.url }), track);
      }
    });
  }

  #converFetchedAlbumToEntity(item: Album): AlbumEntity {
    return EntityConverter.convertAlbum(item);
  }
}
