import BaseRenderer, { RenderedHeader, RenderedListItem } from './BaseRenderer';
import ArticleEntity, { ArticleEntityMediaItem } from '../../../../entities/ArticleEntity';
import TrackEntity from '../../../../entities/TrackEntity';
import AlbumEntity from '../../../../entities/AlbumEntity';
export default class ArticleRenderer extends BaseRenderer<ArticleEntity> {
    renderToListItem(data: ArticleEntity): RenderedListItem | null;
    renderToHeader(data: ArticleEntity): RenderedHeader | null;
    renderMediaItemTrack(article: ArticleEntity, mediaItem: ArticleEntityMediaItem<AlbumEntity | TrackEntity>, track: TrackEntity): RenderedListItem;
}
//# sourceMappingURL=ArticleRenderer.d.ts.map