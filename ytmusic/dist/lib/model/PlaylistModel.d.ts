import { PageElement } from '../types';
import { ContentOf } from '../types/Content';
import Endpoint from '../types/Endpoint';
import { SectionItem } from '../types/PageElement';
import EndpointModel from './EndpointModel';
export default class PlaylistModel extends EndpointModel {
    #private;
    getContents<T extends Endpoint>(endpoint: T): Promise<ContentOf<T> | null>;
    protected getContinuationItems(continuation: PageElement.Section['continuation'], recursive?: boolean, currentItems?: SectionItem[]): Promise<PageElement.SectionItem[]>;
}
//# sourceMappingURL=PlaylistModel.d.ts.map