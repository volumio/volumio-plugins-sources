import Endpoint, { EndpointOf, EndpointType } from '../types/Endpoint';

const EXCLUDE_ENDPOINT_BROWSE_IDS = [
  'SPreport_history',
  'SPaccount_overview',
  'SPunlimited'
];

export default class EndpointHelper {

  static validate(endpoint?: Endpoint): boolean {
    if (!endpoint?.type) {
      return false;
    }

    switch (endpoint.type) {
      case EndpointType.Browse:
        return !!endpoint.payload?.browseId && !EXCLUDE_ENDPOINT_BROWSE_IDS.includes(endpoint.payload.browseId);

      case EndpointType.Watch:
        return !!endpoint.payload?.videoId || !!endpoint.payload?.playlistId;

      case EndpointType.Search:
        return !!endpoint.payload?.query;

      case EndpointType.BrowseContinuation:
      case EndpointType.SearchContinuation:
        return !!endpoint.payload?.token;

      default:
        return false;
    }
  }

  static isType<K extends EndpointType[]>(endpoint: Endpoint | null | undefined, ...types: K): endpoint is EndpointOf<K[number]> {
    if (!endpoint) {
      return false;
    }
    return types.some((t) => endpoint.type === t);
  }
}
