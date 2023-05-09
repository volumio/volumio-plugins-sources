"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const entities_1 = require("../entities");
const JellyfinContext_1 = __importDefault(require("../JellyfinContext"));
class ServerHelper {
    static getServersFromConfig() {
        return JellyfinContext_1.default.getConfigValue('servers', [], true);
    }
    static fetchPasswordFromConfig(server, username) {
        const serverConfEntries = this.getServersFromConfig();
        const serverConf = serverConfEntries.find((conf) => this.getConnectionUrl(conf.url) === server.connectionUrl && conf.username === username);
        return serverConf?.password || '';
    }
    static hasServerConfig(username, host) {
        const matchUrl = this.getConnectionUrl(host);
        const serverConfEntries = this.getServersFromConfig();
        const serverConf = serverConfEntries.find((conf) => this.getConnectionUrl(conf.url) === matchUrl && conf.username === username);
        return !!serverConf;
    }
    static getConnectionUrl(url) {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
            const deviceUrlObj = new URL(JellyfinContext_1.default.getDeviceInfo().host);
            urlObj.hostname = deviceUrlObj.hostname;
        }
        const sanitized = urlObj.toString();
        if (sanitized.endsWith('/')) {
            return sanitized.substring(0, sanitized.length - 1);
        }
        return sanitized;
    }
    static getOnlineServerByIdAndUsername(id, username) {
        const onlineServers = JellyfinContext_1.default.get('onlineServers', []);
        const serversMatchingId = onlineServers.filter((server) => server.id === id);
        if (serversMatchingId.length === 0) {
            return null;
        }
        const serverConfEntries = ServerHelper.getServersFromConfig();
        const result = serversMatchingId.find((server) => serverConfEntries.find((conf) => ServerHelper.getConnectionUrl(conf.url) === server.connectionUrl && conf.username === username));
        return result || null;
    }
    static generateConnectionId(username, serverTarget) {
        if (typeof serverTarget === 'string') {
            return `${encodeURIComponent(username)}@${encodeURIComponent(serverTarget)}`;
        }
        else if (typeof serverTarget === 'object' && serverTarget.type === entities_1.EntityType.Server) {
            return this.generateConnectionId(username, serverTarget.id);
        }
        throw TypeError('serverTarget must be server Id (string) or object meeting Server interface constraint');
    }
}
exports.default = ServerHelper;
//# sourceMappingURL=ServerHelper.js.map