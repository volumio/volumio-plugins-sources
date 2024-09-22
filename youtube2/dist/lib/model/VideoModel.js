"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _VideoModel_instances, _VideoModel_chooseFormat, _VideoModel_parseStreamData, _VideoModel_getStreamUrlFromHLS;
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const YouTube2Context_1 = __importDefault(require("../YouTube2Context"));
const BaseModel_1 = require("./BaseModel");
const InnertubeResultParser_1 = __importDefault(require("./InnertubeResultParser"));
// https://gist.github.com/sidneys/7095afe4da4ae58694d128b1034e01e2
const ITAG_TO_BITRATE = {
    '139': '48',
    '140': '128',
    '141': '256',
    '171': '128',
    '249': '50',
    '250': '70',
    '251': '160'
};
const BEST_AUDIO_FORMAT = {
    type: 'audio',
    format: 'any',
    quality: 'best'
};
class VideoModel extends BaseModel_1.BaseModel {
    constructor() {
        super(...arguments);
        _VideoModel_instances.add(this);
    }
    async getPlaybackInfo(videoId) {
        const { innertube } = await this.getInnertube();
        try {
            const info = await innertube.getBasicInfo(videoId);
            const basicInfo = info.basic_info;
            const result = {
                type: 'video',
                title: basicInfo.title,
                author: {
                    channelId: basicInfo.channel_id,
                    name: basicInfo.author
                },
                description: basicInfo.short_description,
                thumbnail: InnertubeResultParser_1.default.parseThumbnail(basicInfo.thumbnail) || '',
                isLive: !!basicInfo.is_live,
                duration: basicInfo.duration,
                addToHistory: () => {
                    return info?.addToWatchHistory();
                }
            };
            if (info.playability_status.status === 'UNPLAYABLE') {
                // Check if this video has a trailer (non-purchased movies / films)
                if (info.has_trailer) {
                    const trailerInfo = info.getTrailerInfo();
                    if (trailerInfo) {
                        result.stream = __classPrivateFieldGet(this, _VideoModel_instances, "m", _VideoModel_chooseFormat).call(this, innertube, trailerInfo);
                    }
                }
                else {
                    throw Error(info.playability_status.reason);
                }
            }
            else if (!result.isLive) {
                result.stream = __classPrivateFieldGet(this, _VideoModel_instances, "m", _VideoModel_chooseFormat).call(this, innertube, info);
            }
            else {
                const hlsManifestUrl = info.streaming_data?.hls_manifest_url;
                const streamUrlFromHLS = hlsManifestUrl ? await __classPrivateFieldGet(this, _VideoModel_instances, "m", _VideoModel_getStreamUrlFromHLS).call(this, hlsManifestUrl, YouTube2Context_1.default.getConfigValue('liveStreamQuality')) : null;
                result.stream = streamUrlFromHLS ? { url: streamUrlFromHLS } : null;
            }
            return result;
        }
        catch (error) {
            YouTube2Context_1.default.getLogger().error(YouTube2Context_1.default.getErrorMessage(`[youtube2] Error in VideoModel.getInfo(${videoId}): `, error));
            return null;
        }
    }
}
exports.default = VideoModel;
_VideoModel_instances = new WeakSet(), _VideoModel_chooseFormat = function _VideoModel_chooseFormat(innertube, videoInfo) {
    const format = videoInfo?.chooseFormat(BEST_AUDIO_FORMAT);
    const streamUrl = format ? format.decipher(innertube.session.player) : null;
    const streamData = format ? { ...format, url: streamUrl } : null;
    return __classPrivateFieldGet(this, _VideoModel_instances, "m", _VideoModel_parseStreamData).call(this, streamData);
}, _VideoModel_parseStreamData = function _VideoModel_parseStreamData(data) {
    if (!data) {
        return null;
    }
    const audioBitrate = ITAG_TO_BITRATE[data.itag];
    return {
        url: data.url,
        mimeType: data.mime_type,
        bitrate: audioBitrate ? `${audioBitrate} kbps` : null,
        sampleRate: data.audio_sample_rate,
        channels: data.audio_channels
    };
}, _VideoModel_getStreamUrlFromHLS = async function _VideoModel_getStreamUrlFromHLS(manifestUrl, targetQuality) {
    if (!manifestUrl) {
        return null;
    }
    if (!targetQuality || targetQuality === 'auto') {
        return manifestUrl;
    }
    const res = await (0, node_fetch_1.default)(manifestUrl);
    const manifestContents = await res.text();
    // Match Resolution and Url
    const regex = /#EXT-X-STREAM-INF.*RESOLUTION=(\d+x\d+).*[\r\n](.+)/gm;
    const playlistVariants = [];
    // Modified from regex101's code generator :)
    let m;
    while ((m = regex.exec(manifestContents)) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        const variant = {};
        playlistVariants.push(variant);
        m.forEach((match, groupIndex) => {
            if (groupIndex === 1) { // Resolution
                variant.quality = `${match.split('x')[1]}p`;
            }
            if (groupIndex === 2) {
                variant.url = match;
            }
        });
    }
    // Find matching variant or closest one that is lower than targetQuality
    const targetQualityInt = parseInt(targetQuality);
    const diffs = playlistVariants.map((variant) => ({
        variant,
        qualityDelta: targetQualityInt - (variant.quality ? parseInt(variant.quality) : 0)
    }));
    const closest = diffs.filter((v) => v.qualityDelta >= 0).sort((v1, v2) => v1.qualityDelta - v2.qualityDelta)[0];
    return closest?.variant.url || playlistVariants[0]?.url || null;
};
//# sourceMappingURL=VideoModel.js.map