import BaseRenderer, { type RenderedHeader, type RenderedListItem } from './BaseRenderer';
import { type ArticleEntityMediaItem } from '../../../../entities/ArticleEntity';
import type ArticleEntity from '../../../../entities/ArticleEntity';
import type TrackEntity from '../../../../entities/TrackEntity';
import type AlbumEntity from '../../../../entities/AlbumEntity';
export default class ArticleRenderer extends BaseRenderer<ArticleEntity> {
    renderToListItem(data: ArticleEntity): RenderedListItem | null;
    renderToHeader(data: ArticleEntity): RenderedHeader | null;
    renderMediaItemTrack(article: ArticleEntity, mediaItem: ArticleEntityMediaItem<AlbumEntity | TrackEntity>, track: TrackEntity): RenderedListItem;
}
//# sourceMappingURL=ArticleRenderer.d.ts.map