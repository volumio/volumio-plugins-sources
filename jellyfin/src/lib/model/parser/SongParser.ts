import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { EntityType } from '../../entities';
import Song from '../../entities/Song';
import BaseParser from './BaseParser';

export default class SongParser extends BaseParser<Song> {

  async parseDto(data: BaseItemDto, api: Api): Promise<Song | null> {
    const base = await super.parseDto(data, api);
    if (!base) {
      return null;
    }

    const artists: Song['artists'] = data.ArtistItems?.map((artist) => ({
      id: artist.Id,
      name: artist.Name
    }) as any).filter((artist) => artist.id && artist.name) || [];

    let albumThumbnail = null;
    if (data.AlbumId && data.AlbumPrimaryImageTag) {
      const albumThumbnailData = {
        Id: data.AlbumId,
        ImageTags: {
          Primary: data.AlbumPrimaryImageTag
        }
      };
      albumThumbnail = await super.getThumbnailUrl(albumThumbnailData, api);
    }

    const album = data.Album && data.AlbumId ? {
      id: data.AlbumId,
      name: data.Album,
      thumbnail: albumThumbnail
    } : null;

    const result: Song = {
      ...base,
      type: EntityType.Song,
      artists,
      album,
      duration: data.RunTimeTicks ? this.ticksToSeconds(data.RunTimeTicks) : 0,
      favorite: !!data.UserData?.IsFavorite
    };

    if (data.MediaSources) {
      result.mediaSources = data.MediaSources;
    }

    if (!result.thumbnail && albumThumbnail) {
      result.thumbnail = albumThumbnail;
    }

    return result;
  }
}
