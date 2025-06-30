import { ArtistsApi } from '@jellyfin/sdk/lib/generated-client/api/artists-api';
import { getArtistsApi } from '@jellyfin/sdk/lib/utils/api/artists-api';
import { EntityType } from '../entities';
import Artist from '../entities/Artist';
import { GetItemsParams, GetItemsResult } from './BaseModel';
import { default as BaseModel } from './BaseModel';
import ArtistParser from './parser/ArtistParser';

export default class ArtistModel extends BaseModel {

  async getArtists(params: GetItemsParams): Promise<GetItemsResult<Artist>> {
    const parser = new ArtistParser(EntityType.Artist);
    return this.getItemsFromAPI<Artist, ArtistsApi>(params, parser, {
      getApi: (api) => getArtistsApi(api),
      getItems: 'getArtists'
    });
  }

  getArtist(id: string) {
    const parser = new ArtistParser(EntityType.Artist);
    return this.getItemFromApi({ itemId: id }, parser);
  }

  async getAlbumArtists(params: GetItemsParams): Promise<GetItemsResult<Artist>> {
    const parser = new ArtistParser(EntityType.AlbumArtist);
    return this.getItemsFromAPI<Artist, ArtistsApi>(params, parser, {
      getApi: (api) => getArtistsApi(api),
      getItems: 'getAlbumArtists'
    });
  }

  getAlbumArtist(id: string) {
    const parser = new ArtistParser(EntityType.AlbumArtist);
    return this.getItemFromApi({ itemId: id }, parser);
  }
}
