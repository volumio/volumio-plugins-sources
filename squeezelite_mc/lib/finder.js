const serverDiscovery = require('lms-discovery');
const { NotificationListener } = require('lms-cli-notifications');
const EventEmitter = require('events');
const { getServerConnectParams } = require('./util');
const { sendRpcRequest } = require('./rpc');
const sm = require(squeezeliteMCPluginLibRoot + '/sm');

const STARTED = 'started';
const STOPPED = 'stopped';

class PlayerFinder extends EventEmitter {

  constructor() {
    super();
    this.status = STOPPED;
    this.foundPlayers = [];
    this.notificationListeners = {};
  }

  async start(opts = {}) {
    /**
     * opts: {
     *   serverCredentials: {
     *     serverName: {
     *       username:
     *       password:
     *     }.
     *     ...
     *   },
     *   eventFilter: {  // only emit events if match criteria
     *     playerIP: [ip1, ip2, ...]
     *     playerName: [name1, name2, ...],
     *     playerId: [id1, id2, ...]
     *   }
     * }
     * 
     */
    this.opts = opts;

    // Start server discovery
    /*serverDiscovery.setDebug(true, (msg) => {
      sm.getLogger().info('[squeezelite_mc] ' + msg);
    });*/
    serverDiscovery.on('discovered', this._handleServerDiscovered.bind(this));
    serverDiscovery.on('lost', this._handleServerLost.bind(this));
    serverDiscovery.start();
    sm.getLogger().info(`[squeezelite_mc] Server discovery started`);
    this.status = STARTED;
    sm.getLogger().info(`[squeezelite_mc] Player finder started`);
  }

  async stop() {
    serverDiscovery.off('discovered');
    serverDiscovery.off('lost');
    serverDiscovery.stop();
    const promises = Object.values(this.notificationListeners).map((listener) => {
      listener.off('notification');
      listener.off('disconnect');
      return listener.stop();
    });
    await Promise.all(promises);
    this.foundPlayers = {};
    this.notificationListeners = {};
    this.status = STOPPED;
  }

  getStatus() {
    return this.status;
  }

  async _getPlayersOnServer(server) {
    try {
      sm.getLogger().info(`[squeezelite_mc] Getting players connected to ${server.name} (${server.ip})`);
      const serverStatus = await this._requestServerStatus(server);
      if (serverStatus.result && serverStatus.result.players_loop) {
        // Filter out players with Id '00:00:00:00:00:00', because it could well 
        // be due to Squeezelite starting before network is initialized. If
        // this happens to multiple Squeezlite devices, this will mess up the
        // finder (server will also probably be messed up, but that's not something
        // we can deal with here).
        const result = serverStatus.result.players_loop
          .filter((player) => player.connected && player.playerid !== '00:00:00:00:00:00')
          .map((player) => ({
            id: player.playerid,
            uuid: player.uuid,
            ip: player.ip.split(':')[0],
            name: player.name,
          }));
        sm.getLogger().info(`[squeezelite_mc] Players connected to ${server.name} (${server.ip}): ${JSON.stringify(result)}`);
        return result;
      }
      return [];
    } catch (error) {
      sm.getLogger().error(sm.getErrorMessage(`[squeezelite_mc] Failed to get players on server ${server.name} (${server.ip}):`, error));
      this.emit('error', sm.getErrorMessage(sm.getI18n('SQUEEZELITE_MC_ERR_SERVER_REQUEST', server.name, server.ip), error, false));
      throw error;
    }
  }

  async _handleServerDiscovered(data) {
    const server = {
      ip: data.ip,
      name: data.name,
      ver: data.ver,
      uuid: data.uuid,
      jsonPort: data.jsonPort,
      cliPort: data.cliPort
    };
    sm.getLogger().info(`[squeezelite_mc] Server discovered: ${JSON.stringify(server)}`);

    try {
      this.notificationListeners[server.ip] = await this._createAndStartNotificationListener(server);

      const players = await this._getPlayersOnServer(server);
      // During await _getPlayersOnServer(), notificationListener could have detected player connections and
      // added them to the list of found players. We need to filter them out.
      const found = players
        .filter((player) => !this._isPlayerConnected(player.id, server))
        .map((player) => ({
          ...player,
          server
        }));
      if (found.length > 0) {
        this.foundPlayers.push(...found);
        this._filterAndEmit(found, 'found');
      }
    } catch (error) {
      sm.getLogger().error(sm.getErrorMessage(`[squeezelite_mc] An error occurred while processing discovered server:`, error));
    }
  }

