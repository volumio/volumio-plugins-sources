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
    const serverConf = serverConfEntries.find((conf) => conf.url === server.url && conf.username === username);
    return serverConf?.password || '';
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
