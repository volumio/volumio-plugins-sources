"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ViewHelper_1 = __importDefault(require("../ViewHelper"));
const BaseRenderer_1 = __importDefault(require("./BaseRenderer"));
class PlaylistRenderer extends BaseRenderer_1.default {
    renderToListItem(data) {
        const subtitles = [];
        if (data.author?.name) {
            subtitles.push(data.author.name);
        }
        if (data.videoCount) {
            subtitles.push(data.videoCount);
        }
        const artist = subtitles.join(' • ');
        const endpoints = {
            watch: data.endpoint
        };
        let type = 'folder';
        if (data.browseEndpoint) {
            endpoints.browse = data.browseEndpoint;
        }
        else {
            // `CompactStations` converted to playlists do not have browseEndpoints and are to be played
            // Directly when clicked, i.e. they are not browseable.
            type = 'album';
        }
        const targetView = {
            name: 'playlist',
            endpoints
        };
        return {
            service: 'youtube2',
            type,
            title: data.title,
            albumart: data.thumbnail,
            artist,
            uri: `${this.uri}/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`
        };
    }
    renderToHeader(data) {
        const targetView = {
            name: 'generic',
            endpoint: data.endpoint
        };
        return {
            service: 'youtube2',
            type: 'playlist',
            uri: `youtube2/${ViewHelper_1.default.constructUriSegmentFromView(targetView)}`,
            title: data.title,
            artist: data.author?.name,
            duration: data.subtitles?.join(' • '),
            albumart: data.thumbnail
        };
    }
}
exports.default = PlaylistRenderer;
//# sourceMappingURL=PlaylistRenderer.js.map