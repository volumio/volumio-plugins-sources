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
var _PlayController_instances, _PlayController_mpdPlugin, _PlayController_connectionManager, _PlayController_mpdPlayerStateListener, _PlayController_monitoredPlaybacks, _PlayController_volumioPushStateListener, _PlayController_volumioPushStateHandler, _PlayController_prefetchPlaybackStateFixer, _PlayController_addListeners, _PlayController_removeListeners, _PlayController_appendTrackTypeToStreamUrl, _PlayController_mpdAddTags, _PlayController_getStreamUrl, _PlayController_doPlay, _PlayController_markPlayed, _PlayController_millisecondsToTicks, _PlayController_apiReportPlayback, _PlayController_handleMpdPlayerEvent, _VolumioPushStateListener_lastState, _PrefetchPlaybackStateFixer_instances, _PrefetchPlaybackStateFixer_positionAtPrefetch, _PrefetchPlaybackStateFixer_prefetchedTrack, _PrefetchPlaybackStateFixer_volumioPushStateListener, _PrefetchPlaybackStateFixer_addPushStateListener, _PrefetchPlaybackStateFixer_removePushStateListener, _PrefetchPlaybackStateFixer_handleVolumioPushState;
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const kew_1 = __importDefault(require("kew"));
const playstate_api_1 = require("@jellyfin/sdk/lib/utils/api/playstate-api");
const JellyfinContext_1 = __importDefault(require("../../JellyfinContext"));
const model_1 = __importStar(require("../../model"));
const ServerHelper_1 = __importDefault(require("../../util/ServerHelper"));
const util_1 = require("../../util");
const ViewHelper_1 = __importDefault(require("../browse/view-handlers/ViewHelper"));
const StopWatch_1 = __importDefault(require("../../util/StopWatch"));
const events_1 = __importDefault(require("events"));
class PlayController {
    constructor(connectionManager) {
        _PlayController_instances.add(this);
        _PlayController_mpdPlugin.set(this, void 0);
        _PlayController_connectionManager.set(this, void 0);
        _PlayController_mpdPlayerStateListener.set(this, void 0);
        _PlayController_monitoredPlaybacks.set(this, void 0);
        _PlayController_volumioPushStateListener.set(this, void 0);
        _PlayController_volumioPushStateHandler.set(this, void 0);
        _PlayController_prefetchPlaybackStateFixer.set(this, void 0);
        __classPrivateFieldSet(this, _PlayController_mpdPlugin, JellyfinContext_1.default.getMpdPlugin(), "f");
        __classPrivateFieldSet(this, _PlayController_connectionManager, connectionManager, "f");
        __classPrivateFieldSet(this, _PlayController_mpdPlayerStateListener, null, "f");
        __classPrivateFieldSet(this, _PlayController_monitoredPlaybacks, { current: null, pending: null }, "f");
        __classPrivateFieldSet(this, _PlayController_volumioPushStateListener, null, "f");
        __classPrivateFieldSet(this, _PlayController_volumioPushStateHandler, null, "f");
        __classPrivateFieldSet(this, _PlayController_prefetchPlaybackStateFixer, new PrefetchPlaybackStateFixer(), "f");
    }
    /**
     * Track uri:
     * jellyfin/{username}@{serverId}/song@songId={songId}
     */
    async clearAddPlayTrack(track) {
        JellyfinContext_1.default.getLogger().info(`[jellyfin-play] clearAddPlayTrack: ${track.uri}`);
        __classPrivateFieldGet(this, _PlayController_prefetchPlaybackStateFixer, "f")?.notifyPrefetchCleared();
        const { song, connection } = await this.getSongFromTrack(track);
        const streamUrl = __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_appendTrackTypeToStreamUrl).call(this, __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getStreamUrl).call(this, song, connection), track.trackType);
        __classPrivateFieldGet(this, _PlayController_monitoredPlaybacks, "f").pending = { song, connection, streamUrl, timer: new StopWatch_1.default() };
        __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_addListeners).call(this);
        await __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_doPlay).call(this, streamUrl, track);
        await __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_markPlayed).call(this, song, connection);
    }
    // Returns kew promise!
    stop() {
        JellyfinContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").stop();
    }
    // Returns kew promise!
    pause() {
        JellyfinContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").pause();
    }
    // Returns kew promise!
    resume() {
        JellyfinContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").resume();
    }
    // Returns kew promise!
    seek(position) {
        JellyfinContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").seek(position);
    }
    // Returns kew promise!
    next() {
        JellyfinContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").next();
    }
    // Returns kew promise!
    previous() {
        JellyfinContext_1.default.getStateMachine().setConsumeUpdateService(undefined);
        return JellyfinContext_1.default.getStateMachine().previous();
    }
    dispose() {
        __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_removeListeners).call(this);
        __classPrivateFieldSet(this, _PlayController_monitoredPlaybacks, { current: null, pending: null }, "f");
        __classPrivateFieldGet(this, _PlayController_prefetchPlaybackStateFixer, "f")?.reset();
        __classPrivateFieldSet(this, _PlayController_prefetchPlaybackStateFixer, null, "f");
    }
    async prefetch(track) {
        const gaplessPlayback = JellyfinContext_1.default.getConfigValue('gaplessPlayback');
        if (!gaplessPlayback) {
            /**
             * Volumio doesn't check whether `prefetch()` is actually performed or
             * successful (such as inspecting the result of the function call) -
             * it just sets its internal state variable `prefetchDone`
             * to `true`. This results in the next track being skipped in cases
             * where prefetch is not performed or fails. So when we want to signal
             * that prefetch is not done, we would have to directly falsify the
             * statemachine's `prefetchDone` variable.
             */
            JellyfinContext_1.default.getLogger().info('[jellyfin-play] Prefetch disabled');
            JellyfinContext_1.default.getStateMachine().prefetchDone = false;
            return;
        }
        let song, connection, streamUrl;
        try {
            ({ song, connection } = await this.getSongFromTrack(track));
            streamUrl = __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_appendTrackTypeToStreamUrl).call(this, __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_getStreamUrl).call(this, song, connection), track.trackType);
        }
        catch (error) {
            JellyfinContext_1.default.getLogger().error(`[jellyfin-play] Prefetch failed: ${error}`);
            JellyfinContext_1.default.getStateMachine().prefetchDone = false;
            return;
        }
        __classPrivateFieldGet(this, _PlayController_monitoredPlaybacks, "f").pending = { song, connection, streamUrl, timer: new StopWatch_1.default() };
        const mpdPlugin = __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f");
        const res = await (0, util_1.kewToJSPromise)(mpdPlugin.sendMpdCommand(`addid "${streamUrl}"`, [])
            .then((addIdResp) => __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_mpdAddTags).call(this, addIdResp, track))
            .then(() => {
            JellyfinContext_1.default.getLogger().info(`[jellyfin-play] Prefetched and added song to MPD queue: ${song.name}`);
            return mpdPlugin.sendMpdCommand('consume 1', []);
        }));
        __classPrivateFieldGet(this, _PlayController_prefetchPlaybackStateFixer, "f")?.notifyPrefetched(track);
        return res;
    }
    async getSongFromTrack(track) {
        const views = ViewHelper_1.default.getViewsFromUri(track.uri);
        const maybeSongView = views.pop();
        const { songId, username, serverId } = maybeSongView;
        if (!songId || !username || !serverId) {
            throw Error(`Invalid track uri: ${track.uri}`);
        }
        const targetServer = ServerHelper_1.default.getOnlineServerByIdAndUsername(serverId, username);
        if (!targetServer) {
            throw Error('Server unavailable');
        }
        const connection = await __classPrivateFieldGet(this, _PlayController_connectionManager, "f").getAuthenticatedConnection(targetServer, username, ServerHelper_1.default.fetchPasswordFromConfig.bind(ServerHelper_1.default));
        const model = model_1.default.getInstance(model_1.ModelType.Song, connection);
        const song = await model.getSong(songId);
        if (!song) {
            throw Error(`Failed to obtain song from track uri: ${track.uri}`);
        }
        return {
            song,
            connection
        };
    }
}
exports.default = PlayController;
_PlayController_mpdPlugin = new WeakMap(), _PlayController_connectionManager = new WeakMap(), _PlayController_mpdPlayerStateListener = new WeakMap(), _PlayController_monitoredPlaybacks = new WeakMap(), _PlayController_volumioPushStateListener = new WeakMap(), _PlayController_volumioPushStateHandler = new WeakMap(), _PlayController_prefetchPlaybackStateFixer = new WeakMap(), _PlayController_instances = new WeakSet(), _PlayController_addListeners = function _PlayController_addListeners() {
    if (!__classPrivateFieldGet(this, _PlayController_mpdPlayerStateListener, "f")) {
        __classPrivateFieldSet(this, _PlayController_mpdPlayerStateListener, __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_handleMpdPlayerEvent).bind(this), "f");
        __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").clientMpd.on('system-player', __classPrivateFieldGet(this, _PlayController_mpdPlayerStateListener, "f"));
    }
    if (!__classPrivateFieldGet(this, _PlayController_volumioPushStateListener, "f")) {
        const psl = __classPrivateFieldSet(this, _PlayController_volumioPushStateListener, new VolumioPushStateListener(), "f");
        __classPrivateFieldSet(this, _PlayController_volumioPushStateHandler, psl.handleVolumioPushState.bind(psl), "f");
        JellyfinContext_1.default.volumioCoreCommand?.addCallback('volumioPushState', __classPrivateFieldGet(this, _PlayController_volumioPushStateHandler, "f"));
    }
}, _PlayController_removeListeners = function _PlayController_removeListeners() {
    if (__classPrivateFieldGet(this, _PlayController_mpdPlayerStateListener, "f")) {
        __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").clientMpd.removeListener('system-player', __classPrivateFieldGet(this, _PlayController_mpdPlayerStateListener, "f"));
        __classPrivateFieldSet(this, _PlayController_mpdPlayerStateListener, null, "f");
    }
    if (__classPrivateFieldGet(this, _PlayController_volumioPushStateListener, "f")) {
        const listeners = JellyfinContext_1.default.volumioCoreCommand?.callbacks?.['volumioPushState'] || [];
        const index = listeners.indexOf(__classPrivateFieldGet(this, _PlayController_volumioPushStateHandler, "f"));
        if (index >= 0) {
            JellyfinContext_1.default.volumioCoreCommand.callbacks['volumioPushState'].splice(index, 1);
        }
        __classPrivateFieldSet(this, _PlayController_volumioPushStateHandler, null, "f");
        __classPrivateFieldSet(this, _PlayController_volumioPushStateListener, null, "f");
    }
}, _PlayController_appendTrackTypeToStreamUrl = function _PlayController_appendTrackTypeToStreamUrl(url, trackType) {
    if (!trackType) {
        return url;
    }
    /**
     * Fool MPD plugin to return correct `trackType` in `parseTrackInfo()` by adding
     * track type to URL query string as a dummy param.
     */
    return `${url}&t.${trackType}`;
}, _PlayController_mpdAddTags = function _PlayController_mpdAddTags(mpdAddIdResponse, track) {
    const songId = mpdAddIdResponse?.Id;
    // Set tags so that songs show the same title, album and artist as Jellyfin.
    // For songs that do not have metadata - either because it's not provided or the
    // Song format does not support it - mpd will return different info than Jellyfin if we do
    // Not set these tags beforehand. This also applies to DSFs - even though they support
    // Metadata, mpd will not read it because doing so incurs extra overhead and delay.
    if (songId !== undefined) {
        const cmdAddTitleTag = {
            command: 'addtagid',
            parameters: [songId, 'title', track.title]
        };
        const cmdAddAlbumTag = {
            command: 'addtagid',
            parameters: [songId, 'album', track.album]
        };
        const cmdAddArtistTag = {
            command: 'addtagid',
            parameters: [songId, 'artist', track.artist]
        };
        return __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").sendMpdCommandArray([cmdAddTitleTag, cmdAddAlbumTag, cmdAddArtistTag]);
    }
    return kew_1.default.resolve();
}, _PlayController_getStreamUrl = function _PlayController_getStreamUrl(song, connection) {
    const source = song.mediaSources?.[0];
    const stream = source?.MediaStreams?.[0];
    if (!stream || !source) {
        throw Error(`No media streams found for song ${song.name}`);
    }
    const container = source.Container ? `.${source.Container}` : '';
    const path = `/Audio/${song.id}/stream${container}`;
    const pathUrlObj = new URL(path, connection.api.basePath);
    pathUrlObj.searchParams.set('static', 'true');
    if (source.Id) {
        pathUrlObj.searchParams.set('mediaSourceId', source.Id);
    }
    if (source.ETag) {
        pathUrlObj.searchParams.set('tag', source.ETag);
    }
    const streamUrl = pathUrlObj.toString();
    const safeUri = streamUrl.replace(/"/g, '\\"');
    JellyfinContext_1.default.getLogger().info(`[jellyfin-play] Stream URL for ${song.name}: ${safeUri}`);
    return safeUri;
}, _PlayController_doPlay = function _PlayController_doPlay(streamUrl, track) {
    const mpdPlugin = __classPrivateFieldGet(this, _PlayController_mpdPlugin, "f");
    return mpdPlugin.sendMpdCommand('stop', [])
        .then(() => {
        return mpdPlugin.sendMpdCommand('clear', []);
    })
        .then(() => {
        return mpdPlugin.sendMpdCommand(`load "${streamUrl}"`, []);
    })
        .fail(() => {
        // Send 'addid' command instead of 'add' to get mpd's Id of the song added.
        // We can then add tags using mpd's song Id.
        return mpdPlugin.sendMpdCommand(`addid "${streamUrl}"`, []);
    })
        .then((addIdResp) => __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_mpdAddTags).call(this, addIdResp, track))
        .then(() => {
        JellyfinContext_1.default.getStateMachine().setConsumeUpdateService('mpd', true, false);
        return mpdPlugin.sendMpdCommand('play', []);
    });
}, _PlayController_markPlayed = async function _PlayController_markPlayed(song, connection) {
    const playstateApi = (0, playstate_api_1.getPlaystateApi)(connection.api);
    try {
        if (!connection.auth?.User?.Id) {
            throw Error('No auth');
        }
        await playstateApi.markPlayedItem({
            userId: connection.auth.User.Id,
            itemId: song.id,
            datePlayed: (new Date()).toUTCString()
        });
        JellyfinContext_1.default.getLogger().info(`[jellyfin-play]: Mark song ${song.name} as played by ${connection.auth.User.Name}.`);
    }
    catch (error) {
        JellyfinContext_1.default.getLogger().info(`[jellyfin-play]: Failed to mark song ${song.name} as played: ${error.message}`);
    }
}, _PlayController_millisecondsToTicks = function _PlayController_millisecondsToTicks(seconds) {
    return seconds * 10000;
}, _PlayController_apiReportPlayback = async function _PlayController_apiReportPlayback(params) {
    const { type, song, connection, seek } = params;
    const positionTicks = __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_millisecondsToTicks).call(this, seek);
    try {
        if (!connection.auth?.User?.Id) {
            throw Error('No auth');
        }
        const playstateApi = (0, playstate_api_1.getPlaystateApi)(connection.api);
        if (type === 'start') {
            await playstateApi.reportPlaybackStart({
                playbackStartInfo: {
                    ItemId: song.id,
                    PositionTicks: positionTicks
                }
            });
        }
        else if (type === 'stop') {
            await playstateApi.reportPlaybackStopped({
                playbackStopInfo: {
                    ItemId: song.id,
                    PositionTicks: positionTicks
                }
            });
        }
        else if (type === 'pause') {
            await playstateApi.reportPlaybackProgress({
                playbackProgressInfo: {
                    ItemId: song.id,
                    IsPaused: true,
                    PositionTicks: positionTicks
                }
            });
        }
        else if (type === 'unpause') {
            await playstateApi.reportPlaybackProgress({
                playbackProgressInfo: {
                    ItemId: song.id,
                    IsPaused: false,
                    PositionTicks: positionTicks
                }
            });
        }
        else { // Type: timeupdate
            await playstateApi.reportPlaybackProgress({
                playbackProgressInfo: {
                    ItemId: song.id,
                    PositionTicks: positionTicks
                }
            });
        }
        JellyfinContext_1.default.getLogger().info(`[jellyfin-play]: Reported '${type}' for song: ${song.name} (at ${seek} ms)`);
    }
    catch (error) {
        JellyfinContext_1.default.getLogger().error(`[jellyfin-play]: Failed to report '${type}' for song '${song.name}': ${error.message}`);
    }
}, _PlayController_handleMpdPlayerEvent = async function _PlayController_handleMpdPlayerEvent() {
    const __apiReportPlayback = (playbackInfo, currentStatus) => {
        const reportPayload = {
            song: playbackInfo.song,
            connection: playbackInfo.connection
        };
        const lastStatus = playbackInfo.lastStatus;
        playbackInfo.lastStatus = currentStatus;
        let reportType;
        let seek;
        switch (currentStatus) {
            case 'pause':
                reportType = 'pause';
                playbackInfo.timer.stop();
                seek = mpdState.seek;
                break;
            case 'play':
                if (lastStatus === 'pause') {
                    reportType = 'unpause';
                }
                else if (lastStatus === 'play') {
                    reportType = 'timeupdate';
                }
                else { // LastStatus: stop
                    reportType = 'start';
                }
                seek = mpdState.seek;
                playbackInfo.timer.start(seek);
                break;
            case 'stop':
            default:
                reportType = 'stop';
                // For 'stop' events, MPD state does not include the seek position.
                // We would have to get this value from playbackInfo's internal timer.
                seek = playbackInfo.timer.stop().getElapsed();
        }
        // Avoid multiple reports of same type
        if (playbackInfo.lastReport?.type === reportType &&
            (reportType !== 'timeupdate' || playbackInfo.lastReport?.seek === seek)) {
            return;
        }
        playbackInfo.lastReport = { type: reportType, seek };
        return __classPrivateFieldGet(this, _PlayController_instances, "m", _PlayController_apiReportPlayback).call(this, { ...reportPayload, seek, type: reportType });
    };
    const __refreshPlayerViewHeartIcon = (favorite) => {
        JellyfinContext_1.default.getStateMachine().emitFavourites({ favourite: favorite });
    };
    const mpdState = await (0, util_1.kewToJSPromise)(__classPrivateFieldGet(this, _PlayController_mpdPlugin, "f").getState());
    // Current stream has not changed
    if (mpdState.uri === __classPrivateFieldGet(this, _PlayController_monitoredPlaybacks, "f").current?.streamUrl) {
        __refreshPlayerViewHeartIcon(__classPrivateFieldGet(this, _PlayController_monitoredPlaybacks, "f").current.song.favorite);
        await __apiReportPlayback(__classPrivateFieldGet(this, _PlayController_monitoredPlaybacks, "f").current, mpdState.status);
    }
    // Stream previously fetched by the plugin and pending playback is now played
    else if (mpdState.uri === __classPrivateFieldGet(this, _PlayController_monitoredPlaybacks, "f").pending?.streamUrl) {
        const pending = __classPrivateFieldGet(this, _PlayController_monitoredPlaybacks, "f").pending;
        __refreshPlayerViewHeartIcon(pending.song.favorite);
        if (__classPrivateFieldGet(this, _PlayController_monitoredPlaybacks, "f").current && __classPrivateFieldGet(this, _PlayController_monitoredPlaybacks, "f").current.lastStatus !== 'stop') {
            await __apiReportPlayback(__classPrivateFieldGet(this, _PlayController_monitoredPlaybacks, "f").current, 'stop');
        }
        __classPrivateFieldGet(this, _PlayController_monitoredPlaybacks, "f").current = {
            ...pending,
            lastStatus: 'stop'
        };
        __classPrivateFieldGet(this, _PlayController_monitoredPlaybacks, "f").pending = null;
        await __apiReportPlayback(__classPrivateFieldGet(this, _PlayController_monitoredPlaybacks, "f").current, mpdState.status);
    }
    // Current stream has changed to one that was not loaded by the plugin
    else if (__classPrivateFieldGet(this, _PlayController_monitoredPlaybacks, "f").current && __classPrivateFieldGet(this, _PlayController_monitoredPlaybacks, "f").current.lastStatus !== 'stop') {
        await __apiReportPlayback(__classPrivateFieldGet(this, _PlayController_monitoredPlaybacks, "f").current, 'stop');
    }
};
/**
 * VolumioPushStateListener exists only to call StateMachine's checkFavourites() when active service changes from 'jellyfin'.
 * The `checkFavorites()` method which will then refresh the 'heart' icon based on whether `state.uri` exists in Volumio favorites.
 * This method is supposed to be called within StateMachine's `pushState()`, but this never happens because it is chained to
 * Volumio commandRouter's `volumioPushState()`, which returns a promise that never resolves due to rest_api plugin not returning a promise
 * within its own pushState().
 * We only call `checKFavourites()` when the service has changed from 'jellyfin' to something else. This is to reinstate the 'heart' icon
 * to Volumio's default behaviour (which should always be 'off' given its current broken implementation).
 */
