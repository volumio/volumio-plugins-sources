"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _ExplodableViewHandler_instances, _ExplodableViewHandler_convertCloudcastToExplodedTrackInfo, _ExplodableViewHandler_convertLivestreamToExplodedTrackInfo;
Object.defineProperty(exports, "__esModule", { value: true });
const BaseViewHandler_1 = __importDefault(require("./BaseViewHandler"));
const ViewHelper_1 = __importDefault(require("./ViewHelper"));
const UIHelper_1 = __importDefault(require("../../../util/UIHelper"));
class ExplodableViewHandler extends BaseViewHandler_1.default {
    constructor() {
        super(...arguments);
        _ExplodableViewHandler_instances.add(this);
    }
    async explode() {
        const view = this.currentView;
        if (view.noExplode) {
            return [];
        }
        const tracks = await this.getStreamableEntitiesOnExplode();
        if (!Array.isArray(tracks)) {
            const trackInfo = await this.convertStreamableEntityToExplodedTrackInfo(tracks);
            return trackInfo ? [trackInfo] : [];
        }
        const trackInfoPromises = tracks.map((track) => this.convertStreamableEntityToExplodedTrackInfo(track));
        return (await Promise.all(trackInfoPromises)).filter((song) => song);
    }
    async convertStreamableEntityToExplodedTrackInfo(entity) {
        switch (entity.type) {
            case 'cloudcast':
                return __classPrivateFieldGet(this, _ExplodableViewHandler_instances, "m", _ExplodableViewHandler_convertCloudcastToExplodedTrackInfo).call(this, entity);
            case 'liveStream':
                return __classPrivateFieldGet(this, _ExplodableViewHandler_instances, "m", _ExplodableViewHandler_convertLivestreamToExplodedTrackInfo).call(this, entity);
        }
    }
}
_ExplodableViewHandler_instances = new WeakSet(), _ExplodableViewHandler_convertCloudcastToExplodedTrackInfo = function _ExplodableViewHandler_convertCloudcastToExplodedTrackInfo(cloudcast) {
    // Track URI: mixcloud/cloudcast@cloudcastId={...}@owner={...}
    const cloudcastView = {
        name: 'cloudcast',
        cloudcastId: cloudcast.id
    };
    if (cloudcast.owner?.username) {
        cloudcastView.owner = cloudcast.owner.username;
    }
    const trackUri = `mixcloud/${ViewHelper_1.default.constructUriSegmentFromView(cloudcastView)}`;
    const trackName = !cloudcast.isExclusive ? cloudcast.name : UIHelper_1.default.addExclusiveText(cloudcast.name);
    return {
        service: 'mixcloud',
        uri: trackUri,
        albumart: cloudcast.thumbnail,
        artist: cloudcast.owner?.name || cloudcast.owner?.username,
        album: '',
        name: trackName,
        title: trackName
    };
}, _ExplodableViewHandler_convertLivestreamToExplodedTrackInfo = function _ExplodableViewHandler_convertLivestreamToExplodedTrackInfo(liveStream) {
    if (!liveStream.owner) {
        return null;
    }
    // Track URI: mixcloud/livestream@username={...}
    const liveStreamView = {
        name: 'liveStream',
        username: liveStream.owner.username
    };
    const trackUri = `mixcloud/${ViewHelper_1.default.constructUriSegmentFromView(liveStreamView)}`;
    return {
        service: 'mixcloud',
        uri: trackUri,
        albumart: liveStream.thumbnail,
        artist: liveStream.owner.name || liveStream.owner.username,
        album: '',
        name: liveStream.name,
        title: liveStream.name
    };
};
exports.default = ExplodableViewHandler;
//# sourceMappingURL=ExplodableViewHandler.js.map