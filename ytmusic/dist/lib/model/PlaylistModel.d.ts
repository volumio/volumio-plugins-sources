import { type PageElement } from '../types';
import { type ContentOf } from '../types/Content';
import type Endpoint from '../types/Endpoint';
import { type SectionItem } from '../types/PageElement';
import EndpointModel from './EndpointModel';
export default class PlaylistModel extends EndpointModel {
    #private;
    getContents<T extends Endpoint>(endpoint: T): Promise<ContentOf<T> | null>;
    protected getContinuationItems(continuation: PageElement.Section['continuation'], recursive?: boolean, currentItems?: SectionItem[]): Promise<PageElement.SectionItem[]>;
}
//# sourceMappingURL=PlaylistModel.d.ts.map