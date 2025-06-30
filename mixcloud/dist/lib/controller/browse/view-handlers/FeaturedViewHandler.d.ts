import { DiscoverType } from '../../../model/DiscoverModel';
import { SlugEntity } from '../../../entities/SlugEntity';
import DiscoverViewHandler, { DiscoverView } from './DiscoverViewHandler';
export type FeaturedView = DiscoverView<'featured'>;
export default class FeaturedViewHandler extends DiscoverViewHandler<'featured'> {
    protected getListType(): DiscoverType;
    protected getTitle(selectedTags: SlugEntity[]): string;
    getSwitchViewLinkData(selectedTags: SlugEntity[]): {
        uri: string;
        text: string;
    };
}
//# sourceMappingURL=FeaturedViewHandler.d.ts.map