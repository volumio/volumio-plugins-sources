import Endpoint, { BrowseEndpoint, EndpointOf, EndpointType } from '../types/Endpoint';
export default class EndpointHelper {
    static validate(endpoint?: Endpoint): boolean;
    static isType<K extends EndpointType[]>(endpoint: Endpoint | null | undefined, ...types: K): endpoint is EndpointOf<K[number]>;
    static isChannelEndpoint(endpoint?: Endpoint | null): endpoint is BrowseEndpoint;
    static isAlbumEndpoint(endpoint?: Endpoint | null): endpoint is BrowseEndpoint;
}
//# sourceMappingURL=EndpointHelper.d.ts.map