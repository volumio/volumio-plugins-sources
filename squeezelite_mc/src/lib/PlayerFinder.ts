import sm from './SqueezeliteMCContext';
import serverDiscovery, { ServerInfo } from 'lms-discovery';
import { Notification, NotificationListener } from 'lms-cli-notifications';
import EventEmitter from 'events';
import Player from './types/Player';
import Server, { ServerCredentials } from './types/Server';
import { getServerConnectParams } from './Util';
import { sendRpcRequest } from './RPC';

export enum PlayerFinderStatus {
  Started = 'started',
  Stopped = 'stopped'
}

export interface PlayerFinderOptions {
  serverCredentials?: ServerCredentials;
  // Emit events only when player matches criteria
  eventFilter?: {
    playerIP?: string | string[],
    playerName?: string | string[],
    playerId?: string | string[]
  };
}

export default class PlayerFinder extends EventEmitter {
  #status: PlayerFinderStatus;
  #foundPlayers: Player[];
  #notificationListeners: {
    [serverIp: string]: NotificationListener;
  };
  #opts: PlayerFinderOptions;

  constructor() {
    super();
    this.#status = PlayerFinderStatus.Stopped;
    this.#foundPlayers = [];
    this.#notificationListeners = {};
  }

  async start(opts: PlayerFinderOptions = {}) {
    this.#opts = opts;

    // Start server discovery
    serverDiscovery.on('discovered', this.#handleServerDiscovered.bind(this));
    serverDiscovery.on('lost', this.#handleServerLost.bind(this));
    serverDiscovery.start();
    sm.getLogger().info('[squeezelite_mc] Server discovery started');
    this.#status = PlayerFinderStatus.Started;
    sm.getLogger().info('[squeezelite_mc] Player finder started');
  }

  async stop() {
    serverDiscovery.removeAllListeners('discovered');
    serverDiscovery.removeAllListeners('lost');
    serverDiscovery.stop();
    const promises = Object.values(this.#notificationListeners).map((listener) => {
      listener.removeAllListeners('notification');
      listener.removeAllListeners('disconnect');
      return listener.stop();
    });
    await Promise.all(promises);
    this.#foundPlayers = [];
    this.#notificationListeners = {};
    this.#status = PlayerFinderStatus.Stopped;
  }

  getStatus() {
    return this.#status;
  }

  async #getPlayersOnServer(server: Server): Promise<Player[]> {
    try {
      sm.getLogger().info(`[squeezelite_mc] Getting players connected to ${server.name} (${server.ip})`);
      const serverStatus = await this.#requestServerStatus(server);
      if (serverStatus.result && serverStatus.result.players_loop) {
        // Filter out players with Id '00:00:00:00:00:00', because it could well
        // Be due to Squeezelite starting before network is initialized. If
        // This happens to multiple Squeezlite devices, this will mess up the
        // Finder (server will also probably be messed up, but that's not something
        // We can deal with here).
        const result = serverStatus.result.players_loop
          .filter((player: any) => player.connected && player.playerid !== '00:00:00:00:00:00')
          .map((player: any) => ({
            id: player.playerid,
            uuid: player.uuid,
            ip: player.ip.split(':')[0],
            name: player.name,
            server
          }));
        sm.getLogger().info(`[squeezelite_mc] Players connected to ${server.name} (${server.ip}): ${JSON.stringify(result)}`);
        return result;
      }
      return [];
    }
    catch (error) {
      sm.getLogger().error(sm.getErrorMessage(`[squeezelite_mc] Failed to get players on server ${server.name} (${server.ip}):`, error));
      this.emit('error', sm.getErrorMessage(sm.getI18n('SQUEEZELITE_MC_ERR_SERVER_REQUEST', server.name, server.ip), error, false));
      throw error;
    }
  }

  async #handleServerDiscovered(data: ServerInfo | Server) {
    if (!data.cliPort) {
      sm.getLogger().warn(`[squeezelite_mc] Disregarding discovered server due to missing CLI port: ${JSON.stringify(data)}`);
      return;
    }
    const server: Server = {
      ip: data.ip,
      name: data.name,
      ver: data.ver,
      uuid: data.uuid,
      jsonPort: data.jsonPort,
      cliPort: data.cliPort
    };
    sm.getLogger().info(`[squeezelite_mc] Server discovered: ${JSON.stringify(server)}`);

    try {
      this.#notificationListeners[server.ip] = await this.#createAndStartNotificationListener(server);
      const players = await this.#getPlayersOnServer(server);
      // During await #getPlayersOnServer(), notificationListener could have detected player connections and
      // Added them to the list of found players. We need to filter them out.
      const found = players.filter((player) => !this.#isPlayerConnected(player.id, server));
      if (found.length > 0) {
        this.#foundPlayers.push(...found);
        this.#filterAndEmit(found, 'found');
      }
    }
    catch (error) {
      sm.getLogger().error(sm.getErrorMessage('[squeezelite_mc] An error occurred while processing discovered server:', error));
    }
  }

  async #handleServerLost(server: ServerInfo | Server) {
    sm.getLogger().info(`[squeezelite_mc] Server lost: ${JSON.stringify(server)}`);
    const lost = this.#foundPlayers.filter((player) => player.server.ip === server.ip);
    this.#foundPlayers = this.#foundPlayers.filter((player) => player.server.ip !== server.ip);
    if (lost.length > 0) {
      this.#filterAndEmit(lost, 'lost');
    }
    const notificationListener = this.#notificationListeners[server.ip];
    if (notificationListener) {
      notificationListener.removeAllListeners('notification');
      notificationListener.removeAllListeners('disconnect');
      delete this.#notificationListeners[server.ip];
      if (notificationListener.isConnected()) {
        await notificationListener.stop();
      }
    }
  }

  #removeAndEmitLostByPlayerId(id: string) {
    const foundIndex = this.#foundPlayers.findIndex((player) => id === player.id);
    if (foundIndex >= 0) {
      const lost = this.#foundPlayers.splice(foundIndex, 1);
      this.#filterAndEmit(lost, 'lost');
    }
  }

  #isPlayerConnected(playerId: string, server: Server) {
    return this.#foundPlayers.findIndex((player) => (player.id === playerId) && (player.server.ip === server.ip)) >= 0;
  }

  async #handleNotification(server: Server, data: Notification) {
    const {notification, playerId, params} = data;
    if (notification === 'client' && playerId && params.length > 0) {
      const type = (params[0] === 'new' || params[0] === 'reconnect') ? 'connect' :
        params[0] === 'disconnect' ? 'disconnect' : null;
      sm.getLogger().info(`[squeezelite_mc] 'client' notification received from ${server.name} (${server.ip}); type is '${type}'`);
      if (type === 'connect' && !this.#isPlayerConnected(playerId, server)) {
        this.#removeAndEmitLostByPlayerId(playerId);
        const players = await this.#getPlayersOnServer(server);
        const found = players.find((player) => player.id === playerId);
        if (found) {
          found.server = server;
          this.#foundPlayers.push(found);
          this.#filterAndEmit([ found ], 'found');
        }
      }
      else if (type === 'disconnect') {
        this.#removeAndEmitLostByPlayerId(playerId);
      }
    }
  }

  #filterAndEmit(players: Player[], eventName: string) {
    const eventFilter = this.#opts.eventFilter;
    if (!eventFilter) {
      this.emit(eventName, players);
      return;
    }
    const predicates: ((player: Player) => boolean)[] = [];
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
  }


  async #createAndStartNotificationListener(server: Server, subscribe = 'client') {
    const connectParams = getServerConnectParams(server, this.#opts.serverCredentials, 'cli');
    const notificationListener = new NotificationListener({
      server: {
        ...connectParams
      },
      subscribe
    });
    notificationListener.on('notification', this.#handleNotification.bind(this, server));
    notificationListener.on('disconnect', this.#handleServerLost.bind(this, server));
    try {
      await notificationListener.start();
      sm.getLogger().info('[squeezelite_mc] Notification listener started');
      return notificationListener;
    }
    catch (error) {
      sm.getLogger().error(sm.getErrorMessage(`[squeezelite_mc] Failed to start notification listener on ${server.name} (${server.ip}):`, error));
      this.emit('error', sm.getErrorMessage(sm.getI18n('SQUEEZELITE_MC_ERR_SERVER_REQUEST', server.name, server.ip), error, false));
      throw error;
    }
  }

  async #requestServerStatus(server: Server) {
    const connectParams = getServerConnectParams(server, this.#opts.serverCredentials, 'rpc');
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
