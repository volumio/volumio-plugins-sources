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
const BandcampContext_1 = __importDefault(require("../../../../BandcampContext"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
const UIHelper_1 = __importStar(require("../../../../util/UIHelper"));
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
class TagRenderer extends BaseRenderer_1.default {
    renderToListItem(data, listSelectionParams) {
        const title = listSelectionParams.selected ? UIHelper_1.default.styleText(data.name, UIHelper_1.UI_STYLES.LIST_ITEM_SELECTED) : data.name;
        return {
            service: 'bandcamp',
            type: 'item-no-menu',
            title,
            icon: listSelectionParams.selected ? 'fa fa-check' : 'fa',
            uri: listSelectionParams.uri
        };
    }
    renderGenreListItem(data) {
        const tagView = {
            name: 'tag',
            tagUrl: data.url
        };
        return {
            service: 'bandcamp',
            type: 'folder',
            title: data.name,
            albumart: data.thumbnail,
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(tagView)}`
        };
    }
    renderToHeader(data) {
        return {
            uri: this.uri,
            service: 'bandcamp',
            type: 'song',
            title: data.name,
            artist: BandcampContext_1.default.getI18n('BANDCAMP_HEADER_TAG')
        };
    }
}
exports.default = TagRenderer;
//# sourceMappingURL=TagRenderer.js.map