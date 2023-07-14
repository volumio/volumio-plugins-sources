"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _TrackViewHandler_instances, _TrackViewHandler_browseTrack;
Object.defineProperty(exports, "__esModule", { value: true });
const BandcampContext_1 = __importDefault(require("../../../BandcampContext"));
const model_1 = require("../../../model");
const UIHelper_1 = __importDefault(require("../../../util/UIHelper"));
const ExplodableViewHandler_1 = __importDefault(require("./ExplodableViewHandler"));
const ViewHandlerFactory_1 = __importDefault(require("./ViewHandlerFactory"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const renderers_1 = require("./renderers");
class TrackViewHandler extends ExplodableViewHandler_1.default {
    constructor() {
        super(...arguments);
        _TrackViewHandler_instances.add(this);
    }
    async browse() {
        const trackUrl = this.currentView.trackUrl;
        if (!trackUrl) {
            throw Error('Track URL missing');
        }
        return __classPrivateFieldGet(this, _TrackViewHandler_instances, "m", _TrackViewHandler_browseTrack).call(this, trackUrl);
    }
    getTracksOnExplode() {
        const trackUrl = this.currentView.trackUrl;
        if (!trackUrl) {
            throw Error('Track URL missing');
        }
        return this.getModel(model_1.ModelType.Track).getTrack(trackUrl);
    }
}
exports.default = TrackViewHandler;
_TrackViewHandler_instances = new WeakSet(), _TrackViewHandler_browseTrack = async function _TrackViewHandler_browseTrack(trackUrl) {
    const trackInfo = await this.getModel(model_1.ModelType.Track).getTrack(trackUrl);
    if (trackInfo.album?.url) {
        const albumView = {
            name: 'album',
            albumUrl: trackInfo.album.url
        };
        const albumViewUri = ViewHelper_1.default.constructUriFromViews([
            ...this.previousViews,
            albumView
        ]);
        const albumViewHandler = ViewHandlerFactory_1.default.getHandler(albumViewUri);
        return albumViewHandler.browse();
    }
    const trackRenderer = this.getRenderer(renderers_1.RendererType.Track);
    const rendered = trackRenderer.renderToListItem(trackInfo);
    const listItems = rendered ? [rendered] : [];
    const viewTrackExternalLink = {
        url: trackUrl,
        text: BandcampContext_1.default.getI18n('BANDCAMP_VIEW_LINK_TRACK'),
        icon: { type: 'bandcamp' },
        target: '_blank'
    };
    return {
        navigation: {
            prev: { uri: this.constructPrevUri() },
            info: trackRenderer.renderToHeader(trackInfo),
            lists: [
                {
                    title: UIHelper_1.default.constructListTitleWithLink('', viewTrackExternalLink, true),
                    availableListViews: ['list'],
                    items: listItems
                }
            ]
        }
    };
};
//# sourceMappingURL=TrackViewHandler.js.map