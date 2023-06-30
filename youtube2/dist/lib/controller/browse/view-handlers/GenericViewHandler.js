"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const YouTube2Context_1 = __importDefault(require("../../../YouTube2Context"));
const model_1 = require("../../../model");
const Endpoint_1 = require("../../../types/Endpoint");
const Auth_1 = __importStar(require("../../../util/Auth"));
const ExplodeHelper_1 = __importDefault(require("../../../util/ExplodeHelper"));
const FeedViewHandler_1 = __importDefault(require("./FeedViewHandler"));
// From InnerTube lib (YouTube.js#Actions)
const REQUIRES_SIGNIN_BROWSE_IDS = [
    'FElibrary',
    'FEhistory',
    'FEsubscriptions',
    'FEchannels',
    'FEmusic_listening_review',
    'FEmusic_library_landing',
    'SPaccount_overview',
    'SPaccount_notifications',
    'SPaccount_privacy',
    'SPtime_watched'
];
/**
 * Generic view handler. Contents fetched from endpoint with the EndpointModel.
 */
class GenericViewHandler extends FeedViewHandler_1.default {
    async browse() {
        const endpoint = this.getEndpoint();
        if (endpoint?.type === Endpoint_1.EndpointType.Browse &&
            REQUIRES_SIGNIN_BROWSE_IDS.includes(endpoint.payload.browseId) &&
            Auth_1.default.getAuthStatus().status !== Auth_1.AuthStatus.SignedIn) {
            YouTube2Context_1.default.toast('error', YouTube2Context_1.default.getI18n('YOUTUBE2_ERR_REQUIRE_SIGN_IN'));
            throw Error(YouTube2Context_1.default.getI18n('YOUTUBE2_ERR_REQUIRE_SIGN_IN'));
        }
        return super.browse();
    }
    async getContents() {
        const endpoint = this.assertEndpointExists(this.getEndpoint());
        const contents = await this.getModel(model_1.ModelType.Endpoint).getContents(endpoint);
        return this.assertPageContents(contents);
    }
    assertEndpointExists(endpoint) {
        if (!endpoint) {
            YouTube2Context_1.default.toast('error', YouTube2Context_1.default.getI18n('YOUTUBE2_ERR_ENDPOINT_INVALID'));
            throw Error(YouTube2Context_1.default.getI18n('YOUTUBE2_ERR_ENDPOINT_INVALID'));
        }
        return endpoint;
    }
    assertPageContents(content) {
        if (content?.type !== 'page') {
            YouTube2Context_1.default.toast('error', YouTube2Context_1.default.getI18n('YOUTUBE2_ERR_ENDPOINT_INVALID'));
            throw Error(`Expecting page contents, but got ${content?.type}`);
        }
        return content;
    }
    async getTracksOnExplode() {
        const endpoint = this.getEndpoint(true);
        if (!endpoint || !endpoint.payload) {
            YouTube2Context_1.default.toast('error', YouTube2Context_1.default.getI18n('YOUTUBE2_ERR_OP_NOT_SUPPORTED'));
            throw Error(YouTube2Context_1.default.getI18n('YOUTUBE2_ERR_OP_NOT_SUPPORTED'));
        }
        const endpointPredicate = (endpoint) => endpoint.type === Endpoint_1.EndpointType.Watch && endpoint.payload?.playlistId;
        const model = this.getModel(model_1.ModelType.Endpoint);
        let targetWatchEndpoint = null;
        if (endpoint.type === Endpoint_1.EndpointType.Browse) {
            let contents = await model.getContents({ ...endpoint, type: endpoint.type });
            let tabs = contents?.tabs || [];
            if (tabs.length > 0) {
                // Remaining tabs that can be used to look for watch endpoints
                tabs = tabs.filter((tab) => !tab.selected && tab.endpoint?.type === Endpoint_1.EndpointType.Browse);
            }
            while (!targetWatchEndpoint) {
                targetWatchEndpoint = this.findAllEndpointsInSection(contents?.sections, endpointPredicate)[0];
                if (!targetWatchEndpoint) {
                    const nextTab = tabs.shift();
                    if (nextTab?.endpoint.type === Endpoint_1.EndpointType.Browse) {
                        contents = await model.getContents({ ...nextTab.endpoint, type: endpoint.type });
                    }
                    else {
                        break;
                    }
                }
            }
        }
        else if (endpointPredicate(endpoint)) {
            targetWatchEndpoint = endpoint;
        }
        if (!targetWatchEndpoint) {
            YouTube2Context_1.default.toast('error', YouTube2Context_1.default.getI18n('YOUTUBE2_ERR_NO_PLAYABLE_ITEMS_FOUND'));
            throw Error('No playable items found');
        }
        const contents = await model.getContents({ ...targetWatchEndpoint, type: Endpoint_1.EndpointType.Watch });
        const result = contents?.playlist?.items?.filter((item) => item.type === 'video')
            .map((item) => ExplodeHelper_1.default.getExplodedTrackInfoFromVideo(item)) || [];
        return result;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getEndpoint(explode = false) {
        const view = this.currentView;
        if (view.continuation) {
            return view.continuation.endpoint;
        }
        return view.endpoint || null;
    }
}
exports.default = GenericViewHandler;
//# sourceMappingURL=GenericViewHandler.js.map