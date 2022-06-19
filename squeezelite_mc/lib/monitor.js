const { NotificationListener } = require("lms-cli-notifications");
const EventEmitter = require('events');
const AbortController = require("abort-controller");
const { sendRpcRequest } = require("./rpc");
const { getServerConnectParams } = require("./util");

class PlayerStatusMonitor extends EventEmitter {
  constructor(player, serverCredentials) {
    /**
     * player - payload of PlayerFinder's 'found' event:
     * {
     *   id: ...,
     *   uuid: ...,
     *   ip: ...,
     *   name: ...,
     *   server: {
     *     ip: ...,
     *     name: ...,
     *     ver: ...,
     *     uuid: ...,
     *     jsonPort: ...,
     *     cliPort: ...
     *   }
     * }
     * 
     * serverCredentials: {
     *   serverName: {
     *     username:
     *     password:
     *   }.
     *   ...
     * }
     */
    super();
    this.player = player;
    this.serverCredentials = serverCredentials;
    this.notificationListener = null;
    this.statusRequestTimer = null;
    this.statusRequestController = null;
  }

  async start() {
    this.notificationListener = await this._createAndStartNotificationListener(this.ser)
    await this._getStatusAndEmit();
  }

  async stop() {
    if (this.notificationListener) {
      await this.notificationListener.stop();
    }
  }

  getPlayer() {
    return this.player;
  }

  requestUpdate() {
    this._getStatusAndEmit();
  }

  _handleDisconnect() {
    if (!this.notificationListener) {
      return;
    }
    this.notificationListener.off('notification');
    this.notificationListener.off('disconnect');
    this.notificationListener = null;
    this._abortCurrentAndPendingStatusRequest();

    this.emit('disconnect', this.player);
  }

  _handleNotification(data) {
    if (data.playerId !== this.player.id) {
      return;
    }
    this._abortCurrentAndPendingStatusRequest();
    this.statusRequestTimer = setTimeout(this._getStatusAndEmit.bind(this), 200);
  }

  async _getStatusAndEmit() {
    this._abortCurrentAndPendingStatusRequest();
    this.statusRequestController = new AbortController();

    const playerStatus = await this._requestPlayerStatus(this.statusRequestController);
    this.emit('update', {
      player: this.player,
      status: playerStatus.result
    });
  }

  _abortCurrentAndPendingStatusRequest() {
    if (this.statusRequestTimer) {
      clearTimeout(this.statusRequestTimer);
      this.statusRequestTimer = null;
    }
    if (this.statusRequestController) {
      this.statusRequestController.abort();
      this.statusRequestController = null;
    }
  }

  async _createAndStartNotificationListener() {
    const notificationListener = new NotificationListener({
      server: getServerConnectParams(this.player.server, this.serverCredentials, 'cli'),
      subscribe: ['play', 'stop', 'pause', 'playlist', 'mixer']
    });
    notificationListener.on('notification', this._handleNotification.bind(this));
    notificationListener.on('disconnect', this._handleDisconnect.bind(this));
    await notificationListener.start();
    return notificationListener;
  }

  async _requestPlayerStatus(abortController) {
    const connectParams = getServerConnectParams(this.player.server, this.serverCredentials, 'rpc');
    return sendRpcRequest(connectParams, [
      this.player.id,
      [
        'status',
        '-',
        1,
        "tags:cgAABbehldiqtyrTISSuoKLNJj"
      ]
    ], abortController);
  } 
}

module.exports = {
  PlayerStatusMonitor
};
