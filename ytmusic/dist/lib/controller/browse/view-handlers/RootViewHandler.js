"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _RootViewHandler_instances, _RootViewHandler_constructUri;
Object.defineProperty(exports, "__esModule", { value: true });
const YTMusicContext_1 = __importDefault(require("../../../YTMusicContext"));
const Endpoint_1 = require("../../../types/Endpoint");
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const ROOT_ENDPOINTS = {
    HOME: 'FEmusic_home',
    EXPLORE: 'FEmusic_explore',
    LIBRARY: 'FEmusic_library_landing',
    HISTORY: 'FEmusic_history'
};
class RootViewHandler extends BaseViewHandler_1.default {
    constructor() {
        super(...arguments);
        _RootViewHandler_instances.add(this);
    }
    async browse() {
        const items = [
            {
                service: 'ytmusic',
                type: 'item-no-menu',
                title: YTMusicContext_1.default.getI18n('YTMUSIC_HOME'),
                uri: __classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_constructUri).call(this, ROOT_ENDPOINTS.HOME),
                icon: 'fa fa-home'
            },
            {
                service: 'ytmusic',
                type: 'item-no-menu',
                title: YTMusicContext_1.default.getI18n('YTMUSIC_EXPLORE'),
                uri: __classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_constructUri).call(this, ROOT_ENDPOINTS.EXPLORE),
                icon: 'fa fa-binoculars'
            },
            {
                service: 'ytmusic',
                type: 'item-no-menu',
                title: YTMusicContext_1.default.getI18n('YTMUSIC_LIBRARY'),
                uri: __classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_constructUri).call(this, ROOT_ENDPOINTS.LIBRARY),
                icon: 'fa fa-bookmark'
            },
            {
                service: 'ytmusic',
                type: 'item-no-menu',
                title: YTMusicContext_1.default.getI18n('YTMUSIC_HISTORY'),
                uri: __classPrivateFieldGet(this, _RootViewHandler_instances, "m", _RootViewHandler_constructUri).call(this, ROOT_ENDPOINTS.HISTORY),
                icon: 'fa fa-history'
            }
        ];
        return {
            navigation: {
                prev: { uri: '/' },
                lists: [
                    {
                        title: 'YouTube Music',
                        availableListViews: ['list', 'grid'],
                        items
                    }
                ]
            }
        };
    }
}
exports.default = RootViewHandler;
_RootViewHandler_instances = new WeakSet(), _RootViewHandler_constructUri = function _RootViewHandler_constructUri(browseId) {
    const endpoint = {
        type: Endpoint_1.EndpointType.Browse,
        payload: {
            browseId
        }
    };
    const targetView = {
        name: 'generic',
        endpoint
    };
    return `ytmusic/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`;
};
//# sourceMappingURL=RootViewHandler.js.map