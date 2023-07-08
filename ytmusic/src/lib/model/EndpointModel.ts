import Innertube, { InnertubeEndpoint, Parser } from 'volumio-youtubei.js';
import { BaseModel } from './BaseModel';
import Endpoint, { EndpointType } from '../types/Endpoint';
import InnertubeResultParser from './InnertubeResultParser';
import { ContentOf } from '../types/Content';
import EndpointHelper from '../util/EndpointHelper';

export default class EndpointModel extends BaseModel {

  async getContents<T extends Endpoint>(endpoint: T): Promise<ContentOf<T> | null> {
    const { innertube } = await this.getInnertube();

    if (EndpointHelper.isType(endpoint, EndpointType.Browse, EndpointType.BrowseContinuation)) {
      return this.#doGetContents(innertube, '/browse', endpoint);
    }

    if (EndpointHelper.isType(endpoint, EndpointType.Watch, EndpointType.WatchContinuation)) {
      return this.#doGetContents(innertube, '/next', endpoint);
    }

    if (EndpointHelper.isType(endpoint, EndpointType.Search, EndpointType.SearchContinuation)) {
      return this.#doGetContents(innertube, '/search', endpoint);
    }

    return null;
  }

  async #doGetContents<T extends Endpoint>(innertube: Innertube, url: InnertubeEndpoint, endpoint: T) {
    const payload = {
      ...endpoint.payload,
      client: 'YTMUSIC'
    };
    const response = await innertube.actions.execute(url, payload);
    const parsed = Parser.parseResponse(response.data); // First parse by Innertube
    if (url === '/search' || url === '/browse') {
      await this.expandSectionList(parsed, url);
    }

    return InnertubeResultParser.parseResult(parsed, endpoint); // Second parse
  }
}
