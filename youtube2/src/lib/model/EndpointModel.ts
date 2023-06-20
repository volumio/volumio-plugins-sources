import { InnertubeEndpoint, Parser } from 'volumio-youtubei.js';
import { BaseModel } from './BaseModel';
import Endpoint, { EndpointType } from '../types/Endpoint';
import InnertubeResultParser from './InnertubeResultParser';
import WatchContent, { WatchContinuationContent } from '../types/WatchContent';
import PageContent from '../types/PageContent';

export default class EndpointModel extends BaseModel {

  async getContents(endpoint: Endpoint & {type: EndpointType.Watch}): Promise<WatchContent | null>;
  async getContents(endpoint: Endpoint & {type: EndpointType.WatchContinuation}): Promise<WatchContinuationContent | null>;
  async getContents(endpoint: Endpoint & {type: EndpointType.Browse | EndpointType.BrowseContinuation | EndpointType.Search | EndpointType.SearchContinuation}): Promise<PageContent | null>;
  async getContents(endpoint: Endpoint & {type: EndpointType}): Promise<PageContent | WatchContent | null>;
  async getContents(endpoint: Endpoint) {
    const innertube = this.getInnertube();

    let url: InnertubeEndpoint | null;
    switch (endpoint?.type) {
      case EndpointType.Browse:
      case EndpointType.BrowseContinuation:
        url = '/browse';
        break;
      case EndpointType.Watch:
      case EndpointType.WatchContinuation:
        url = '/next';
        break;
      case EndpointType.Search:
      case EndpointType.SearchContinuation:
        url = '/search';
        break;
      default:
        url = null;
    }

    if (url && innertube) {
      const response = await innertube.actions.execute(url, endpoint.payload);
      const parsed = Parser.parseResponse(response.data); // First parse by InnerTube
      return InnertubeResultParser.parseResult(parsed, endpoint.type); // Second parse
    }

    return null;
  }
}
