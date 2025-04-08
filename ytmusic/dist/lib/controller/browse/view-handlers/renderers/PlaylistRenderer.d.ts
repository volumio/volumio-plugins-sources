import { type ContentItem, type PageElement } from '../../../../types';
import { type PlaylistView } from '../PlaylistViewHandler';
import type View from '../View';
import MusicFolderRenderer from './MusicFolderRenderer';
export default class PlaylistRenderer extends MusicFolderRenderer<ContentItem.Playlist, PageElement.PlaylistHeader> {
    protected getTargetViewForListItem(data: ContentItem.Playlist): PlaylistView | null;
    protected getTargetViewForHeader(data: PageElement.PlaylistHeader): View | null;
    protected getSubtitleForListItem(data: ContentItem.Playlist): string | null | undefined;
    protected getSubtitleForHeader(data: PageElement.PlaylistHeader): string | null | undefined;
}
//# sourceMappingURL=PlaylistRenderer.d.ts.map