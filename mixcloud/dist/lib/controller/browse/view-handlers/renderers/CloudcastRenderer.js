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
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const MixcloudContext_1 = __importDefault(require("../../../../MixcloudContext"));
const UIHelper_1 = __importStar(require("../../../../util/UIHelper"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
class CloudcastRenderer extends BaseRenderer_1.default {
    renderToListItem(cloudcast, asType = 'folder', showMoreFromUser = false) {
        let type;
        let title;
        let album;
        let artist;
        let duration;
        let albumart;
        let icon;
        let uri;
        switch (asType) {
            case 'folder':
                type = 'folder';
                title = cloudcast.name;
                album = MixcloudContext_1.default.getI18n('MIXCLOUD_SHOW');
                artist = cloudcast.owner?.name || cloudcast.owner?.username;
                duration = cloudcast.duration;
                albumart = cloudcast.thumbnail;
                const cloudcastView = {
                    name: 'cloudcast',
                    cloudcastId: cloudcast.id
                };
                uri = `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(cloudcastView)}`;
                if (cloudcast.isExclusive) {
                    title = UIHelper_1.default.addExclusiveText(title);
                }
                if (showMoreFromUser) {
                    uri += '@showMoreFromUser=1';
                }
                break;
            case 'playShowItem':
                if (cloudcast.isExclusive) {
                    type = 'item-no-menu';
                    title = UIHelper_1.default.styleText(MixcloudContext_1.default.getI18n('MIXCLOUD_EXCLUSIVE_DESC'), UIHelper_1.UI_STYLES.EXCLUSIVE_DESC);
                    uri = `${this.uri}@noExplode=1`;
                    icon = 'fa fa-ban';
                }
                else {
                    type = 'song';
                    title = MixcloudContext_1.default.getI18n('MIXCLOUD_PLAY_SHOW');
                    duration = cloudcast.duration;
                    albumart = cloudcast.thumbnail;
                    uri = this.uri;
                }
                break;
        }
        return {
            service: 'mixcloud',
            type,
            title,
            album,
            artist,
            duration,
            albumart,
            icon,
            uri
        };
    }
    renderToHeader(cloudcast) {
        return {
            uri: this.uri,
            service: 'mixcloud',
            type: 'song',
            title: cloudcast.name,
            artist: MixcloudContext_1.default.getI18n('MIXCLOUD_HEADER_SHOW', cloudcast.owner?.name || cloudcast.owner?.username),
            albumart: cloudcast.thumbnail
        };
    }
}
exports.default = CloudcastRenderer;
//# sourceMappingURL=CloudcastRenderer.js.map