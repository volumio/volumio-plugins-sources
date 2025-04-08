import { type ContentItem, type PageElement } from '../../../../types';
import { type PodcastView } from '../PodcastViewHandler';
import type View from '../View';
import MusicFolderRenderer from './MusicFolderRenderer';
export default class PodcastRenderer extends MusicFolderRenderer<ContentItem.Podcast, PageElement.PodcastHeader> {
    protected getTargetViewForListItem(data: ContentItem.Podcast): PodcastView | null;
    protected getTargetViewForHeader(data: PageElement.PodcastHeader): View | null;
    protected getSubtitleForListItem(data: ContentItem.Podcast): string | null | undefined;
    protected getSubtitleForHeader(data: PageElement.PodcastHeader): string | null | undefined;
}
//# sourceMappingURL=PodcastRenderer.d.ts.map