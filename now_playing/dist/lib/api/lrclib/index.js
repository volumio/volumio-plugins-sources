"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const NowPlayingContext_1 = __importDefault(require("../../NowPlayingContext"));
const API_GET_URL = 'https://lrclib.net/api/get';
async function apiGet(params) {
    const urlObj = new URL(API_GET_URL);
    urlObj.searchParams.set('track_name', params.songTitle);
    urlObj.searchParams.set('artist_name', params.artistName);
    urlObj.searchParams.set('album_name', params.albumTitle);
    urlObj.searchParams.set('duration', params.duration.toString());
    NowPlayingContext_1.default.getLogger().info(`[now-playing] LRCLIB getLyrics() API URL: ${urlObj.toString()}`);
    try {
        const response = await (0, node_fetch_1.default)(urlObj, { method: 'GET' });
        if (response.ok) {
            return response.json();
        }
        throw Error(`Response error: ${response.status} - ${response.statusText}`);
    }
    catch (error) {
        NowPlayingContext_1.default.getLogger().error(NowPlayingContext_1.default.getErrorMessage(`[now-playing] Error fetching lyrics from LRCLIB (URL: ${urlObj.toString()}):`, error));
        return null;
    }
}
class LRCLibAPI {
    static async getLyrics(songTitle, albumTitle, artistName, duration) {
        if (!albumTitle || !artistName || !duration) {
            return null;
        }
        NowPlayingContext_1.default.getLogger().info(`[now-playing] LRCLIB getLyrics(): song: "${songTitle}" album: "${albumTitle}" artist: "${artistName}" duration: "${duration}"`);
        const result = await apiGet({ songTitle, artistName, albumTitle, duration });
        if (result?.syncedLyrics) {
            const lines = result.syncedLyrics.split('\n').reduce((r, l) => {
                const regex = /\[(\d+):(\d+)\.(\d+)\](.+)/gm;
                const matches = regex.exec(l);
                if (matches) {
                    // Simple LRC format
                    const min = matches[1];
                    const sec = matches[2];
                    const fsec = matches[3]; // 100th of a second
                    const text = matches[4]?.trim();
                    if (min !== undefined && sec !== undefined && fsec !== undefined && text) {
                        const ts = (((Number(min) * 60) + Number(sec)) * 1000) + (Number(fsec) * 10);
                        if (!isNaN(ts)) {
                            r.push({
                                start: ts,
                                text
                            });
                        }
                    }
                }
                return r;
            }, []);
            return {
                type: 'synced',
                lines
            };
        }
        if (result?.plainLyrics) {
            return {
                type: 'plain',
                lines: result.plainLyrics.split('\n')
            };
        }
        return null;
    }
}
exports.default = LRCLibAPI;
//# sourceMappingURL=index.js.map