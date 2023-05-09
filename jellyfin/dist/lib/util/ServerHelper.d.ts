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
    static generateConnectionId(username: string, serverId: string): string;
    static generateConnectionId(username: string, server: Server): string;
}
//# sourceMappingURL=ServerHelper.d.ts.map