  async _handleServerLost(server) {
    sm.getLogger().info(`[squeezelite_mc] Server lost: ${JSON.stringify(server)}`);
    const lost = this.foundPlayers.filter((player) => player.server.ip === server.ip);
    this.foundPlayers = this.foundPlayers.filter((player) => player.server.ip !== server.ip);
    if (lost.length > 0) {
      this._filterAndEmit(lost, 'lost');
    }
    const notificationListener = this.notificationListeners[server.ip];
    if (notificationListener) {
      notificationListener.off('notification');
      notificationListener.off('disconnect');
      delete this.notificationListeners[server.ip];
      if (notificationListener.isConnected()) {
        await notificationListener.stop();
      }
    }
  }

  _removeAndEmitLostByPlayerId(id) {
    const foundIndex = this.foundPlayers.findIndex((player) => id === player.id);
    if (foundIndex >= 0) {
      const lost = this.foundPlayers.splice(foundIndex, 1);
      this._filterAndEmit(lost, 'lost');
    }
  }

  _isPlayerConnected(playerId, server) {
    return this.foundPlayers.findIndex((player) => (player.id === playerId) && (player.server.ip === server.ip)) >= 0;
  }

  async _handleNotification(server, data) {
    const {notification, playerId, params} = data;
    if (notification === 'client' && playerId && params.length > 0) {
      const type = (params[0] === 'new' || params[0] === 'reconnect') ? 'connect' :
        params[0] === 'disconnect' ? 'disconnect' : null;
      sm.getLogger().info(`[squeezelite_mc] 'client' notification received from ${server.name} (${server.ip}); type is '${type}'`);
      if (type === 'connect' && !this._isPlayerConnected(playerId, server)) {
        this._removeAndEmitLostByPlayerId(playerId);
        const players = await this._getPlayersOnServer(server);
        const found = players.find((player) => player.id === playerId);
        if (found) {
          found.server = server;
          this.foundPlayers.push(found);
          this._filterAndEmit([found], 'found');
        }
      }
      else if (type === 'disconnect') {
        this._removeAndEmitLostByPlayerId(playerId);
      }
    }
  }

  _filterAndEmit(players, eventName) {
    const eventFilter = this.opts.eventFilter;
    if (!eventFilter) {
      this.emit(eventName, players);
      return;
    }
    const predicates = [];
    if (eventFilter.playerIP) {
      predicates.push(Array.isArray(eventFilter.playerIP) ? 
        (player) => eventFilter.playerIP.includes(player.ip) : (player) => (eventFilter.playerIP === player.ip));
    }
    if (eventFilter.playerName) {
      predicates.push(Array.isArray(eventFilter.playerName) ? 
        (player) => eventFilter.playerName.includes(player.name) : (player) => (eventFilter.playerName === player.name));
    }
    if (eventFilter.playerId) {
      predicates.push(Array.isArray(eventFilter.playerId) ? 
        (player) => eventFilter.playerId.includes(player.id) : (player) => (eventFilter.playerId === player.id));
    }
    let filtered = players;
    for (let i = 0; i < predicates.length; i++) {
      filtered = filtered.filter(predicates[i]);
    }

    if (filtered.length > 0) {
      this.emit(eventName, filtered);
    }
  }


  async _createAndStartNotificationListener(server, subscribe = 'client') {
    const connectParams = getServerConnectParams(server, this.opts.serverCredentials, 'cli');
    const notificationListener = new NotificationListener({
      server: connectParams,
      subscribe
    });
    notificationListener.on('notification', this._handleNotification.bind(this, server));
    notificationListener.on('disconnect', this._handleServerLost.bind(this, server));
    try {
      await notificationListener.start();
      sm.getLogger().info(`[squeezelite_mc] Notification listener started`);
      return notificationListener;
    } catch (error) {
      sm.getLogger().error(sm.getErrorMessage(`[squeezelite_mc] Failed to start notification listener on ${server.name} (${server.ip}):`, error));
      this.emit('error', sm.getErrorMessage(sm.getI18n('SQUEEZELITE_MC_ERR_SERVER_REQUEST', server.name, server.ip), error, false));
      throw error;
    }
  }

  async _requestServerStatus(server) {
    const connectParams = getServerConnectParams(server, this.opts.serverCredentials, 'rpc');
    return sendRpcRequest(connectParams, [
      '',
      [
        'serverstatus',
        0,
        999
      ]
    ]);
  }
}

PlayerFinder.STARTED = STARTED;
PlayerFinder.STOPPED = STOPPED;

module.exports = {
  PlayerFinder
};
