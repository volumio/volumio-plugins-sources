import { Album, Article, ArticleListItem, Artist, Label, LabelArtist, SearchResultAlbum, SearchResultArtist, SearchResultLabel, SearchResultTrack, Show, Tag, Track, UserKind } from 'bandcamp-fetch';
import AlbumEntity from '../entities/AlbumEntity';
import ArtistEntity from '../entities/ArtistEntity';
import BandEntity from '../entities/BandEntity';
import LabelEntity from '../entities/LabelEntity';
import TrackEntity from '../entities/TrackEntity';
import TagEntity from '../entities/TagEntity';
import ShowEntity from '../entities/ShowEntity';
import ArticleEntity from '../entities/ArticleEntity';
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