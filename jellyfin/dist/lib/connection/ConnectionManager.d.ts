/// <reference types="node" />
import EventEmitter from 'events';
import { ClientInfo, DeviceInfo } from '@jellyfin/sdk';
import ServerConnection from './ServerConnection';
import Server from '../entities/Server';
export interface PasswordFetch {
    (server: Server, username: string): string;
}
export interface JellyfinSdkInitInfo {
    clientInfo: ClientInfo;
    deviceInfo: DeviceInfo;
}
export default class ConnectionManager extends EventEmitter {
    #private;
    constructor(sdkInitInfo: JellyfinSdkInitInfo);
    getAuthenticatedConnection(server: Server, username: string, passwordFetch: PasswordFetch): Promise<ServerConnection>;
    logoutAll(): Promise<void>;
    logout(connection: ServerConnection): Promise<void>;
    findConnection(server: Server, username: string, authenticated?: boolean): ServerConnection | null;
}
//# sourceMappingURL=ConnectionManager.d.ts.map