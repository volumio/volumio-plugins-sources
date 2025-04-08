import { type PageElement } from '../../../types';
import { type PageContent } from '../../../types/Content';
import { type BrowseContinuationEndpoint, type SearchContinuationEndpoint } from '../../../types/Endpoint';
interface View extends Record<string, any> {
    name: string;
    continuation?: Continuation;
    prevContinuations?: Continuation[];
    continuationBundle?: ContinuationBundle;
    limit?: number;
    inSection?: '1';
    noExplode?: '1';
}
export interface Continuation {
    endpoint: BrowseContinuationEndpoint | SearchContinuationEndpoint;
    prevItemCount: number;
}
export interface ContinuationBundle {
    section: {
        title: string | null;
        subtitle: string | null;
        filters: PageElement.Section['filters'] | null;
        buttons: PageElement.Section['buttons'] | null;
        filtersFromParent: boolean;
        buttonsFromParent: boolean;
    };
    contents: {
        header: PageContent['header'] | null;
        tabs: PageContent['tabs'] | null;
    };
}
export default View;
//# sourceMappingURL=View.d.ts.map