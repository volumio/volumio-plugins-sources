"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _ConnectionManager_instances, _ConnectionManager_sdkInitInfo, _ConnectionManager_connections, _ConnectionManager_authenticatingPromises, _ConnectionManager_authenticateConnection, _ConnectionManager_getOrCreateConnection;
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
const sdk_1 = require("@jellyfin/sdk");
const JellyfinContext_1 = __importDefault(require("../JellyfinContext"));
const ServerHelper_1 = __importDefault(require("../util/ServerHelper"));
const uuid_1 = require("uuid");
class ConnectionManager extends events_1.default {
    constructor(sdkInitInfo) {
        super();
        _ConnectionManager_instances.add(this);
        _ConnectionManager_sdkInitInfo.set(this, void 0);
        _ConnectionManager_connections.set(this, void 0);
        _ConnectionManager_authenticatingPromises.set(this, void 0);
        __classPrivateFieldSet(this, _ConnectionManager_sdkInitInfo, sdkInitInfo, "f");
        __classPrivateFieldSet(this, _ConnectionManager_connections, [], "f");
        __classPrivateFieldSet(this, _ConnectionManager_authenticatingPromises, {}, "f");
    }
    async getAuthenticatedConnection(server, username, passwordFetch) {
        const conn = __classPrivateFieldGet(this, _ConnectionManager_instances, "m", _ConnectionManager_getOrCreateConnection).call(this, server, username);
        if (conn.auth) {
            return conn;
        }
        if (Reflect.has(__classPrivateFieldGet(this, _ConnectionManager_authenticatingPromises, "f"), conn.id)) {
            JellyfinContext_1.default.getLogger().info('[jellyfin-conn] Returning existing auth promise');
            return __classPrivateFieldGet(this, _ConnectionManager_authenticatingPromises, "f")[conn.id];
        }
        __classPrivateFieldGet(this, _ConnectionManager_authenticatingPromises, "f")[conn.id] = __classPrivateFieldGet(this, _ConnectionManager_instances, "m", _ConnectionManager_authenticateConnection).call(this, conn, passwordFetch)
            .finally(() => {
            delete __classPrivateFieldGet(this, _ConnectionManager_authenticatingPromises, "f")[conn.id];
        });
        return __classPrivateFieldGet(this, _ConnectionManager_authenticatingPromises, "f")[conn.id];
    }
    async logoutAll() {
        const logoutPromises = __classPrivateFieldGet(this, _ConnectionManager_connections, "f").filter((c) => c.auth).map(async (c) => {
            try {
                await c.api.logout();
                JellyfinContext_1.default.getLogger().info(`[jellyfin-conn] Logout successful: ${c.username}@${c.server.name}`);
            }
            catch (error) {
                JellyfinContext_1.default.getLogger().error(`[jellyfin-conn] Logout error: ${c.username}@${c.server.name}: ${error.message}, Server info: `, c.server);
            }
        });
        await Promise.all(logoutPromises);
        __classPrivateFieldSet(this, _ConnectionManager_connections, [], "f");
    }
    async logout(connection) {
        if (connection.auth) {
            try {
                await connection.api.logout();
                JellyfinContext_1.default.getLogger().info(`[jellyfin-conn] Logout successful: ${connection.username}@${connection.server.name}`);
            }
            catch (error) {
                JellyfinContext_1.default.getLogger().error(`[jellyfin-conn] Logout error: ${connection.username}@${connection.server.name}: ${error.message}, Server info: `, connection.server);
            }
            finally {
                const i = __classPrivateFieldGet(this, _ConnectionManager_connections, "f").indexOf(connection);
                if (i >= 0) {
                    __classPrivateFieldGet(this, _ConnectionManager_connections, "f").splice(i, 1);
                }
            }
        }
    }
    findConnection(server, username, authenticated = false) {
        return __classPrivateFieldGet(this, _ConnectionManager_connections, "f").find((c) => c.server.id === server.id && (authenticated ? c.auth?.User?.Name : c.username) === username) || null;
    }
}
exports.default = ConnectionManager;
_ConnectionManager_sdkInitInfo = new WeakMap(), _ConnectionManager_connections = new WeakMap(), _ConnectionManager_authenticatingPromises = new WeakMap(), _ConnectionManager_instances = new WeakSet(), _ConnectionManager_authenticateConnection = async function _ConnectionManager_authenticateConnection(connection, passwordFetch) {
    const { server, username } = connection;
    JellyfinContext_1.default.toast('info', JellyfinContext_1.default.getI18n('JELLYFIN_LOGGING_INTO', server.name));
    try {
        const authResult = await connection.api.authenticateUserByName(username, passwordFetch(server, username));
        connection.auth = authResult.data;
        JellyfinContext_1.default.toast('success', JellyfinContext_1.default.getI18n('JELLYFIN_LOGIN_SUCCESS', server.name));
        JellyfinContext_1.default.getLogger().info(`[jellyfin-conn] Login successful: ${username}@${server.name}`);
    }
    catch (error) {
        JellyfinContext_1.default.toast('error', JellyfinContext_1.default.getI18n('JELLYFIN_AUTH_FAILED'));
        JellyfinContext_1.default.getLogger().error(`[jellyfin-conn] Login error: ${username}@${server.name}: ${error.message}, Server info: `, server);
    }
    return connection;
}, _ConnectionManager_getOrCreateConnection = function _ConnectionManager_getOrCreateConnection(server, username) {
    const conn = this.findConnection(server, username);
    if (!conn) {
        // We can't use the same device ID to login multiple users simultaneously
        // On same Jellyfin server. Doing so will log out the previous users.
        // Before we generate a new device ID, check if we have cached one for the user.
        // By reusing previously-assigned ID, we avoid the Jellyfin server registering multiple
        // Sessions for the user - this can happen when the plugin is restarted within
        // A short timeframe and the session before restart has not yet been marked stale.
        const cachedDeviceIds = JellyfinContext_1.default.getConfigValue('connectionDeviceIds');
        const connectionId = ServerHelper_1.default.generateConnectionId(username, server);
        let userDeviceId = cachedDeviceIds[connectionId];
        if (!userDeviceId) {
            userDeviceId = (0, uuid_1.v4)();
            cachedDeviceIds[connectionId] = userDeviceId;
            JellyfinContext_1.default.setConfigValue('connectionDeviceIds', cachedDeviceIds);
            JellyfinContext_1.default.getLogger().info(`[jellyfin-conn] Generated new device Id for ${username}@${server.name}: ${userDeviceId}`);
        }
        else {
            JellyfinContext_1.default.getLogger().info(`[jellyfin-conn] Using previously assigned device Id for ${username}@${server.name}: ${userDeviceId}`);
        }
        const sdk = new sdk_1.Jellyfin({
            clientInfo: __classPrivateFieldGet(this, _ConnectionManager_sdkInitInfo, "f").clientInfo,
            deviceInfo: {
                ...__classPrivateFieldGet(this, _ConnectionManager_sdkInitInfo, "f").deviceInfo,
                id: userDeviceId
            }
        });
        const newConnection = {
            id: connectionId,
            username,
            server,
            api: sdk.createApi(server.connectionUrl)
        };
        __classPrivateFieldGet(this, _ConnectionManager_connections, "f").push(newConnection);
        return newConnection;
    }
    return conn;
};
//# sourceMappingURL=ConnectionManager.js.map