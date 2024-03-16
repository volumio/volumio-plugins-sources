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
var _PlayController_instances, _PlayController_mpdPlugin, _PlayController_getStreamInfo, _PlayController_doPlay, _PlayController_mpdAddTags, _PlayController_getBandwidthFromHLS;
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const kew_1 = __importDefault(require("kew"));
const miniget_1 = __importDefault(require("miniget"));
const m3u8_parser_1 = require("m3u8-parser");
const MixcloudContext_1 = __importDefault(require("../../MixcloudContext"));
const ViewHelper_1 = __importDefault(require("../browse/view-handlers/ViewHelper"));
const model_1 = __importStar(require("../../model"));
const LiveStreamProxy_1 = __importDefault(require("./LiveStreamProxy"));
const util_1 = require("../../util");
class PlayController {
    constructor() {
        _PlayController_instances.add(this);
        _PlayController_mpdPlugin.set(this, void 0);
        __classPrivateFieldSet(this, _PlayController_mpdPlugin, MixcloudContext_1.default.getMpdPlugin(), "f");
    }
    /**
     * Track uri:
     * - mixcloud/cloudcast@cloudcastId={...}@owner={...}
     * - mixcloud/livestream@username={...}
     */
    async clearAddPlayTrack(track) {
        MixcloudContext_1.default.getLogger().info(`[mixcloud] clearAddPlayTrack: ${track.uri}`);
        let stream;
        try {
            stream = await __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getStreamInfo).call(this, track);
        }
        catch (error) {
            MixcloudContext_1.default.getLogger().error(`[mixcloud] Error getting stream: ${error}`);
            throw error;
        }
        try {
            return await (0, util_1.kewToJSPromise)(__classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_doPlay).call(this, stream.url, track));
        }
        catch (error) {
            if (stream.liveStreamProxy) {
                await stream.liveStreamProxy.kill();
            }
            throw error;
        }
    }
    // Returns kew promise!
    stop() {
        MixcloudContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").stop();
    }
    // Returns kew promise!
    pause() {
        MixcloudContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").pause();
    }
    // Returns kew promise!
    resume() {
        MixcloudContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").resume();
    }
    // Returns kew promise!
    seek(position) {
        MixcloudContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").seek(position);
    }
    // Returns kew promise!
    next() {
        MixcloudContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").next();
    }
    // Returns kew promise!
    previous() {
        MixcloudContext_1.default.getStateMachine().setConsumeUpdateService(undefined);
        return MixcloudContext_1.default.getStateMachine().previous();
    }
}
_PlayController_mpdPlugin = new WeakMap(), _PlayController_instances = new WeakSet(), _PlayController_getStreamInfo = async function _PlayController_getStreamInfo(track) {
    const views = ViewHelper_1.default.getViewsFromUri(track.uri);
    let trackView = views[1];
    if (!trackView) {
        trackView = { name: '' };
    }
    let stream = null;
    if (trackView.name === 'cloudcast' && trackView.cloudcastId) {
        const cloudcastId = trackView.cloudcastId;
        const cloudcast = await model_1.default.getInstance(model_1.ModelType.Cloudcast).getCloudcast(cloudcastId);
        const streamUrl = cloudcast?.streams?.hls || cloudcast?.streams?.http || cloudcast?.streams?.dash || null;
        if (!streamUrl) {
            if (cloudcast?.isExclusive) {
                MixcloudContext_1.default.toast('warning', MixcloudContext_1.default.getI18n('MIXCLOUD_SKIP_EXCLUSIVE', track.name));
                MixcloudContext_1.default.getStateMachine().next();
                throw Error('Skipping exclusive cloudcast');
            }
            else {
                MixcloudContext_1.default.toast('error', MixcloudContext_1.default.getI18n('MIXCLOUD_NO_STREAM', track.name));
                if (!cloudcast) {
                    throw Error(`Stream not found for cloudcastId: ${cloudcastId} (Cloudcast does not exist)`);
                }
                throw Error(`Stream not found for cloudcastId: ${cloudcastId} (URL: ${cloudcast.url})`);
            }
        }
        else {
            stream = {
                url: streamUrl,
                isHLS: !!cloudcast?.streams?.hls
            };
        }
    }
    else if (trackView.name === 'liveStream' && trackView.username) {
        const username = trackView.username;
        const liveStream = await model_1.default.getInstance(model_1.ModelType.LiveStream).getLiveStream(username);
        if (!liveStream || !liveStream.streams?.hls) {
            MixcloudContext_1.default.toast('error', MixcloudContext_1.default.getI18n('MIXCLOUD_USER_NO_LIVE_STREAM', username));
            throw Error(`Live stream not found for user ${username}`);
        }
        if (!liveStream.isLive) {
            MixcloudContext_1.default.toast('error', MixcloudContext_1.default.getI18n('MIXCLOUD_LIVE_STREAM_ENDED', username));
            throw Error(`Live stream has ended for user ${username}`);
        }
        const proxy = new LiveStreamProxy_1.default(liveStream.streams.hls);
        try {
            const proxyStreamUrl = await proxy.start();
            stream = {
                url: proxyStreamUrl,
                isHLS: false,
                liveStreamProxy: proxy
            };
        }
        catch (error) {
            MixcloudContext_1.default.toast('error', MixcloudContext_1.default.getI18n('MIXCLOUD_LIVE_STREAM_PROXY_START_ERR', error instanceof Error ? error.message : error));
            throw Error(`Live stream obtained for user ${username}, but failed to start live stream proxy for playback.`);
        }
        track.duration = 0;
    }
    if (stream) {
        if (stream.isHLS) {
            // We setConsumeUpdateService to ignore metadata, so statemachine will take sample rate and bit depth from
            // Trackblock, which we don't have...At best, if stream is HLS, we try to obtain the max bit rate (bandwidth) and set it
            // As the sample rate. Otherwise, statemachine will obtain the bitrate from MPD but this is not always available.
            const bandwidth = await __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getBandwidthFromHLS).call(this, stream.url);
            if (bandwidth) {
                const bitrate = `${Math.floor(bandwidth / 1000)} kbps`;
                track.samplerate = bitrate;
            }
        }
        // Safe URL
        stream.url = stream.url.replace(/"/g, '\\"');
        return stream;
    }
    MixcloudContext_1.default.toast('error', MixcloudContext_1.default.getI18n('MIXCLOUD_INVALID_TRACK_URI', track.uri));
    throw Error(`Invalid track URI: ${track.uri}`);
}, _PlayController_doPlay = function _PlayController_doPlay(streamUrl, track) {
    const mpdPlugin = __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f");
    return mpdPlugin.sendMpdCommand('stop', [])
        .then(() => {
        return mpdPlugin.sendMpdCommand('clear', []);
    })
        .then(() => {
        return mpdPlugin.sendMpdCommand(`addid "${streamUrl}"`, []);
    })
        .then((addIdResp) => __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_mpdAddTags).call(this, addIdResp, track))
        .then(() => {
        MixcloudContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return mpdPlugin.sendMpdCommand('play', []);
    });
}, _PlayController_mpdAddTags = function _PlayController_mpdAddTags(mpdAddIdResponse, track) {
    const songId = mpdAddIdResponse?.Id;
    if (songId !== undefined) {
        const cmds = [];
        cmds.push({
            command: 'addtagid',
            parameters: [songId, 'title', track.title]
        });
        if (track.album) {
            cmds.push({
                command: 'addtagid',
                parameters: [songId, 'album', track.album]
            });
        }
        cmds.push({
            command: 'addtagid',
            parameters: [songId, 'artist', track.artist]
        });
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").sendMpdCommandArray(cmds);
    }
    return kew_1.default.resolve();
}, _PlayController_getBandwidthFromHLS = async function _PlayController_getBandwidthFromHLS(streamUrl) {
    const body = await (0, miniget_1.default)(streamUrl).text();
    const parser = new m3u8_parser_1.Parser();
    parser.push(body);
    parser.end();
    const playlists = parser.manifest.playlists;
    if (playlists && Array.isArray(playlists)) {
        const attributes = playlists[0]?.attributes;
        if (attributes && typeof attributes === 'object' && Reflect.has(attributes, 'BANDWIDTH')) {
            const bandwidth = Reflect.get(attributes, 'BANDWIDTH');
            return Number(bandwidth) || null;
        }
    }
    return null;
};
exports.default = PlayController;
//# sourceMappingURL=PlayController.js.map