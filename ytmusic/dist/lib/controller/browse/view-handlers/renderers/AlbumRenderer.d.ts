import { type ContentItem, type PageElement } from '../../../../types';
import { type AlbumView } from '../AlbumViewHandler';
import type View from '../View';
import MusicFolderRenderer from './MusicFolderRenderer';
export default class AlbumRenderer extends MusicFolderRenderer<ContentItem.Album, PageElement.AlbumHeader> {
    protected getTargetViewForListItem(data: ContentItem.Album): AlbumView | null;
    protected getTargetViewForHeader(data: PageElement.AlbumHeader): View | null;
    protected getSubtitleForListItem(data: ContentItem.Album): string | null | undefined;
    protected getSubtitleForHeader(data: PageElement.AlbumHeader): string | null | undefined;
}
//# sourceMappingURL=AlbumRenderer.d.ts.map