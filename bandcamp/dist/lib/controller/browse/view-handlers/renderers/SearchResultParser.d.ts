import AlbumEntity from '../../../../entities/AlbumEntity';
import ArtistEntity from '../../../../entities/ArtistEntity';
import LabelEntity from '../../../../entities/LabelEntity';
import TrackEntity from '../../../../entities/TrackEntity';
import BaseRenderer, { RenderedListItem } from './BaseRenderer';
type SearchResultEntity = ArtistEntity | LabelEntity | AlbumEntity | TrackEntity;
export default class SearchResultRenderer extends BaseRenderer<SearchResultEntity> {
    renderToListItem(data: SearchResultEntity): RenderedListItem | null;
}
export {};
//# sourceMappingURL=SearchResultParser.d.ts.map