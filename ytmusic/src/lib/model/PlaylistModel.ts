import ytmusic from '../YTMusicContext';
import { PageElement } from '../types';
import { ContentOf } from '../types/Content';
import Endpoint, { EndpointType } from '../types/Endpoint';
import { SectionItem } from '../types/PageElement';
import { rnd, sleep } from '../util';
import EndpointHelper from '../util/EndpointHelper';
import EndpointModel from './EndpointModel';

export default class PlaylistModel extends EndpointModel {

  async getContents<T extends Endpoint>(endpoint: T): Promise<ContentOf<T> | null> {
    if (!EndpointHelper.isType(endpoint, EndpointType.Browse, EndpointType.BrowseContinuation)) {
      throw Error(`PlaylistModel.getContents() expects endpoint type Browse or BrowseContinuation, but got ${endpoint?.type}`);
    }

    const contents = await super.getContents(endpoint);
    const loadAll = ytmusic.getConfigValue('loadFullPlaylists');
    if (!loadAll || !contents) {
      return contents;
    }

    // Look for section with continuation - there should only be one, if any.
    const targetSection = this.#findPlaylistContentSection(contents.sections);
    if (targetSection?.continuation) {
      ytmusic.getLogger().info(`[ytmusic] PlaylistModel is going to recursively fetch continuation items for playlist with endpoint: ${JSON.stringify(endpoint)}).`);
      const continuationItems = await this.getContinuationItems(targetSection.continuation);
      targetSection.items.push(...continuationItems);
      ytmusic.getLogger().info(`[ytmusic] Total ${continuationItems.length} continuation items fetched. Total items in playlist: ${targetSection.items.length}.`);
      delete targetSection.continuation;
    }

    return contents;
  }

  // Do not set this method as private - tsc will down-level `super.getContents()` to wrong JS syntax.
  protected async getContinuationItems(continuation: PageElement.Section['continuation'], recursive = true, currentItems: SectionItem[] = []) {
    if (!continuation) {
      return [];
    }

    const contents = await super.getContents(continuation.endpoint);

    // There should only be one section for playlist continuation items
    const targetSection = contents?.sections?.[0];
    if (targetSection?.items && targetSection.items.length > 0) {
      currentItems.push(...targetSection.items);

      ytmusic.getLogger().info(`[ytmusic] Fetched ${targetSection.items.length} continuation items.`);

      if (recursive && targetSection.continuation) {
        await sleep(rnd(200, 400)); // Rate limit
        await this.getContinuationItems(targetSection.continuation, recursive, currentItems);
        delete targetSection.continuation;
      }
    }

    return currentItems;
  }

  #findPlaylistContentSection(sections?: PageElement.Section[]): PageElement.Section | null {
    if (!sections) {
      return null;
    }

    for (const section of sections) {
      if (section.playlistId) {
        return section;
      }

      const nestedSections = section.items?.filter((item) => item.type === 'section');
      if (nestedSections?.length > 0) {
        const result = this.#findPlaylistContentSection(nestedSections as PageElement.Section[]);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }
}
