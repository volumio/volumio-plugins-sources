import bandcamp from '../../../BandcampContext';
import { ModelType } from '../../../model';
import BaseViewHandler from './BaseViewHandler';
import View from './View';
import { RenderedList, RenderedPage } from './ViewHandler';
import ViewHandlerFactory from './ViewHandlerFactory';

export interface RootView extends View {
  name: 'root';
}

export default class RootViewHandler extends BaseViewHandler<RootView> {

  async browse(): Promise<RenderedPage> {
    const fetches: Promise<RenderedList[]>[] = [];

    const myBandcampType = bandcamp.getConfigValue('myBandcampType', 'cookie');
    let myUsername: string | null = null;
    if (myBandcampType === 'cookie') {
      const myCookie = bandcamp.getConfigValue('myCookie', '');
      if (myCookie) {
        const fanModel = this.getModel(ModelType.Fan);
        try {
          const myFanInfo = await fanModel.getInfo();
          myUsername = myFanInfo.username;
        }
        catch (error) {
          bandcamp.getLogger().error(`[bandcamp] Error getting fan info by cookie${error instanceof Error ? `: ${error.message}` : '.'}`);
          bandcamp.toast('error', bandcamp.getI18n('BANDCAMP_ERR_MY_FAN_INFO'));
        }
      }
    }
    else if (myBandcampType === 'username') {
      myUsername = bandcamp.getConfigValue('myUsername', '');
    }

    if (myUsername) {
      fetches.push(this.#getFanSummary(myUsername));
    }

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
