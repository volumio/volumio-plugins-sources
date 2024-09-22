"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Endpoint_1 = require("../types/Endpoint");
const EXCLUDE_ENDPOINT_BROWSE_IDS = [
    'SPreport_history',
    'SPaccount_overview',
    'SPunlimited'
];
class EndpointHelper {
    static validate(endpoint) {
        if (!endpoint?.type) {
            return false;
        }
        switch (endpoint.type) {
            case Endpoint_1.EndpointType.Browse:
                return !!endpoint.payload?.browseId && !EXCLUDE_ENDPOINT_BROWSE_IDS.includes(endpoint.payload.browseId);
            case Endpoint_1.EndpointType.Watch:
                return !!endpoint.payload?.videoId || !!endpoint.payload?.playlistId;
            case Endpoint_1.EndpointType.Search:
                return !!endpoint.payload?.query;
            case Endpoint_1.EndpointType.BrowseContinuation:
            case Endpoint_1.EndpointType.SearchContinuation:
                return !!endpoint.payload?.token;
            default:
                return false;
        }
    }
    static isType(endpoint, ...types) {
        if (!endpoint) {
            return false;
        }
        return types.some((t) => endpoint.type === t);
    }
    static isChannelEndpoint(endpoint) {
        if (!this.isType(endpoint, Endpoint_1.EndpointType.Browse)) {
            return false;
        }
        return endpoint.payload.browseId.startsWith('UC') ||
            endpoint.payload.browseId.startsWith('FEmusic_library_privately_owned_artist');
    }
    static isAlbumEndpoint(endpoint) {
        if (!this.isType(endpoint, Endpoint_1.EndpointType.Browse)) {
            return false;
        }
        return endpoint.payload.browseId.startsWith('MPR') ||
            endpoint.payload.browseId.startsWith('FEmusic_library_privately_owned_release');
    }
}
exports.default = EndpointHelper;
//# sourceMappingURL=EndpointHelper.js.map