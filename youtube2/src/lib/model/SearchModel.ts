import { EndpointType } from '../types/Endpoint';
import EndpointModel from './EndpointModel';

export default class SearchModel extends EndpointModel {

  getSearchResultsByQuery(query: string) {
    const endpoint = {
      type: EndpointType.Search,
      payload: {
        query
      }
    };
    return this.getContents(endpoint);
  }
}
