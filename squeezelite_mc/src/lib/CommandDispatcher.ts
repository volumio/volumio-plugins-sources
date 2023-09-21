import { sendRpcRequest } from './RPC';
import { ServerConnectParams, getServerConnectParams } from './Util';
import Player from './types/Player';
import { ServerCredentials } from './types/Server';

export default class CommandDispatcher {
  #playerId: string;
  #rpcConnectParams: ServerConnectParams;

  constructor(player: Player, serverCredentials: ServerCredentials) {
    this.#playerId = player.id;
    this.#rpcConnectParams = getServerConnectParams(player.server, serverCredentials, 'rpc');
  }

  async sendPlay() {
    return sendRpcRequest(this.#rpcConnectParams, [
      this.#playerId,
      [ 'play' ]
    ]);
  }

  async sendPause() {
    return sendRpcRequest(this.#rpcConnectParams, [
      this.#playerId,
      [ 'pause' ]
    ]);
  }

  async sendStop() {
    return sendRpcRequest(this.#rpcConnectParams, [
      this.#playerId,
      [ 'stop' ]
    ]);
  }

  async sendNext() {
    return sendRpcRequest(this.#rpcConnectParams, [
      this.#playerId,
      [ 'button', 'jump_fwd' ]
    ]);
  }

  async sendPrevious() {
    return sendRpcRequest(this.#rpcConnectParams, [
      this.#playerId,
      [ 'button', 'jump_rew' ]
    ]);
  }

  async sendSeek(time: number) {
    return sendRpcRequest(this.#rpcConnectParams, [
      this.#playerId,
      [ 'time', time / 1000 ]
    ]);
  }

  async sendRepeat(value: number) {
    return sendRpcRequest(this.#rpcConnectParams, [
      this.#playerId,
      [ 'playlist', 'repeat', value ]
    ]);
  }

  async sendShuffle(value: number) {
    return sendRpcRequest(this.#rpcConnectParams, [
      this.#playerId,
      [ 'playlist', 'shuffle', value ]
    ]);
  }

  async sendVolume(value: number) {
    return sendRpcRequest(this.#rpcConnectParams, [
      this.#playerId,
      [ 'mixer', 'volume', value ]
    ]);
  }

  async sendPref(prefName: string, value: any) {
    return sendRpcRequest(this.#rpcConnectParams, [
      this.#playerId,
      [ 'playerpref', prefName, value ]
    ]);
  }
}
