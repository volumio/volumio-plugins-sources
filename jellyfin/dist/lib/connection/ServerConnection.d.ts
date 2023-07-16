import { Api } from '@jellyfin/sdk';
import { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client/models/authentication-result';
import Server from '../entities/Server';
interface ServerConnection {
    id: string;
    username: string;
    server: Server;
    api: Api;
    auth?: AuthenticationResult | null;
}
export default ServerConnection;
//# sourceMappingURL=ServerConnection.d.ts.map