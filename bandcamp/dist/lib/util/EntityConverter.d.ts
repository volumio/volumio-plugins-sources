import { type Album, type Article, type ArticleListItem, type Artist, type Label, type LabelArtist, type SearchResultAlbum, type SearchResultArtist, type SearchResultLabel, type SearchResultTrack, type Show, type Tag, type Track, type UserKind } from 'bandcamp-fetch';
import type AlbumEntity from '../entities/AlbumEntity';
import type ArtistEntity from '../entities/ArtistEntity';
import type BandEntity from '../entities/BandEntity';
import type LabelEntity from '../entities/LabelEntity';
import type TrackEntity from '../entities/TrackEntity';
import type TagEntity from '../entities/TagEntity';
import type ShowEntity from '../entities/ShowEntity';
import type ArticleEntity from '../entities/ArticleEntity';
export default class EntityConverter {
    static convertAlbum(data: Album): AlbumEntity;
    static convertArtist(data: Artist | LabelArtist): ArtistEntity;
    static convertLabel(data: Label): LabelEntity;
    static convertTrack(data: Track): TrackEntity;
    static convertSearchResultItem(item: SearchResultArtist | SearchResultLabel | SearchResultAlbum | SearchResultTrack): ArtistEntity | LabelEntity | AlbumEntity | TrackEntity;
    static convertShow(data: Show): ShowEntity;
    static convertBand(data: Artist | Label | UserKind): BandEntity;
    static convertTag(data: Tag): TagEntity;
    static convertArticle(data: Article): ArticleEntity;
    static convertArticleListItem(data: ArticleListItem): ArticleEntity;
}
//# sourceMappingURL=EntityConverter.d.ts.map