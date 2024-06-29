"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _MusicItemModel_instances, _MusicItemModel_getTrackInfo, _MusicItemModel_extractStreamData, _MusicItemModel_getInfoFromUpNextTab, _MusicItemModel_getLyricsId;
Object.defineProperty(exports, "__esModule", { value: true });
const YTMusicContext_1 = __importDefault(require("../YTMusicContext"));
const volumio_youtubei_js_1 = require("volumio-youtubei.js");
const BaseModel_1 = require("./BaseModel");
const InnertubeResultParser_1 = __importDefault(require("./InnertubeResultParser"));
const Endpoint_1 = require("../types/Endpoint");
const EndpointHelper_1 = __importDefault(require("../util/EndpointHelper"));
// https://gist.github.com/sidneys/7095afe4da4ae58694d128b1034e01e2
// https://gist.github.com/MartinEesmaa/2f4b261cb90a47e9c41ba115a011a4aa
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
class MusicItemModel extends BaseModel_1.BaseModel {
    constructor() {
        super(...arguments);
        _MusicItemModel_instances.add(this);
    }
    async getPlaybackInfo(endpoint) {
        if (!EndpointHelper_1.default.isType(endpoint, Endpoint_1.EndpointType.Watch) || !endpoint.payload.videoId) {
            throw Error('Invalid endpoint');
        }
        const { innertube } = await this.getInnertube();
        const trackInfo = await __classPrivateFieldGet(this, _MusicItemModel_instances, "m", _MusicItemModel_getTrackInfo).call(this, innertube, endpoint);
        const streamData = __classPrivateFieldGet(this, _MusicItemModel_instances, "m", _MusicItemModel_extractStreamData).call(this, innertube, trackInfo);
        // `trackInfo` does not contain album info - need to obtain from item in Up Next tab.
        const infoFromUpNextTab = __classPrivateFieldGet(this, _MusicItemModel_instances, "m", _MusicItemModel_getInfoFromUpNextTab).call(this, trackInfo, endpoint);
        let musicItem = null;
        let album = null;
        if (infoFromUpNextTab && (infoFromUpNextTab.type === 'video' || infoFromUpNextTab.type === 'song')) {
            musicItem = infoFromUpNextTab;
            album = musicItem.album;
        }
        // `trackInfo` sometimes ignores hl / gl (lang / region), so titles and such could be in wrong language.
        // Furthermore, the artist's channelId is possibly wrong for private uploads.
        // We return info from item in Up Next tab, while using trackInfo as fallback.
        let channelId;
        if (musicItem?.artists && musicItem.artists[0]?.channelId) {
            channelId = musicItem.artists[0].channelId;
        }
        else {
            channelId = trackInfo.basic_info.channel_id;
        }
        return {
            title: musicItem?.title || trackInfo.basic_info.title,
            artist: {
                channelId,
                name: musicItem?.artistText || trackInfo.basic_info.author
            },
            album: {
                albumId: album?.albumId,
                title: musicItem?.album?.title || album?.title
            },
            thumbnail: InnertubeResultParser_1.default.parseThumbnail(trackInfo.basic_info.thumbnail) || undefined,
            stream: streamData,
            duration: trackInfo.basic_info.duration,
            addToHistory: () => {
                return trackInfo.addToWatchHistory();
            },
            radioEndpoint: musicItem?.radioEndpoint
        };
    }
    async getLyrics(videoId) {
        const { innertube } = await this.getInnertube();
        const lyricsId = await __classPrivateFieldGet(this, _MusicItemModel_instances, "m", _MusicItemModel_getLyricsId).call(this, videoId);
        const payload = {
            browseId: lyricsId,
            client: 'YTMUSIC_ANDROID'
        };
        const response = await innertube.actions.execute('/browse', payload);
        const parsed = volumio_youtubei_js_1.Parser.parseResponse(response.data);
        return InnertubeResultParser_1.default.parseLyrics(parsed);
    }
}
exports.default = MusicItemModel;
_MusicItemModel_instances = new WeakSet(), _MusicItemModel_getTrackInfo = 
// Based on Innertube.Music.#fetchInfoFromListItem(), which requires MusicTwoRowItem which we don't have.
async function _MusicItemModel_getTrackInfo(innertube, endpoint) {
    const innertubeEndpoint = new volumio_youtubei_js_1.YTNodes.NavigationEndpoint({});
    innertubeEndpoint.metadata.api_url = volumio_youtubei_js_1.Endpoints.PlayerEndpoint.PATH;
    innertubeEndpoint.payload = volumio_youtubei_js_1.Endpoints.PlayerEndpoint.build({
        video_id: endpoint.payload.videoId,
        playlist_id: endpoint.payload.playlistId,
        params: endpoint.payload.params,
        sts: innertube.session.player?.sts
    });
    const player_response = innertubeEndpoint.call(innertube.actions, {
        client: 'YTMUSIC',
        playbackContext: {
            contentPlaybackContext: {
                ...{
                    signatureTimestamp: innertube.session.player?.sts
                }
            }
        }
    });
    const next_response = innertubeEndpoint.call(innertube.actions, {
        client: 'YTMUSIC',
        enablePersistentPlaylistPanel: true,
        override_endpoint: '/next'
    });
    const cpn = volumio_youtubei_js_1.Utils.generateRandomString(16);
    const response = await Promise.all([player_response, next_response]);
    return new volumio_youtubei_js_1.YTMusic.TrackInfo(response, innertube.actions, cpn);
}, _MusicItemModel_extractStreamData = function _MusicItemModel_extractStreamData(innertube, info) {
    const preferredFormat = {
        ...BEST_AUDIO_FORMAT
    };
    const prefetch = YTMusicContext_1.default.getConfigValue('prefetch');
    const preferOpus = prefetch && YTMusicContext_1.default.getConfigValue('preferOpus');
    if (preferOpus) {
        YTMusicContext_1.default.getLogger().info('[ytmusic] Preferred format is Opus');
        preferredFormat.format = 'opus';
    }
    let format;
    try {
        format = info.chooseFormat(preferredFormat);
    }
    catch (error) {
        if (preferOpus && info) {
            YTMusicContext_1.default.getLogger().warn('[ytmusic] No matching format for Opus. Falling back to any audio format ...');
            try {
                format = info.chooseFormat(BEST_AUDIO_FORMAT);
            }
            catch (error) {
                YTMusicContext_1.default.getLogger().error('[ytmusic] Failed to obtain audio format:', error);
                format = null;
            }
        }
        else {
            throw error;
        }
    }
    if (format) {
        const audioBitrate = ITAG_TO_BITRATE[format.itag];
        return {
            url: format.decipher(innertube.session.player),
            mimeType: format.mime_type,
            bitrate: audioBitrate ? `${audioBitrate} kbps` : null,
            sampleRate: format.audio_sample_rate ? `${format.audio_sample_rate} kHz` : undefined,
            channels: format.audio_channels
        };
    }
    return null;
}, _MusicItemModel_getInfoFromUpNextTab = function _MusicItemModel_getInfoFromUpNextTab(info, endpoint) {
    const playlistPanel = info.page[1]?.contents_memo?.getType(volumio_youtubei_js_1.YTNodes.PlaylistPanel).first();
    if (!playlistPanel) {
        return null;
    }
    const videoId = endpoint.payload.videoId;
    const match = playlistPanel.contents.find((data) => {
        if (data instanceof volumio_youtubei_js_1.YTNodes.PlaylistPanelVideoWrapper) {
            if (data.primary?.video_id === videoId) {
                return true;
            }
            return data.counterpart?.find((item) => item.video_id === videoId);
        }
        else if (data instanceof volumio_youtubei_js_1.YTNodes.PlaylistPanelVideo) {
            return data.video_id === videoId;
        }
    });
    return InnertubeResultParser_1.default.parseContentItem(match);
}, _MusicItemModel_getLyricsId = async function _MusicItemModel_getLyricsId(videoId) {
    const { innertube } = await this.getInnertube();
    const response = await innertube.actions.execute('/next', {
        videoId,
        client: 'YTMUSIC_ANDROID'
    });
    const parsed = volumio_youtubei_js_1.Parser.parseResponse(response.data);
    const tabs = parsed.contents_memo?.getType(volumio_youtubei_js_1.YTNodes.Tab);
    const tab = tabs?.matchCondition((tab) => tab.endpoint.payload.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType === 'MUSIC_PAGE_TYPE_TRACK_LYRICS');
    if (!tab) {
        throw Error('Could not find lyrics tab.');
    }
    const lyricsId = tab.endpoint.payload.browseId;
    if (!lyricsId) {
        throw Error('No lyrics ID found in endpoint');
    }
    return lyricsId;
};
//# sourceMappingURL=MusicItemModel.js.map