class VolumioPushStateListener {
    constructor() {
        _VolumioPushStateListener_lastState.set(this, void 0);
        __classPrivateFieldSet(this, _VolumioPushStateListener_lastState, null, "f");
    }
    handleVolumioPushState(state) {
        if (__classPrivateFieldGet(this, _VolumioPushStateListener_lastState, "f")?.service === 'jellyfin' && state.service !== 'jellyfin') {
            JellyfinContext_1.default.getStateMachine().checkFavourites(state);
        }
        __classPrivateFieldSet(this, _VolumioPushStateListener_lastState, state, "f");
    }
}
_VolumioPushStateListener_lastState = new WeakMap();
/**
 * (Taken from YouTube Music plugin)
 * https://github.com/patrickkfkan/volumio-ytmusic/blob/master/src/lib/controller/play/PlayController.ts
 *
 * Given state is updated by calling `setConsumeUpdateService('mpd', true)` (`consumeIgnoreMetadata`: true), when moving to
 * prefetched track there's no guarantee the state machine will store the correct consume state obtained from MPD. It depends on
 * whether the state machine increments `currentPosition` before or after MPD calls `pushState()`. The intended
 * order is 'before' - but because the increment is triggered through a timer, it is possible that MPD calls `pushState()` first,
 * thereby causing the state machine to store the wrong state info (title, artist, album...obtained from trackBlock at
 * `currentPosition` which has not yet been incremented).
 *
 * See state machine `syncState()` and  `increasePlaybackTimer()`.
 *
 * `PrefetchPlaybackStateFixer` checks whether the state is consistent when prefetched track is played and `currentPosition` updated
 * and triggers an MPD `pushState()` if necessary.
 */
