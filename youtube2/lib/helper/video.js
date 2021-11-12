'use strict';

const libQ = require('kew');
const ytdl = require('ytdl-core');
const ytmpl = require('yt-mix-playlist');
const request = require('request');
const yt2 = require(yt2PluginLibRoot + '/youtube2');

class VideoHelper {

    static getPlaybackInfo(videoId, rt = 5) {
        let ytdlInfo = libQ.defer();

        yt2.getLogger().info(`[youtube2-videohelper] Obtaining info for videoId ${ videoId }...`);

        ytdl.cache.info.clear();
        ytdl.cache.watch.clear();
        
        ytdl.getInfo(videoId).then( (info) => {
            // Audio
            let audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
            let highestAudioFormat = ytdl.chooseFormat(audioFormats, {
                quality: 'highest'
            });

            // Up Next video
            let upNextVideoId;
            try {
                upNextVideoId = info.response.contents.twoColumnWatchNextResults.autoplay.autoplay.sets[0].autoplayVideo.watchEndpoint.videoId || null;
            } catch (error) {
                upNextVideoId = null;
            }

            ytdlInfo.resolve({
                audioUrl: highestAudioFormat.url,
                upNextVideoId: upNextVideoId,
                relatedVideos: info.related_videos
            });
        }).catch( (error) => {
            ytdlInfo.reject(error);
        });

        return ytdlInfo.then( info => {
            // Sometimes ytdl returns audio URL that is 403-Forbidden.
            // Check and retry if encountered (up to five times).
            yt2.getLogger().info('[youtube2-videohelper] Checking audio URL...');
            let checkAudioUrl = libQ.defer();
            request.head(info.audioUrl, (error, response) => {
                if (error) {
                    checkAudioUrl.reject(error);
                }
                else if (response.statusCode === 403) {
                    let error = new Error('Audio URL returns 403 Forbidden');
                    error.statusCode = 403;
                    checkAudioUrl.reject(error);
                }
                else if (response.statusCode === 404) { // Might as well handle 404...
                    let error = new Error('Audio URL returns 404 Not Found');
                    error.statusCode = 404;
                    checkAudioUrl.reject(error);
                }
                else {
                    yt2.getLogger().info(`[youtube2-videohelper] Audio URL check passed (response status code: ${ response.statusCode })`);
                    checkAudioUrl.resolve(info);
                }
            });

            return checkAudioUrl.then( info => {
                return info;
            }).fail( error => {
                yt2.getLogger().error(`[youtube2-videohelper] Audio URL check failed: ${ error.message }`);
                if (!error.message) {
                    yt2.getLogger().error(error);
                }
                if (rt > 0) {
                    // Retry
                    yt2.getLogger().info('[youtube2-videohelper] Retry with new request...');
                    return this.getPlaybackInfo(videoId, rt - 1);
                }
                else {
                    yt2.getLogger().error('[youtube2-videohelper] Max retries reached. Giving up.');
                    return libQ.reject(error);
                }
            })
        });
    }

    static getMixPlaylist(videoId) {
        let defer = libQ.defer();

        ytmpl(videoId).then( (mixPlaylist) => {
            defer.resolve(mixPlaylist);
        }).catch( (error) => {
            defer.resolve(null);
        });

        return defer.promise;
    }

    static refreshMixPlaylist(mixPlaylist, currentVideoId) {
        let defer = libQ.defer();

        mixPlaylist.select(currentVideoId).then( (updatedPlaylist) => {
            defer.resolve(updatedPlaylist);
        }).catch( (error) => {
            defer.resolve(null);
        });

        return defer.promise;
    }
}

module.exports = VideoHelper;