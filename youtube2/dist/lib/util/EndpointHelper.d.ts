import { type EndpointOf } from '../types/Endpoint';
import type Endpoint from '../types/Endpoint';
import { EndpointType } from '../types/Endpoint';
export default class EndpointHelper {
    static validate(endpoint?: Endpoint): boolean;
    static isType<K extends EndpointType[]>(endpoint: Endpoint | null | undefined, ...types: K): endpoint is EndpointOf<K[number]>;
}
//# sourceMappingURL=EndpointHelper.d.ts.map