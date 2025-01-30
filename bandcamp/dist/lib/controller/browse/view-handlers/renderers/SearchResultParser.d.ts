import type AlbumEntity from '../../../../entities/AlbumEntity';
import type ArtistEntity from '../../../../entities/ArtistEntity';
import type LabelEntity from '../../../../entities/LabelEntity';
import type TrackEntity from '../../../../entities/TrackEntity';
import BaseRenderer, { type RenderedListItem } from './BaseRenderer';
type SearchResultEntity = ArtistEntity | LabelEntity | AlbumEntity | TrackEntity;
export default class SearchResultRenderer extends BaseRenderer<SearchResultEntity> {
    renderToListItem(data: SearchResultEntity): RenderedListItem | null;
}
export {};
//# sourceMappingURL=SearchResultParser.d.ts.map