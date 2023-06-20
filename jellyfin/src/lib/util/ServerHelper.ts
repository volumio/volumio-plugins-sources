import { EntityType } from '../entities';
import Server from '../entities/Server';
import jellyfin from '../JellyfinContext';

// An item in the `servers` array stored in plugin config.
export interface ServerConfEntry {
  url: string;
  username: string;
  password: string;
}

export default class ServerHelper {

  static getServersFromConfig(): ServerConfEntry[] {
    return jellyfin.getConfigValue<ServerConfEntry[]>('servers', [], true);
  }

  static fetchPasswordFromConfig(server: Server, username: string): string {
    const serverConfEntries = this.getServersFromConfig();
    const serverConf = serverConfEntries.find(
      (conf) => this.getConnectionUrl(conf.url) === server.connectionUrl && conf.username === username);
    return serverConf?.password || '';
  }

  static hasServerConfig(username: string, host: string): boolean {
    const matchUrl = this.getConnectionUrl(host);
    const serverConfEntries = this.getServersFromConfig();
    const serverConf = serverConfEntries.find(
      (conf) => this.getConnectionUrl(conf.url) === matchUrl && conf.username === username);
    return !!serverConf;
  }

  static getConnectionUrl(url: string): string {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
      const deviceUrlObj = new URL(jellyfin.getDeviceInfo().host);
      urlObj.hostname = deviceUrlObj.hostname;
    }
    const sanitized = urlObj.toString();
    if (sanitized.endsWith('/')) {
      return sanitized.substring(0, sanitized.length - 1);
    }
    return sanitized;
  }

  static getOnlineServerByIdAndUsername(id: string, username: string): Server | null {
    const onlineServers = jellyfin.get<Server[]>('onlineServers', []);
    const serversMatchingId = onlineServers.filter((server) => server.id === id);
    if (serversMatchingId.length === 0) {
      return null;
    }
    const serverConfEntries = ServerHelper.getServersFromConfig();
    const result = serversMatchingId.find((server) => serverConfEntries.find(
      (conf) => ServerHelper.getConnectionUrl(conf.url) === server.connectionUrl && conf.username === username));

    return result || null;
  }

  static generateConnectionId(username: string, serverId: string): string;
  static generateConnectionId(username: string, server: Server): string;
  static generateConnectionId(username: string, serverTarget: string | Server): string {
    if (typeof serverTarget === 'string') {
      return `${encodeURIComponent(username)}@${encodeURIComponent(serverTarget)}`;
    }
    else if (typeof serverTarget === 'object' && serverTarget.type === EntityType.Server) {
      return this.generateConnectionId(username, serverTarget.id);
    }
    throw TypeError('serverTarget must be server Id (string) or object meeting Server interface constraint');
  }
}
