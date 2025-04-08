import { type WatchContinuationEndpoint, type WatchEndpoint } from './Endpoint';

interface AutoplayContext {
  fetchEndpoint: WatchEndpoint | WatchContinuationEndpoint;
}

export default AutoplayContext;