class PrefetchPlaybackStateFixer extends events_1.default {
    constructor() {
        super();
        _PrefetchPlaybackStateFixer_instances.add(this);
        _PrefetchPlaybackStateFixer_positionAtPrefetch.set(this, void 0);
        _PrefetchPlaybackStateFixer_prefetchedTrack.set(this, void 0);
        _PrefetchPlaybackStateFixer_volumioPushStateListener.set(this, void 0);
        __classPrivateFieldSet(this, _PrefetchPlaybackStateFixer_positionAtPrefetch, -1, "f");
        __classPrivateFieldSet(this, _PrefetchPlaybackStateFixer_prefetchedTrack, null, "f");
    }
    reset() {
        __classPrivateFieldGet(this, _PrefetchPlaybackStateFixer_instances, "m", _PrefetchPlaybackStateFixer_removePushStateListener).call(this);
        this.removeAllListeners();
    }
    notifyPrefetched(track) {
        __classPrivateFieldSet(this, _PrefetchPlaybackStateFixer_positionAtPrefetch, JellyfinContext_1.default.getStateMachine().currentPosition, "f");
        __classPrivateFieldSet(this, _PrefetchPlaybackStateFixer_prefetchedTrack, track, "f");
        __classPrivateFieldGet(this, _PrefetchPlaybackStateFixer_instances, "m", _PrefetchPlaybackStateFixer_addPushStateListener).call(this);
    }
    notifyPrefetchCleared() {
        __classPrivateFieldGet(this, _PrefetchPlaybackStateFixer_instances, "m", _PrefetchPlaybackStateFixer_removePushStateListener).call(this);
    }
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
    on(event, listener) {
        super.on(event, listener);
        return this;
    }
}
_PrefetchPlaybackStateFixer_positionAtPrefetch = new WeakMap(), _PrefetchPlaybackStateFixer_prefetchedTrack = new WeakMap(), _PrefetchPlaybackStateFixer_volumioPushStateListener = new WeakMap(), _PrefetchPlaybackStateFixer_instances = new WeakSet(), _PrefetchPlaybackStateFixer_addPushStateListener = function _PrefetchPlaybackStateFixer_addPushStateListener() {
    if (!__classPrivateFieldGet(this, _PrefetchPlaybackStateFixer_volumioPushStateListener, "f")) {
        __classPrivateFieldSet(this, _PrefetchPlaybackStateFixer_volumioPushStateListener, __classPrivateFieldGet(this, _PrefetchPlaybackStateFixer_instances, "m", _PrefetchPlaybackStateFixer_handleVolumioPushState).bind(this), "f");
        JellyfinContext_1.default.volumioCoreCommand?.addCallback('volumioPushState', __classPrivateFieldGet(this, _PrefetchPlaybackStateFixer_volumioPushStateListener, "f"));
    }
}, _PrefetchPlaybackStateFixer_removePushStateListener = function _PrefetchPlaybackStateFixer_removePushStateListener() {
    if (__classPrivateFieldGet(this, _PrefetchPlaybackStateFixer_volumioPushStateListener, "f")) {
        const listeners = JellyfinContext_1.default.volumioCoreCommand?.callbacks?.['volumioPushState'] || [];
        const index = listeners.indexOf(__classPrivateFieldGet(this, _PrefetchPlaybackStateFixer_volumioPushStateListener, "f"));
        if (index >= 0) {
            JellyfinContext_1.default.volumioCoreCommand.callbacks['volumioPushState'].splice(index, 1);
        }
        __classPrivateFieldSet(this, _PrefetchPlaybackStateFixer_volumioPushStateListener, null, "f");
        __classPrivateFieldSet(this, _PrefetchPlaybackStateFixer_positionAtPrefetch, -1, "f");
        __classPrivateFieldSet(this, _PrefetchPlaybackStateFixer_prefetchedTrack, null, "f");
    }
}, _PrefetchPlaybackStateFixer_handleVolumioPushState = function _PrefetchPlaybackStateFixer_handleVolumioPushState(state) {
    const sm = JellyfinContext_1.default.getStateMachine();
    const currentPosition = sm.currentPosition;
    if (sm.getState().service !== 'jellyfin') {
        __classPrivateFieldGet(this, _PrefetchPlaybackStateFixer_instances, "m", _PrefetchPlaybackStateFixer_removePushStateListener).call(this);
        return;
    }
    if (__classPrivateFieldGet(this, _PrefetchPlaybackStateFixer_positionAtPrefetch, "f") >= 0 && __classPrivateFieldGet(this, _PrefetchPlaybackStateFixer_positionAtPrefetch, "f") !== currentPosition) {
        const track = sm.getTrack(currentPosition);
        const pf = __classPrivateFieldGet(this, _PrefetchPlaybackStateFixer_prefetchedTrack, "f");
        __classPrivateFieldGet(this, _PrefetchPlaybackStateFixer_instances, "m", _PrefetchPlaybackStateFixer_removePushStateListener).call(this);
        if (track && state && pf && track.service === 'jellyfin' && pf.uri === track.uri) {
            if (state.uri !== track.uri) {
                const mpdPlugin = JellyfinContext_1.default.getMpdPlugin();
                mpdPlugin.getState().then((st) => mpdPlugin.pushState(st));
            }
            this.emit('playPrefetch', {
                track: pf,
                position: currentPosition
            });
        }
    }
};
//# sourceMappingURL=PlayController.js.map