import yt2 from '../YouTube2Context';
import { PageElement } from '../types';
import Endpoint, { EndpointType } from '../types/Endpoint';
import PageContent from '../types/PageContent';
import { SectionItem } from '../types/PageElement';
import WatchContent, { WatchContinuationContent } from '../types/WatchContent';
import { rnd, sleep } from '../util';
import EndpointModel from './EndpointModel';

export default class PlaylistModel extends EndpointModel {

  async getContents(endpoint: Endpoint & { type: EndpointType.Watch; }): Promise<WatchContent | null>;
  async getContents(endpoint: Endpoint & { type: EndpointType.WatchContinuation; }): Promise<WatchContinuationContent | null>;
  async getContents(endpoint: Endpoint & { type: EndpointType.Browse | EndpointType.Search | EndpointType.BrowseContinuation | EndpointType.SearchContinuation; }): Promise<PageContent | null>;
  async getContents(endpoint: Endpoint & { type: EndpointType; }): Promise<WatchContent | PageContent | null>;
  async getContents(endpoint: Endpoint): Promise<WatchContent | WatchContinuationContent | PageContent | null> {
    if (endpoint.type !== EndpointType.Browse && endpoint.type !== EndpointType.BrowseContinuation) {
      throw Error(`PlaylistModel.getContents() expects endpoint type Browse or BrowseContinuation, but got ${endpoint.type}`);
    }

    const contents = await super.getContents({...endpoint, type: endpoint.type});
    const loadAll = yt2.getConfigValue('loadFullPlaylists');
    if (!loadAll || !contents) {
      return contents;
    }

    // Look for section with continuation - there should only be one, if any.
    const targetSection = this.#findSectionWithContinuation(contents.sections);
    if (targetSection?.continuation) {
      yt2.getLogger().info(`[youtube2] PlaylistModel is going to recursively fetch continuation items for playlist with endpoint: ${JSON.stringify(endpoint)}).`);
      const continuationItems = await this.#getContinuationItems(targetSection.continuation);
      targetSection.items.push(...continuationItems);
      yt2.getLogger().info(`[youtube2] Total ${continuationItems.length} continuation items fetched. Total items in playlist: ${targetSection.items.length}.`);
      delete targetSection.continuation;
    }

    return contents;
  }

  async #getContinuationItems(continuation: PageElement.Section['continuation'], recursive = true, currentItems: SectionItem[] = []) {
    if (!continuation) {
      return [];
    }

    const contents = await this.getContents({...continuation.endpoint, type: EndpointType.BrowseContinuation});

    // There should only be one section for playlist continuation items
    const targetSection = contents?.sections?.[0];
    if (targetSection?.items) {
      currentItems.push(...targetSection.items);

      yt2.getLogger().info(`[youtube2] Fetched ${targetSection.items.length} continuation items.`);

      if (recursive && targetSection.continuation) {
        await sleep(rnd(200, 400)); // Rate limit
        await this.#getContinuationItems(targetSection.continuation, recursive, currentItems);
        delete targetSection.continuation;
      }
    }

    return currentItems;
  }

  #findSectionWithContinuation(sections?: PageElement.Section[]): PageElement.Section | null {
    if (!sections) {
      return null;
    }

    for (const section of sections) {
      if (section.continuation) {
        return section;
      }

      const nestedSections = section.items?.filter((item) => item.type === 'section');
      if (nestedSections?.length > 0) {
        const result = this.#findSectionWithContinuation(nestedSections as PageElement.Section[]);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }
}
