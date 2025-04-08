interface Server {
    ip: string;
    name: string;
    ver?: string;
    uuid: string;
    jsonPort: string;
    cliPort: string;
}
export interface ServerCredentials {
    [serverName: string]: {
        username: string;
        password: string;
    };
}
export default Server;
//# sourceMappingURL=Server.d.ts.map