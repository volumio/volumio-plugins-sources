import { type PageElement } from '../../../types';
import { type PageContent } from '../../../types/Content';
import type Endpoint from '../../../types/Endpoint';

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
  endpoint: Endpoint;
  prevItemCount: number;
}

export interface ContinuationBundle {
  section: {
    title: string | null;
    filters: PageElement.Section['filters'] | null;
    menus: PageElement.Section['menus'] | null;
    buttons: PageElement.Section['buttons'] | null;
  };
  contents: {
    header: PageContent['header'] | null;
    tabs: PageContent['tabs'] | null;
  }
}

export default View;
