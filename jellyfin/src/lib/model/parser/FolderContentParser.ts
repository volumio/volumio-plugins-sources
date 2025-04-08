import { Api } from '@jellyfin/sdk';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { EntityType } from '../../entities';
import Album from '../../entities/Album';
import Artist from '../../entities/Artist';
import Folder from '../../entities/Folder';
import AlbumParser from './AlbumParser';
import ArtistParser from './ArtistParser';
import BaseParser from './BaseParser';
import FolderParser from './FolderParser';
import Parser from './Parser';

export type FolderContentType = Artist | Album | Folder;

export default class FolderContentParser extends BaseParser<FolderContentType> {
  #parsers: {[k in BaseItemKind]?: Parser<FolderContentType>};

  constructor() {
    super();
    this.#parsers = {};
  }

  getParser(dtoType: BaseItemKind): Parser<FolderContentType> | null {
    if (!this.#parsers[dtoType]) {
      switch (dtoType) {
        case BaseItemKind.Folder:
        case BaseItemKind.CollectionFolder:
          this.#parsers[dtoType] = new FolderParser();
          break;
        case BaseItemKind.MusicAlbum:
          this.#parsers[dtoType] = new AlbumParser();
          break;
        case BaseItemKind.MusicArtist:
          this.#parsers[dtoType] = new ArtistParser(EntityType.Artist);
          break;
        default:
          return null;
      }
    }
    return this.#parsers[dtoType] || null;
  }

  async parseDto(data: BaseItemDto, api: Api): Promise<FolderContentType | null> {
    const parser = data.Type ? this.getParser(data.Type) : null;
    if (!parser) {
      return null;
    }
    return parser.parseDto(data, api);
  }
}
