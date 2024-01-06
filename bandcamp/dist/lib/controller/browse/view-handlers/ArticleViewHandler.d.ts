import TrackEntity from '../../../entities/TrackEntity';
import View from './View';
import { RenderedPage } from './ViewHandler';
import ExplodableViewHandler from './ExplodableViewHandler';
export interface ArticleView extends View {
    name: 'article';
    articleUrl?: string;
    select?: boolean;
    categoryUrl?: string;
    mediaItemRef?: string;
    track?: string;
}
interface ArticleMediaItemExplodeTrack extends TrackEntity {
    articleUrl: string;
    mediaItemRef?: string;
}
export default class ArticleViewHandler extends ExplodableViewHandler<ArticleView> {
    #private;
    browse(): Promise<RenderedPage>;
    getTracksOnExplode(): Promise<ArticleMediaItemExplodeTrack | ArticleMediaItemExplodeTrack[]>;
    /**
     * Override
     *
     * Track uri:
     * bandcamp/articles@articleUrl={articleUrl}@mediaItemRef={...}@track={trackPosition}@artistUrl={...}@albumUrl={...}
     */
    protected getTrackUri(track: ArticleMediaItemExplodeTrack): string | null;
}
export {};
//# sourceMappingURL=ArticleViewHandler.d.ts.map