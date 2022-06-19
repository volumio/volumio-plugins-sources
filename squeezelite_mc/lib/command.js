const { sendRpcRequest } = require("./rpc");
const { getServerConnectParams } = require("./util");

class CommandDispatcher {
  constructor(player, serverCredentials) {
    this.playerId = player.id;
    this.rpcConnectParams = getServerConnectParams(player.server, serverCredentials, 'rpc');
  }

  async sendPlay() {
    return sendRpcRequest(this.rpcConnectParams, [
      this.playerId,
      ['play']
    ]);
  }
  
  async sendPause() {
    return sendRpcRequest(this.rpcConnectParams, [
      this.playerId,
      ['pause']
    ]);
  }
  
  async sendStop() {
    return sendRpcRequest(this.rpcConnectParams, [
      this.playerId,
      ['stop']
    ]);
  }
  
  async sendNext() {
    return sendRpcRequest(this.rpcConnectParams, [
      this.playerId,
      ['button', 'jump_fwd']
    ]);
  }
  
  async sendPrevious() {
    return sendRpcRequest(this.rpcConnectParams, [
      this.playerId,
      ['button', 'jump_rew']
    ]);
  }
  
  async sendSeek(time) {
    return sendRpcRequest(this.rpcConnectParams, [
      this.playerId,
      ['time', time / 1000]
    ]);
  }
 
  async sendRepeat(value) {
    return sendRpcRequest(this.rpcConnectParams, [
      this.playerId,
      ['playlist', 'repeat', value]
    ]);
  }

  async sendShuffle(value) {
    return sendRpcRequest(this.rpcConnectParams, [
      this.playerId,
      ['playlist', 'shuffle', value]
    ]);
  }

  async sendVolume(value) {
    return sendRpcRequest(this.rpcConnectParams, [
      this.playerId,
      ['mixer', 'volume', value]
    ]);
  }

  async sendPref(prefName, value) {
    return sendRpcRequest(this.rpcConnectParams, [
      this.playerId,
      ['playerpref', prefName, value]
    ]);
  }
}

module.exports = {
  CommandDispatcher
};
