const { NotificationListener } = require("lms-cli-notifications");
const EventEmitter = require('events');
const AbortController = require("abort-controller");
const { sendRpcRequest } = require("./rpc");
const { getServerConnectParams } = require("./util");
const sm = require(squeezeliteMCPluginLibRoot + '/sm');

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
    this.syncMaster = null;
  }

  async start() {
    this.notificationListener = await this._createAndStartNotificationListener(this.ser)
    this.syncMaster = (await this._getPlayerSyncMaster()).syncMaster;
    if (this.syncMaster) {
      sm.getLogger().info(`[squeezelite_mc] Squeezelite in sync group with sync master ${this.syncMaster}.`);
    }
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
    let preRequestStatus = Promise.resolve();
    if (data.notification === 'sync') {
      if (data.params[0] === '-') {
        if (data.playerId === this.player.id) { // Unsynced
          sm.getLogger().info(`[squeezelite_mc] Squeezelite removed from sync group.`);
          this.syncMaster = null;
        }
        else if (data.playerId === this.syncMaster) { // Sync master itself unsynced
          sm.getLogger().info(`[squeezelite_mc] Squeezelite's sync master (${this.syncMaster}) removed from sync group.`);
          // Need to get updated sync master, if any.
          preRequestStatus = this._getPlayerSyncMaster().then((result) => {
            if (result.syncMaster) {
              sm.getLogger().info(`[squeezelite_mc] Squeezelite is now in sync group with sync master ${result.syncMaster}.`);
            }
            else if (!result.error) {
              sm.getLogger().info(`[squeezelite_mc] Squeezelite is now unsynced or in a sync group with itself as the sync master.`);
            }
            this.syncMaster = result.syncMaster;
          });
        }
      }
      else if (data.params[0] === this.player.id) { // Synced
        this.syncMaster = data.playerId;
        sm.getLogger().info(`[squeezelite_mc] Squeezelite joined sync group with sync master ${this.syncMaster}.`);
      }
    }
    if (data.playerId === this.player.id || data.notification === 'sync' || 
      (this.syncMaster && data.playerId === this.syncMaster)) {
        this._abortCurrentAndPendingStatusRequest();
        preRequestStatus.finally(() => {
          this._abortCurrentAndPendingStatusRequest();
          this.statusRequestTimer = setTimeout(this._getStatusAndEmit.bind(this), 200);
        });
    }
  }

  async _getStatusAndEmit() {
    this._abortCurrentAndPendingStatusRequest();
    this.statusRequestController = new AbortController();

    const playerStatus = await this._requestPlayerStatus(this.statusRequestController);
    if (playerStatus._requestAborted !== undefined && playerStatus._requestAborted) {
      return;
    }
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
      subscribe: ['play', 'stop', 'pause', 'playlist', 'mixer', 'sync']
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

  // If player is in a sync group, then get the master player of the group.
  // Returns null if player is not in a sync group or it is the master player itself.
  async _getPlayerSyncMaster() {
    const connectParams = getServerConnectParams(this.player.server, this.serverCredentials, 'rpc');
    try {
      const status = await sendRpcRequest(connectParams, [
        this.player.id,
        [
          'status'
        ]
      ]);
      return {
        syncMaster: status.result.sync_master !== this.player.id ? status.result.sync_master : null
      };
    } catch (error) {
      sm.getLogger().error(sm.getErrorMessage(`[squeezelite_mc] Error in getting Squeezelite's sync master: `, error));
      return {
        error: error
      };
    }
  }
}

module.exports = {
  PlayerStatusMonitor
};
