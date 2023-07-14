import bandcamp from '../../../BandcampContext';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import ViewHandlerFactory from './ViewHandlerFactory';

export interface RootView extends View {
  name: 'root';
}

export default class RootViewHandler extends BaseViewHandler<RootView> {

  async browse(): Promise<RenderedPage> {
    const myUsername = bandcamp.getConfigValue('myUsername', null);
    const fetches: Promise<RenderedList[]>[] = myUsername ? [ this.#getFanSummary(myUsername) ] : [];

    fetches.push(
      this.#getArticles(),
      this.#getShows(),
      this.#getDiscoverResults()
    );

    const sectionLists = await Promise.all(fetches);

    const flattenedLists = sectionLists.reduce((result, list) => {
      result.push(...list);
      return result;
    }, []);

    return {
      navigation: {
        prev: { uri: '/' },
        lists: flattenedLists
      }
    };
  }

  #getFanSummary(username: string) {
    return this.#getSectionLists(`${this.uri}/fan@username=${username}`);
  }

  #getArticles() {
    return this.#getSectionLists(`${this.uri}/article@inSection=1`);
  }

  #getShows() {
    return this.#getSectionLists(`${this.uri}/show@inSection=1`);
  }

  #getDiscoverResults() {
    return this.#getSectionLists(`${this.uri}/discover@inSection=1`);
  }

  async #getSectionLists(uri: string) {
    const handler = ViewHandlerFactory.getHandler(uri);
    const page = await handler.browse();
    return page.navigation?.lists || [];
  }
}
