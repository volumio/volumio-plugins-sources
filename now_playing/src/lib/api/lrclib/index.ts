import fetch from 'node-fetch';
import { MetadataLyrics, MetadataSyncedLyrics } from 'now-playing-common';
import np from '../../NowPlayingContext';

const API_GET_URL = 'https://lrclib.net/api/get';

export interface LRCLibAPIGetParams {
  songTitle: string;
  artistName: string;
  albumTitle: string;
  duration: number;
}

interface LRCLibAPIGetResult {
  id: number,
  trackName: string,
  artistName: string,
  albumName: string,
  duration: number,
  instrumental: boolean,
  plainLyrics?: string,
  syncedLyrics?: string
}

async function apiGet(params: LRCLibAPIGetParams): Promise<LRCLibAPIGetResult | null> {
  const urlObj = new URL(API_GET_URL);
  urlObj.searchParams.set('track_name', params.songTitle);
  urlObj.searchParams.set('artist_name', params.artistName);
  urlObj.searchParams.set('album_name', params.albumTitle);
  urlObj.searchParams.set('duration', params.duration.toString());
  np.getLogger().info(`[now-playing] LRCLIB getLyrics() API URL: ${urlObj.toString()}`);
  try {
    const response = await fetch(urlObj, { method: 'GET' });
    if (response.ok) {
      return response.json();
    }
    throw Error(`Response error: ${response.status} - ${response.statusText}`);
  }
  catch (error) {
    np.getLogger().error(np.getErrorMessage(`[now-playing] Error fetching lyrics from LRCLIB (URL: ${urlObj.toString()}):`, error));
    return null;
  }
}

export default class LRCLibAPI {

  static async getLyrics(songTitle: string, albumTitle?: string, artistName?: string, duration?: number): Promise<MetadataLyrics | null> {
    if (!albumTitle || !artistName || !duration) {
      return null;
    }
    np.getLogger().info(`[now-playing] LRCLIB getLyrics(): song: "${songTitle}" album: "${albumTitle}" artist: "${artistName}" duration: "${duration}"`);
    const result = await apiGet({ songTitle, artistName, albumTitle, duration });
    if (result?.syncedLyrics) {
      const lines = result.syncedLyrics.split('\n').reduce<MetadataSyncedLyrics['lines']>((r, l) => {
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
