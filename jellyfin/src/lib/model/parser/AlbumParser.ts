import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { EntityType } from '../../entities';
import Album from '../../entities/Album';
import BaseParser from './BaseParser';

export default class AlbumParser extends BaseParser<Album> {

  async parseDto(data: BaseItemDto, api: Api): Promise<Album | null> {
    const base = await super.parseDto(data, api);
    if (!base) {
      return null;
    }

    const artists = data.ArtistItems?.reduce<Album['artists']>((result, artist) => {
      if (artist.Id && artist.Name) {
        result.push({
          id: artist.Id,
          name: artist.Name
        });
      }
      return result;
    }, []) || [];

    const result: Album = {
      ...base,
      type: EntityType.Album,
      albumArtist: data.AlbumArtist || null,
      artists,
      duration: data.RunTimeTicks ? this.ticksToSeconds(data.RunTimeTicks) : null,
      year: data.ProductionYear || null,
      genres: this.getGenres(data)
    };

    return result;
  }
}
