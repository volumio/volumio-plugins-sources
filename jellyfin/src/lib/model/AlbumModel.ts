import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { EntityType } from '../entities';
import Album from '../entities/Album';
import BaseModel, { GetItemsParams, GetItemsResult } from './BaseModel';
import AlbumParser from './parser/AlbumParser';

export interface GetSimilarAlbumsParams {
  album: Album,
  limit?: number
}

export default class AlbumModel extends BaseModel {

  getAlbums(params: GetItemsParams): Promise<GetItemsResult<Album>> {
    const parser = new AlbumParser();
    return this.getItemsFromAPI<Album>({ ...params, itemTypes: EntityType.Album }, parser);
  }

  getAlbum(id: string) {
    const parser = new AlbumParser();
    return this.getItemFromApi({ itemId: id }, parser);
  }

  async getSimilarAlbums(params: GetSimilarAlbumsParams): Promise<Album[]> {
    if (!this.connection.auth?.User?.Id) {
      throw Error('No auth');
    }
    const parser = new AlbumParser();
    const libraryApi = getLibraryApi(this.connection.api);
    const response = await libraryApi.getSimilarAlbums({
      itemId: params.album.id,
      userId: this.connection.auth.User.Id,
      excludeArtistIds: params.album.artists.map((artist) => artist.id),
      limit: params.limit || 12
    });
    return this.parseItemDtos(response.data.Items || [], parser);
  }
}
