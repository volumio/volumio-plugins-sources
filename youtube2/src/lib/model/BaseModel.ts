import InnertubeLoader from './InnertubeLoader';
import yt2 from '../YouTube2Context';

export abstract class BaseModel {

  protected getInnertube() {
    return InnertubeLoader.getInstance();
  }

  protected async fetchAccountMenu() {
    const { innertube } = await this.getInnertube();

    const requestData = {
      client: 'WEB'
    };

    try {
      const response = await innertube.session.http.fetch('/account/account_menu', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return JSON.parse(await response.text());
    }
    catch (error) {
      yt2.getLogger().error(yt2.getErrorMessage('[youtube2] Error in Model.fetchAccountMenu(): ', error));
      return null;
    }
  }
}
