import ytmusic from '../../../YTMusicContext';
import { PageElement } from '../../../types';
import Endpoint, { BrowseContinuationEndpoint, BrowseEndpoint, EndpointType, SearchContinuationEndpoint, SearchEndpoint, WatchContinuationEndpoint, WatchEndpoint } from '../../../types/Endpoint';
import { PageContent } from '../../../types/Content';
import { SectionItem } from '../../../types/PageElement';
import EndpointHelper from '../../../util/EndpointHelper';
import GenericViewHandler, { GenericViewBase } from './GenericViewHandler';

export interface SearchView extends GenericViewBase {
  name: 'search';
  query: string;
}

export default class SearchViewHandler extends GenericViewHandler<SearchView> {

  protected getEndpoint(explode: true): WatchEndpoint | BrowseEndpoint | WatchContinuationEndpoint | null;
  protected getEndpoint(explode?: false | undefined): BrowseEndpoint | BrowseContinuationEndpoint | SearchEndpoint | SearchContinuationEndpoint | null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getEndpoint(explode?: boolean | undefined): Endpoint | null {
    const view = this.currentView;
    if (!view.continuation && !view.endpoint) {
      const query = view.query ? view.query.trim() : '';
      if (query) {
        const endpoint: Endpoint = {
          type: EndpointType.Search,
          payload: {
            query
          }
        };
        return endpoint;
      }

      return null;
    }

    return super.getEndpoint();
  }

  protected async getContents(): Promise<PageContent> {
    const contents = await super.getContents();
    const view = this.currentView;

    // There should be no header for search results. We can insert our title here.
    // If viewing continuation results, then the title would be in the continuationBundle.
    if ((!view.continuation || !EndpointHelper.isType(view.continuation.endpoint, EndpointType.SearchContinuation)) && !contents.header) {
      const endpoint = this.getEndpoint();
      if (EndpointHelper.isType(endpoint, EndpointType.Search)) {
        const query = endpoint.payload.query;
        if (query) {
          contents.header = {
            type: 'search',
            title: ytmusic.getI18n('YTMUSIC_SEARCH_TITLE', query)
          };
        }
      }
    }

    if (contents?.sections && !view.continuation) {
      // Extract 'Showing Results For' endpoint item. If it exists, move it to its
      // Own section.
      for (const section of contents.sections) {
        const showingResultsForItem = this.#spliceShowingResultsFor(section);
        if (showingResultsForItem) {
          contents.sections.unshift({
            type: 'section',
            items: showingResultsForItem
          });
          break;
        }
      }
    }

    return contents;
  }

  #spliceShowingResultsFor(section: PageElement.Section): SectionItem[] | null {
    if (!section.items?.length) {
      return null;
    }

    let spliced: SectionItem[] | null = null;
    section.items.some((item, itemIndex) => {
      if (item.type === 'section') {
        spliced = this.#spliceShowingResultsFor(item);
      }
      else if (item.type === 'endpointLink' && item.icon === 'YT2_SHOWING_RESULTS_FOR') {
        spliced = section.items.splice(itemIndex, 1);
      }
      return !!spliced;
    });

    return spliced;
  }
}
