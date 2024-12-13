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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var _VideoLoader_instances, _VideoLoader_logger, _VideoLoader_defaultInnertubeLoader, _VideoLoader_tvInnertubeLoader, _VideoLoader_getInnertubeInstances, _VideoLoader_setTVClientContext, _VideoLoader_getThumbnail, _VideoLoader_chooseFormat, _VideoLoader_parseStreamData, _VideoLoader_getStreamUrlFromHLS;
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const InnertubeLib = __importStar(require("volumio-youtubei.js"));
const yt_cast_receiver_1 = require("yt-cast-receiver");
const YTCRContext_js_1 = __importDefault(require("./YTCRContext.js"));
const InnertubeLoader_js_1 = __importDefault(require("./InnertubeLoader.js"));
// https://gist.github.com/sidneys/7095afe4da4ae58694d128b1034e01e2
const ITAG_TO_BITRATE = {
    '139': '48',
    '140': '128',
    '141': '256',
    '171': '128',
    '249': 'VBR 50',
    '250': 'VBR 70',
    '251': 'VBR 160',
    '774': 'VBR 256'
};
const BEST_AUDIO_FORMAT = {
    type: 'audio',
    format: 'any',
    quality: 'best'
};
class VideoLoader {
    constructor(logger) {
        _VideoLoader_instances.add(this);
        _VideoLoader_logger.set(this, void 0);
        _VideoLoader_defaultInnertubeLoader.set(this, void 0);
        _VideoLoader_tvInnertubeLoader.set(this, void 0);
        __classPrivateFieldSet(this, _VideoLoader_logger, logger, "f");
        __classPrivateFieldSet(this, _VideoLoader_defaultInnertubeLoader, new InnertubeLoader_js_1.default(__classPrivateFieldGet(this, _VideoLoader_logger, "f")), "f");
        __classPrivateFieldSet(this, _VideoLoader_tvInnertubeLoader, new InnertubeLoader_js_1.default(__classPrivateFieldGet(this, _VideoLoader_logger, "f"), __classPrivateFieldGet(this, _VideoLoader_instances, "m", _VideoLoader_setTVClientContext).bind(this)), "f");
    }
    refreshI18nConfig() {
        __classPrivateFieldGet(this, _VideoLoader_defaultInnertubeLoader, "f").applyI18nConfig();
        __classPrivateFieldGet(this, _VideoLoader_tvInnertubeLoader, "f").applyI18nConfig();
    }
    async getInfo(video, abortSignal) {
        const { defaultInnertube, tvInnertube } = await __classPrivateFieldGet(this, _VideoLoader_instances, "m", _VideoLoader_getInnertubeInstances).call(this);
        const checkAbortSignal = () => {
            if (abortSignal.aborted) {
                const msg = `VideoLoader.getInfo() aborted for video Id: ${video.id}`;
                __classPrivateFieldGet(this, _VideoLoader_logger, "f").debug(`[ytcr] ${msg}.`);
                const abortError = Error(msg);
                abortError.name = 'AbortError';
                throw abortError;
            }
        };
        __classPrivateFieldGet(this, _VideoLoader_logger, "f").debug(`[ytcr] VideoLoader.getInfo: ${video.id}`);
        checkAbortSignal();
        // Configure Innertube instances
        const __prepInnertubeAndPayload = (innertube) => {
            const cpn = InnertubeLib.Utils.generateRandomString(16);
            // Prepare request payload
            const payload = {
                videoId: video.id,
                enableMdxAutoplay: true,
                isMdxPlayback: true,
                playbackContext: {
                    contentPlaybackContext: {
                        signatureTimestamp: tvInnertube.session.player?.sts || 0
                    }
                }
            };
            if (video.context?.playlistId) {
                payload.playlistId = video.context.playlistId;
            }
            if (video.context?.params) {
                payload.params = video.context.params;
            }
            if (video.context?.index !== undefined) {
                payload.index = video.context.index;
            }
            // Modify innertube's session context to include `ctt` param
            if (video.context?.ctt) {
                innertube.session.context.user = {
                    enableSafetyMode: false,
                    lockedSafetyMode: false,
                    credentialTransferTokens: [
                        {
                            'scope': 'VIDEO',
                            'token': video.context?.ctt
                        }
                    ]
                };
            }
            else {
                delete innertube.session.context.user?.credentialTransferTokens;
            }
            return [payload, cpn];
        };
        const [defaultPayload, cpn] = __prepInnertubeAndPayload(defaultInnertube);
        const [tvPayload] = __prepInnertubeAndPayload(tvInnertube);
        try {
            // There are two endpoints we need to fetch data from:
            // 1. '/next': for metadata (title, channel for video, artist / album for music...)
            // 2. '/player': for streaming data
            const nextResponse = await tvInnertube.actions.execute('/next', tvPayload);
            checkAbortSignal();
            let basicInfo = null;
            // We cannot use innertube to parse `nextResponse`, because it doesn't
            // Have `SingleColumnWatchNextResults` parser class. We would have to do it ourselves.
            const singleColumnContents = nextResponse.data?.contents?.singleColumnWatchNextResults?.
                results?.results?.contents?.[0]?.itemSectionRenderer?.contents?.[0];
            const videoMetadata = singleColumnContents?.videoMetadataRenderer;
            const songMetadata = singleColumnContents?.musicWatchMetadataRenderer;
            if (videoMetadata) {
                basicInfo = {
                    id: video.id,
                    src: 'yt',
                    title: new InnertubeLib.Misc.Text(videoMetadata.title).toString(),
                    channel: new InnertubeLib.Misc.Text(videoMetadata.owner?.videoOwnerRenderer?.title).toString(),
                    isLive: videoMetadata.viewCount.videoViewCountRenderer.isLive
                };
            }
            else if (songMetadata) {
                basicInfo = {
                    id: video.id,
                    src: 'ytmusic',
                    title: new InnertubeLib.Misc.Text(songMetadata.title).toString(),
                    artist: new InnertubeLib.Misc.Text(songMetadata.byline).toString(),
                    album: songMetadata.albumName ? new InnertubeLib.Misc.Text(songMetadata.albumName).toString() : ''
                };
            }
            if (!basicInfo) {
                throw new yt_cast_receiver_1.DataError('Metadata not found in response');
            }
            // Fetch response from '/player' endpoint. But first, specify client in payload.
            // Innertube will modify 'context.client' before submitting request.
            if (basicInfo.src === 'ytmusic') {
                // YouTube Music
                defaultPayload.client = 'YTMUSIC';
            }
            else if (!basicInfo.isLive) {
                // For non-live streams, we must use 'TV' client, otherwise streams will return 403 error.
                // For livestreams, we can use default 'WEB' client. If we use 'TV' client, we will only get
                // DASH manifest URL - what we need is the HLS manifest URL.
                defaultPayload.client = 'TV';
            }
            const playerResponse = await defaultInnertube.actions.execute('/player', defaultPayload);
            checkAbortSignal();
            // Wrap it in innertube VideoInfo.
            const innertubeVideoInfo = new InnertubeLib.YT.VideoInfo([playerResponse], defaultInnertube.actions, cpn);
            const thumbnail = __classPrivateFieldGet(this, _VideoLoader_instances, "m", _VideoLoader_getThumbnail).call(this, innertubeVideoInfo.basic_info.thumbnail);
            const isLive = !!innertubeVideoInfo.basic_info.is_live;
            // Retrieve stream info
            let playable = false;
            let errMsg = null;
            let streamInfo = null;
            if (innertubeVideoInfo.playability_status?.status === 'UNPLAYABLE') {
                if (innertubeVideoInfo.has_trailer) {
                    const trailerInfo = innertubeVideoInfo.getTrailerInfo();
                    if (trailerInfo) {
                        streamInfo = await __classPrivateFieldGet(this, _VideoLoader_instances, "m", _VideoLoader_chooseFormat).call(this, trailerInfo);
                    }
                }
                else {
                    errMsg = innertubeVideoInfo.playability_status.reason;
                }
            }
            else if (!isLive) {
                streamInfo = await __classPrivateFieldGet(this, _VideoLoader_instances, "m", _VideoLoader_chooseFormat).call(this, innertubeVideoInfo);
            }
            else if (innertubeVideoInfo.streaming_data?.hls_manifest_url) {
                const targetQuality = YTCRContext_js_1.default.getConfigValue('liveStreamQuality', 'auto');
                streamInfo = {
                    url: await __classPrivateFieldGet(this, _VideoLoader_instances, "m", _VideoLoader_getStreamUrlFromHLS).call(this, innertubeVideoInfo.streaming_data.hls_manifest_url, targetQuality)
                };
            }
            playable = !!streamInfo?.url;
            if (!playable && !errMsg) {
                errMsg = YTCRContext_js_1.default.getI18n('YTCR_STREAM_NOT_FOUND');
            }
            checkAbortSignal();
            return {
                ...basicInfo,
                errMsg: errMsg || undefined,
                thumbnail,
                isLive,
                streamUrl: streamInfo?.url,
                duration: innertubeVideoInfo.basic_info.duration || 0,
                bitrate: streamInfo?.bitrate || undefined,
                samplerate: streamInfo?.sampleRate,
                channels: streamInfo?.channels,
                streamExpires: innertubeVideoInfo.streaming_data?.expires
            };
        }
        catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw error;
            }
            __classPrivateFieldGet(this, _VideoLoader_logger, "f").error(`[ytcr] Error in VideoLoader.getInfo(${video.id}):`, error);
            return {
                id: video.id,
                errMsg: error instanceof Error ? error.message : '(Check logs for errors)'
            };
        }
    }
}
_VideoLoader_logger = new WeakMap(), _VideoLoader_defaultInnertubeLoader = new WeakMap(), _VideoLoader_tvInnertubeLoader = new WeakMap(), _VideoLoader_instances = new WeakSet(), _VideoLoader_getInnertubeInstances = async function _VideoLoader_getInnertubeInstances() {
    return {
        defaultInnertube: (await __classPrivateFieldGet(this, _VideoLoader_defaultInnertubeLoader, "f").getInstance()).innertube,
        tvInnertube: (await __classPrivateFieldGet(this, _VideoLoader_tvInnertubeLoader, "f").getInstance()).innertube
    };
}, _VideoLoader_setTVClientContext = function _VideoLoader_setTVClientContext(innertube) {
    innertube.session.context.client = {
        ...innertube.session.context.client,
        clientName: 'TVHTML5',
        clientVersion: '7.20230405.08.01',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36; SMART-TV; Tizen 4.0,gzip(gfe)'
    };
}, _VideoLoader_getThumbnail = function _VideoLoader_getThumbnail(data) {
    const url = data?.[0]?.url;
    if (url?.startsWith('//')) {
        return `https:${url}`;
    }
    return url;
}, _VideoLoader_chooseFormat = async function _VideoLoader_chooseFormat(videoInfo) {
    const { defaultInnertube: innertube } = await __classPrivateFieldGet(this, _VideoLoader_instances, "m", _VideoLoader_getInnertubeInstances).call(this);
    const preferredFormat = {
        ...BEST_AUDIO_FORMAT
    };
    const prefetch = YTCRContext_js_1.default.getConfigValue('prefetch', true);
    const preferOpus = prefetch && YTCRContext_js_1.default.getConfigValue('preferOpus', false);
    if (preferOpus) {
        __classPrivateFieldGet(this, _VideoLoader_logger, "f").debug('[ytcr] Preferred format is Opus');
        preferredFormat.format = 'opus';
    }
    let format;
    try {
        format = videoInfo?.chooseFormat(preferredFormat);
    }
    catch (error) {
        if (preferOpus && videoInfo) {
            __classPrivateFieldGet(this, _VideoLoader_logger, "f").debug('[ytcr] No matching format for Opus. Falling back to any audio format ...');
            try {
                format = videoInfo.chooseFormat(BEST_AUDIO_FORMAT);
            }
            catch (error) {
                __classPrivateFieldGet(this, _VideoLoader_logger, "f").debug('[ytcr] Failed to obtain audio format:', error);
                format = null;
            }
        }
        else {
            throw error;
        }
    }
    const streamUrl = format ? format.decipher(innertube.session.player) : null;
    const streamData = format ? { ...format, url: streamUrl } : null;
    if (streamData) {
        return __classPrivateFieldGet(this, _VideoLoader_instances, "m", _VideoLoader_parseStreamData).call(this, streamData);
    }
    return null;
}, _VideoLoader_parseStreamData = function _VideoLoader_parseStreamData(data) {
    const audioBitrate = ITAG_TO_BITRATE[`${data.itag}`];
    return {
        url: data.url || null,
        mimeType: data.mime_type,
        bitrate: audioBitrate ? `${audioBitrate} kbps` : null,
        sampleRate: data.audio_sample_rate,
        channels: data.audio_channels
    };
}, _VideoLoader_getStreamUrlFromHLS = async function _VideoLoader_getStreamUrlFromHLS(manifestUrl, targetQuality) {
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
        qualityDelta: targetQualityInt - parseInt(variant.quality)
    }));
    const closest = diffs.filter((v) => v.qualityDelta >= 0).sort((v1, v2) => v1.qualityDelta - v2.qualityDelta)[0];
    return closest?.variant.url || playlistVariants[0]?.url || null;
};
exports.default = VideoLoader;
//# sourceMappingURL=VideoLoader.js.map