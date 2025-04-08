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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _PlayController_instances, _PlayController_mpdPlugin, _PlayController_doPlay, _PlayController_mpdAddTags, _PlayController_stripNewLine;
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const kew_1 = __importDefault(require("kew"));
const SoundCloudContext_1 = __importDefault(require("../../SoundCloudContext"));
const model_1 = __importStar(require("../../model"));
const Misc_1 = require("../../util/Misc");
const TrackHelper_1 = __importDefault(require("../../util/TrackHelper"));
const ViewHelper_1 = __importDefault(require("../browse/view-handlers/ViewHelper"));
class PlayController {
    constructor() {
        _PlayController_instances.add(this);
        _PlayController_mpdPlugin.set(this, void 0);
        __classPrivateFieldSet(this, _PlayController_mpdPlugin, SoundCloudContext_1.default.getMpdPlugin(), "f");
    }
    /**
     * Track uri:
     * soundcloud/track@trackId=...
     */
    async clearAddPlayTrack(track) {
        SoundCloudContext_1.default.getLogger().info(`[soundcloud] clearAddPlayTrack: ${track.uri}`);
        const trackView = ViewHelper_1.default.getViewsFromUri(track.uri).pop();
        if (!trackView || trackView.name !== 'track' || !trackView.trackId) {
            throw Error(`Invalid track uri: ${track.uri}`);
        }
        const { trackId, origin } = trackView;
        const model = model_1.default.getInstance(model_1.ModelType.Track);
        const trackData = await model.getTrack(Number(trackId));
        if (!trackData) {
            throw Error(`Failed to fetch track: ${track.uri}`);
        }
        if (trackData.playableState === 'blocked') {
            SoundCloudContext_1.default.toast('warning', SoundCloudContext_1.default.getI18n('SOUNDCLOUD_SKIP_BLOCKED_TRACK', track.title));
            SoundCloudContext_1.default.getStateMachine().next();
            return;
        }
        else if (trackData.playableState === 'snipped' && SoundCloudContext_1.default.getConfigValue('skipPreviewTracks')) {
            SoundCloudContext_1.default.toast('warning', SoundCloudContext_1.default.getI18n('SOUNDCLOUD_SKIP_PREVIEW_TRACK', track.title));
            SoundCloudContext_1.default.getStateMachine().next();
            return;
        }
        const transcodingUrl = TrackHelper_1.default.getPreferredTranscoding(trackData);
        if (!transcodingUrl) {
            throw Error('No transcoding found');
        }
        let streamingUrl = await model.getStreamingUrl(transcodingUrl);
        if (!streamingUrl) {
            throw Error('No stream found');
        }
        /**
         * 1. Add bitrate info to track
         * 2. Fool MPD plugin to return correct `trackType` in `parseTrackInfo()` by adding
         * track type to URL query string as a dummy param.
         */
        if (streamingUrl.includes('.128.mp3')) { // 128 kbps mp3
            track.samplerate = '128 kbps';
            streamingUrl += '&_vt=.mp3';
        }
        else if (streamingUrl.includes('.64.opus')) { // 64 kbps opus
            track.samplerate = '64 kbps';
            streamingUrl += '&_vt=.opus';
        }
        const safeUri = streamingUrl.replace(/"/g, '\\"');
        await __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_doPlay).call(this, safeUri, track);
        if (SoundCloudContext_1.default.getConfigValue('addPlayedToHistory')) {
            await model_1.default.getInstance(model_1.ModelType.Me).addToPlayHistory(trackData, origin);
        }
    }
    // Returns kew promise!
    stop() {
        SoundCloudContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").stop();
    }
    // Returns kew promise!
    pause() {
        SoundCloudContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").pause();
    }
    // Returns kew promise!
    resume() {
        SoundCloudContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").resume();
    }
    // Returns kew promise!
    seek(position) {
        SoundCloudContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").seek(position);
    }
    // Returns kew promise!
    next() {
        SoundCloudContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").next();
    }
    // Returns kew promise!
    previous() {
        SoundCloudContext_1.default.getStateMachine().setConsumeUpdateService(undefined);
        return SoundCloudContext_1.default.getStateMachine().previous();
    }
    async getGotoUri(type, uri) {
        const trackView = ViewHelper_1.default.getViewsFromUri(uri).pop();
        if (trackView && trackView.name === 'track' && trackView.trackId && (type === 'album' || type === 'artist')) {
            if (type === 'album' && trackView.origin) {
                const origin = trackView.origin;
                if (origin.type === 'album') {
                    const albumView = {
                        name: 'albums',
                        albumId: origin.albumId.toString()
                    };
                    return `soundcloud/${ViewHelper_1.default.constructUriSegmentFromView(albumView)}`;
                }
                else if (origin.type === 'playlist' || origin.type === 'system-playlist') {
                    const playlistView = {
                        name: 'playlists',
                        playlistId: origin.playlistId.toString()
                    };
                    if (origin.type === 'system-playlist') {
                        playlistView.type = 'system';
                    }
                    return `soundcloud/${ViewHelper_1.default.constructUriSegmentFromView(playlistView)}`;
                }
            }
            const track = await model_1.default.getInstance(model_1.ModelType.Track).getTrack(Number(trackView.trackId));
            if (track && track.user?.id !== undefined) {
                const userView = {
                    name: 'users',
                    userId: track.user.id.toString()
                };
                return `soundcloud/${ViewHelper_1.default.constructUriSegmentFromView(userView)}`;
            }
        }
        return 'soundcloud';
    }
}
exports.default = PlayController;
_PlayController_mpdPlugin = new WeakMap(), _PlayController_instances = new WeakSet(), _PlayController_doPlay = function _PlayController_doPlay(streamUrl, track) {
    const mpdPlugin = __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f");
    return (0, Misc_1.kewToJSPromise)(mpdPlugin.sendMpdCommand('stop', [])
        .then(() => {
        return mpdPlugin.sendMpdCommand('clear', []);
    })
        .then(() => {
        return mpdPlugin.sendMpdCommand(`addid "${streamUrl}"`, []);
    })
        .then((addIdResp) => __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_mpdAddTags).call(this, addIdResp, track))
        .then(() => {
        SoundCloudContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return mpdPlugin.sendMpdCommand('play', []);
    }));
}, _PlayController_mpdAddTags = function _PlayController_mpdAddTags(mpdAddIdResponse, track) {
    const songId = mpdAddIdResponse?.Id;
    if (songId !== undefined) {
        const cmds = [];
        cmds.push({
            command: 'addtagid',
            parameters: [songId, 'title', __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_stripNewLine).call(this, track.title)]
        });
        if (track.album) {
            cmds.push({
                command: 'addtagid',
                parameters: [songId, 'album', __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_stripNewLine).call(this, track.album)]
            });
        }
        if (track.artist) {
            cmds.push({
                command: 'addtagid',
                parameters: [songId, 'artist', __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_stripNewLine).call(this, track.artist)]
            });
        }
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").sendMpdCommandArray(cmds);
    }
    return kew_1.default.resolve();
}, _PlayController_stripNewLine = function _PlayController_stripNewLine(str) {
    return str.replace(/(\r\n|\n|\r)/gm, '');
};
//# sourceMappingURL=PlayController.js.map