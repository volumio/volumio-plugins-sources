import AlbumEntity from './AlbumEntity';
import TrackEntity from './TrackEntity';
interface ArticleEntity {
    type: 'article';
    url: string;
    title: string;
    date: string;
    thumbnail?: string;
    description?: string;
    category?: {
        name: string;
        url?: string;
    };
    author?: {
        name: string;
        url: string;
    };
    mediaItems?: ArticleEntityMediaItem<AlbumEntity | TrackEntity>[];
    sections?: ArticleEntitySection[];
}
export type ArticleEntityMediaItem<T extends AlbumEntity | TrackEntity> = T & {
    mediaItemRef?: string;
    featuredTrackPosition: number;
};
export type ArticleEntitySection = {
    heading?: {
        text: string;
    };
    text: string;
    mediaItemRef?: string;
};
export default ArticleEntity;
//# sourceMappingURL=ArticleEntity.d.ts.map