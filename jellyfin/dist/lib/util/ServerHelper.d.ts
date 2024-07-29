import ConnectionManager from '../connection/ConnectionManager';
import ServerConnection from '../connection/ServerConnection';
import View from '../controller/browse/view-handlers/View';
import Server from '../entities/Server';
export interface ServerConfEntry {
    url: string;
    username: string;
    password: string;
}
export default class ServerHelper {
    static getServersFromConfig(): ServerConfEntry[];
    static fetchPasswordFromConfig(server: Server, username: string): string;
    static hasServerConfig(username: string, host: string): boolean;
    static getConnectionUrl(url: string): string;
    static getOnlineServerByIdAndUsername(id: string, username: string): Server | null;
    static generateConnectionId(username: string, serverId: string): string;
    static generateConnectionId(username: string, server: Server): string;
    static getConnectionByView(view: View, src: ServerConnection | ConnectionManager): Promise<ServerConnection | null>;
}
//# sourceMappingURL=ServerHelper.d.ts.map