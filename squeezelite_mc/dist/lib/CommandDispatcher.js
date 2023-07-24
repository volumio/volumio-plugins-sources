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
var _CommandDispatcher_playerId, _CommandDispatcher_rpcConnectParams;
Object.defineProperty(exports, "__esModule", { value: true });
const RPC_1 = require("./RPC");
const Util_1 = require("./Util");
class CommandDispatcher {
    constructor(player, serverCredentials) {
        _CommandDispatcher_playerId.set(this, void 0);
        _CommandDispatcher_rpcConnectParams.set(this, void 0);
        __classPrivateFieldSet(this, _CommandDispatcher_playerId, player.id, "f");
        __classPrivateFieldSet(this, _CommandDispatcher_rpcConnectParams, (0, Util_1.getServerConnectParams)(player.server, serverCredentials, 'rpc'), "f");
    }
    async sendPlay() {
        return (0, RPC_1.sendRpcRequest)(__classPrivateFieldGet(this, _CommandDispatcher_rpcConnectParams, "f"), [
            __classPrivateFieldGet(this, _CommandDispatcher_playerId, "f"),
            ['play']
        ]);
    }
    async sendPause() {
        return (0, RPC_1.sendRpcRequest)(__classPrivateFieldGet(this, _CommandDispatcher_rpcConnectParams, "f"), [
            __classPrivateFieldGet(this, _CommandDispatcher_playerId, "f"),
            ['pause']
        ]);
    }
    async sendStop() {
        return (0, RPC_1.sendRpcRequest)(__classPrivateFieldGet(this, _CommandDispatcher_rpcConnectParams, "f"), [
            __classPrivateFieldGet(this, _CommandDispatcher_playerId, "f"),
            ['stop']
        ]);
    }
    async sendNext() {
        return (0, RPC_1.sendRpcRequest)(__classPrivateFieldGet(this, _CommandDispatcher_rpcConnectParams, "f"), [
            __classPrivateFieldGet(this, _CommandDispatcher_playerId, "f"),
            ['button', 'jump_fwd']
        ]);
    }
    async sendPrevious() {
        return (0, RPC_1.sendRpcRequest)(__classPrivateFieldGet(this, _CommandDispatcher_rpcConnectParams, "f"), [
            __classPrivateFieldGet(this, _CommandDispatcher_playerId, "f"),
            ['button', 'jump_rew']
        ]);
    }
    async sendSeek(time) {
        return (0, RPC_1.sendRpcRequest)(__classPrivateFieldGet(this, _CommandDispatcher_rpcConnectParams, "f"), [
            __classPrivateFieldGet(this, _CommandDispatcher_playerId, "f"),
            ['time', time / 1000]
        ]);
    }
    async sendRepeat(value) {
        return (0, RPC_1.sendRpcRequest)(__classPrivateFieldGet(this, _CommandDispatcher_rpcConnectParams, "f"), [
            __classPrivateFieldGet(this, _CommandDispatcher_playerId, "f"),
            ['playlist', 'repeat', value]
        ]);
    }
    async sendShuffle(value) {
        return (0, RPC_1.sendRpcRequest)(__classPrivateFieldGet(this, _CommandDispatcher_rpcConnectParams, "f"), [
            __classPrivateFieldGet(this, _CommandDispatcher_playerId, "f"),
            ['playlist', 'shuffle', value]
        ]);
    }
    async sendVolume(value) {
        return (0, RPC_1.sendRpcRequest)(__classPrivateFieldGet(this, _CommandDispatcher_rpcConnectParams, "f"), [
            __classPrivateFieldGet(this, _CommandDispatcher_playerId, "f"),
            ['mixer', 'volume', value]
        ]);
    }
    async sendPref(prefName, value) {
        return (0, RPC_1.sendRpcRequest)(__classPrivateFieldGet(this, _CommandDispatcher_rpcConnectParams, "f"), [
            __classPrivateFieldGet(this, _CommandDispatcher_playerId, "f"),
            ['playerpref', prefName, value]
        ]);
    }
}
exports.default = CommandDispatcher;
_CommandDispatcher_playerId = new WeakMap(), _CommandDispatcher_rpcConnectParams = new WeakMap();
//# sourceMappingURL=CommandDispatcher.js.map