import { Utils as YTUtils } from 'volumio-youtubei.js';
export declare enum AuthStatus {
    SignedIn = "SignedIn",
    SignedOut = "SignedOut",
    SigningIn = "SigningIn",
    Error = "Error"
}
export interface AuthStatusInfo {
    status: AuthStatus;
    verificationInfo?: {
        verificationUrl: string;
        userCode: string;
    } | null;
    error?: YTUtils.OAuthError;
}
export default class Auth {
    #private;
    static registerHandlers(): void;
    static unregisterHandlers(): void;
    static signIn(): void;
    static signOut(): void;
    static getAuthStatus(): AuthStatusInfo;
}
//# sourceMappingURL=Auth.d.ts.map