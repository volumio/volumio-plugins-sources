"use strict";
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
var _PlayerFinder_instances, _PlayerFinder_status, _PlayerFinder_foundPlayers, _PlayerFinder_notificationListeners, _PlayerFinder_opts, _PlayerFinder_getPlayersOnServer, _PlayerFinder_handleServerDiscovered, _PlayerFinder_handleServerLost, _PlayerFinder_removeAndEmitLostByPlayerId, _PlayerFinder_isPlayerConnected, _PlayerFinder_handleNotification, _PlayerFinder_filterAndEmit, _PlayerFinder_createAndStartNotificationListener, _PlayerFinder_requestServerStatus;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerFinderStatus = void 0;
const SqueezeliteMCContext_1 = __importDefault(require("./SqueezeliteMCContext"));
const lms_discovery_1 = __importDefault(require("lms-discovery"));
const lms_cli_notifications_1 = require("lms-cli-notifications");
const events_1 = __importDefault(require("events"));
const Util_1 = require("./Util");
const RPC_1 = require("./RPC");
var PlayerFinderStatus;
(function (PlayerFinderStatus) {
    PlayerFinderStatus["Started"] = "started";
    PlayerFinderStatus["Stopped"] = "stopped";
})(PlayerFinderStatus = exports.PlayerFinderStatus || (exports.PlayerFinderStatus = {}));
class PlayerFinder extends events_1.default {
    constructor() {
        super();
        _PlayerFinder_instances.add(this);
        _PlayerFinder_status.set(this, void 0);
        _PlayerFinder_foundPlayers.set(this, void 0);
        _PlayerFinder_notificationListeners.set(this, void 0);
        _PlayerFinder_opts.set(this, void 0);
        __classPrivateFieldSet(this, _PlayerFinder_status, PlayerFinderStatus.Stopped, "f");
        __classPrivateFieldSet(this, _PlayerFinder_foundPlayers, [], "f");
        __classPrivateFieldSet(this, _PlayerFinder_notificationListeners, {}, "f");
    }
    async start(opts = {}) {
        __classPrivateFieldSet(this, _PlayerFinder_opts, opts, "f");
        // Start server discovery
        lms_discovery_1.default.on('discovered', __classPrivateFieldGet(this, _PlayerFinder_instances, "m", _PlayerFinder_handleServerDiscovered).bind(this));
        lms_discovery_1.default.on('lost', __classPrivateFieldGet(this, _PlayerFinder_instances, "m", _PlayerFinder_handleServerLost).bind(this));
        lms_discovery_1.default.start();
        SqueezeliteMCContext_1.default.getLogger().info('[squeezelite_mc] Server discovery started');
        __classPrivateFieldSet(this, _PlayerFinder_status, PlayerFinderStatus.Started, "f");
        SqueezeliteMCContext_1.default.getLogger().info('[squeezelite_mc] Player finder started');
    }
    async stop() {
        lms_discovery_1.default.removeAllListeners('discovered');
        lms_discovery_1.default.removeAllListeners('lost');
        lms_discovery_1.default.stop();
        const promises = Object.values(__classPrivateFieldGet(this, _PlayerFinder_notificationListeners, "f")).map((listener) => {
            listener.removeAllListeners('notification');
            listener.removeAllListeners('disconnect');
            return listener.stop();
        });
        await Promise.all(promises);
        __classPrivateFieldSet(this, _PlayerFinder_foundPlayers, [], "f");
        __classPrivateFieldSet(this, _PlayerFinder_notificationListeners, {}, "f");
        __classPrivateFieldSet(this, _PlayerFinder_status, PlayerFinderStatus.Stopped, "f");
    }
    getStatus() {
        return __classPrivateFieldGet(this, _PlayerFinder_status, "f");
    }
}
exports.default = PlayerFinder;
_PlayerFinder_status = new WeakMap(), _PlayerFinder_foundPlayers = new WeakMap(), _PlayerFinder_notificationListeners = new WeakMap(), _PlayerFinder_opts = new WeakMap(), _PlayerFinder_instances = new WeakSet(), _PlayerFinder_getPlayersOnServer = async function _PlayerFinder_getPlayersOnServer(server) {
    try {
        SqueezeliteMCContext_1.default.getLogger().info(`[squeezelite_mc] Getting players connected to ${server.name} (${server.ip})`);
        const serverStatus = await __classPrivateFieldGet(this, _PlayerFinder_instances, "m", _PlayerFinder_requestServerStatus).call(this, server);
        if (serverStatus.result && serverStatus.result.players_loop) {
            // Filter out players with Id '00:00:00:00:00:00', because it could well
            // Be due to Squeezelite starting before network is initialized. If
            // This happens to multiple Squeezlite devices, this will mess up the
            // Finder (server will also probably be messed up, but that's not something
            // We can deal with here).
            const result = serverStatus.result.players_loop
                .filter((player) => player.connected && player.playerid !== '00:00:00:00:00:00')
                .map((player) => ({
                id: player.playerid,
                uuid: player.uuid,
                ip: player.ip.split(':')[0],
                name: player.name,
                server
            }));
            SqueezeliteMCContext_1.default.getLogger().info(`[squeezelite_mc] Players connected to ${server.name} (${server.ip}): ${JSON.stringify(result)}`);
            return result;
        }
        return [];
    }
    catch (error) {
        SqueezeliteMCContext_1.default.getLogger().error(SqueezeliteMCContext_1.default.getErrorMessage(`[squeezelite_mc] Failed to get players on server ${server.name} (${server.ip}):`, error));
        this.emit('error', SqueezeliteMCContext_1.default.getErrorMessage(SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_ERR_SERVER_REQUEST', server.name, server.ip), error, false));
        throw error;
    }
}, _PlayerFinder_handleServerDiscovered = async function _PlayerFinder_handleServerDiscovered(data) {
    if (!data.cliPort) {
        SqueezeliteMCContext_1.default.getLogger().warn(`[squeezelite_mc] Disregarding discovered server due to missing CLI port: ${JSON.stringify(data)}`);
        return;
    }
    const server = {
        ip: data.ip,
        name: data.name,
        ver: data.ver,
        uuid: data.uuid,
        jsonPort: data.jsonPort,
        cliPort: data.cliPort
    };
    SqueezeliteMCContext_1.default.getLogger().info(`[squeezelite_mc] Server discovered: ${JSON.stringify(server)}`);
    try {
        __classPrivateFieldGet(this, _PlayerFinder_notificationListeners, "f")[server.ip] = await __classPrivateFieldGet(this, _PlayerFinder_instances, "m", _PlayerFinder_createAndStartNotificationListener).call(this, server);
        const players = await __classPrivateFieldGet(this, _PlayerFinder_instances, "m", _PlayerFinder_getPlayersOnServer).call(this, server);
        // During await #getPlayersOnServer(), notificationListener could have detected player connections and
        // Added them to the list of found players. We need to filter them out.
        const found = players.filter((player) => !__classPrivateFieldGet(this, _PlayerFinder_instances, "m", _PlayerFinder_isPlayerConnected).call(this, player.id, server));
        if (found.length > 0) {
            __classPrivateFieldGet(this, _PlayerFinder_foundPlayers, "f").push(...found);
            __classPrivateFieldGet(this, _PlayerFinder_instances, "m", _PlayerFinder_filterAndEmit).call(this, found, 'found');
        }
    }
    catch (error) {
        SqueezeliteMCContext_1.default.getLogger().error(SqueezeliteMCContext_1.default.getErrorMessage('[squeezelite_mc] An error occurred while processing discovered server:', error));
    }
}, _PlayerFinder_handleServerLost = async function _PlayerFinder_handleServerLost(server) {
    SqueezeliteMCContext_1.default.getLogger().info(`[squeezelite_mc] Server lost: ${JSON.stringify(server)}`);
    const lost = __classPrivateFieldGet(this, _PlayerFinder_foundPlayers, "f").filter((player) => player.server.ip === server.ip);
    __classPrivateFieldSet(this, _PlayerFinder_foundPlayers, __classPrivateFieldGet(this, _PlayerFinder_foundPlayers, "f").filter((player) => player.server.ip !== server.ip), "f");
    if (lost.length > 0) {
        __classPrivateFieldGet(this, _PlayerFinder_instances, "m", _PlayerFinder_filterAndEmit).call(this, lost, 'lost');
    }
    const notificationListener = __classPrivateFieldGet(this, _PlayerFinder_notificationListeners, "f")[server.ip];
    if (notificationListener) {
        notificationListener.removeAllListeners('notification');
        notificationListener.removeAllListeners('disconnect');
        delete __classPrivateFieldGet(this, _PlayerFinder_notificationListeners, "f")[server.ip];
        if (notificationListener.isConnected()) {
            await notificationListener.stop();
        }
    }
}, _PlayerFinder_removeAndEmitLostByPlayerId = function _PlayerFinder_removeAndEmitLostByPlayerId(id) {
    const foundIndex = __classPrivateFieldGet(this, _PlayerFinder_foundPlayers, "f").findIndex((player) => id === player.id);
    if (foundIndex >= 0) {
        const lost = __classPrivateFieldGet(this, _PlayerFinder_foundPlayers, "f").splice(foundIndex, 1);
        __classPrivateFieldGet(this, _PlayerFinder_instances, "m", _PlayerFinder_filterAndEmit).call(this, lost, 'lost');
    }
}, _PlayerFinder_isPlayerConnected = function _PlayerFinder_isPlayerConnected(playerId, server) {
    return __classPrivateFieldGet(this, _PlayerFinder_foundPlayers, "f").findIndex((player) => (player.id === playerId) && (player.server.ip === server.ip)) >= 0;
}, _PlayerFinder_handleNotification = async function _PlayerFinder_handleNotification(server, data) {
    const { notification, playerId, params } = data;
    if (notification === 'client' && playerId && params.length > 0) {
        const type = (params[0] === 'new' || params[0] === 'reconnect') ? 'connect' :
            params[0] === 'disconnect' ? 'disconnect' : null;
        SqueezeliteMCContext_1.default.getLogger().info(`[squeezelite_mc] 'client' notification received from ${server.name} (${server.ip}); type is '${type}'`);
        if (type === 'connect' && !__classPrivateFieldGet(this, _PlayerFinder_instances, "m", _PlayerFinder_isPlayerConnected).call(this, playerId, server)) {
            __classPrivateFieldGet(this, _PlayerFinder_instances, "m", _PlayerFinder_removeAndEmitLostByPlayerId).call(this, playerId);
            const players = await __classPrivateFieldGet(this, _PlayerFinder_instances, "m", _PlayerFinder_getPlayersOnServer).call(this, server);
            const found = players.find((player) => player.id === playerId);
            if (found) {
                found.server = server;
                __classPrivateFieldGet(this, _PlayerFinder_foundPlayers, "f").push(found);
                __classPrivateFieldGet(this, _PlayerFinder_instances, "m", _PlayerFinder_filterAndEmit).call(this, [found], 'found');
            }
        }
        else if (type === 'disconnect') {
            __classPrivateFieldGet(this, _PlayerFinder_instances, "m", _PlayerFinder_removeAndEmitLostByPlayerId).call(this, playerId);
        }
    }
}, _PlayerFinder_filterAndEmit = function _PlayerFinder_filterAndEmit(players, eventName) {
    const eventFilter = __classPrivateFieldGet(this, _PlayerFinder_opts, "f").eventFilter;
    if (!eventFilter) {
        this.emit(eventName, players);
        return;
    }
    const predicates = [];
    if (eventFilter.playerIP) {
        const pip = eventFilter.playerIP;
        predicates.push(Array.isArray(pip) ?
            (player) => pip.includes(player.ip) : (player) => (pip === player.ip));
    }
    if (eventFilter.playerName) {
        const pn = eventFilter.playerName;
        predicates.push(Array.isArray(pn) ?
            (player) => pn.includes(player.name) : (player) => (pn === player.name));
    }
    if (eventFilter.playerId) {
        const pid = eventFilter.playerId;
        predicates.push(Array.isArray(pid) ?
            (player) => pid.includes(player.id) : (player) => (pid === player.id));
    }
    let filtered = players;
    for (let i = 0; i < predicates.length; i++) {
        filtered = filtered.filter(predicates[i]);
    }
    if (filtered.length > 0) {
        this.emit(eventName, filtered);
    }
}, _PlayerFinder_createAndStartNotificationListener = async function _PlayerFinder_createAndStartNotificationListener(server, subscribe = 'client') {
    const connectParams = (0, Util_1.getServerConnectParams)(server, __classPrivateFieldGet(this, _PlayerFinder_opts, "f").serverCredentials, 'cli');
    const notificationListener = new lms_cli_notifications_1.NotificationListener({
        server: {
            ...connectParams
        },
        subscribe
    });
    notificationListener.on('notification', __classPrivateFieldGet(this, _PlayerFinder_instances, "m", _PlayerFinder_handleNotification).bind(this, server));
    notificationListener.on('disconnect', __classPrivateFieldGet(this, _PlayerFinder_instances, "m", _PlayerFinder_handleServerLost).bind(this, server));
    try {
        await notificationListener.start();
        SqueezeliteMCContext_1.default.getLogger().info('[squeezelite_mc] Notification listener started');
        return notificationListener;
    }
    catch (error) {
        SqueezeliteMCContext_1.default.getLogger().error(SqueezeliteMCContext_1.default.getErrorMessage(`[squeezelite_mc] Failed to start notification listener on ${server.name} (${server.ip}):`, error));
        this.emit('error', SqueezeliteMCContext_1.default.getErrorMessage(SqueezeliteMCContext_1.default.getI18n('SQUEEZELITE_MC_ERR_SERVER_REQUEST', server.name, server.ip), error, false));
        throw error;
    }
}, _PlayerFinder_requestServerStatus = async function _PlayerFinder_requestServerStatus(server) {
    const connectParams = (0, Util_1.getServerConnectParams)(server, __classPrivateFieldGet(this, _PlayerFinder_opts, "f").serverCredentials, 'rpc');
    return (0, RPC_1.sendRpcRequest)(connectParams, [
        '',
        [
            'serverstatus',
            0,
            999
        ]
    ]);
};
//# sourceMappingURL=PlayerFinder.js.map