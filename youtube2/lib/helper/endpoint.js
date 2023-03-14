'use strict';

const EXCLUDE_ENDPOINT_BROWSE_IDS = [
  'SPreport_history',
  'SPaccount_overview',
  'SPunlimited'
];

class EndpointHelper {

  static validate(endpoint) {
    if (!endpoint || !endpoint.type) {
      return false;
    }

    switch (endpoint.type) {
      case 'browse':
        return !!endpoint.payload?.browseId && !EXCLUDE_ENDPOINT_BROWSE_IDS.includes(endpoint.payload.browseId);

      case 'watch':
        return !!endpoint.payload?.videoId || !!endpoint.payload?.playlistId;

      case 'search':
        return !!endpoint.payload?.query;

      case 'browseContinuation':
      case 'searchContinuation':
        return !!endpoint.payload?.token;

      default:
        return false;
    }
  }
}

module.exports = EndpointHelper;
