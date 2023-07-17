/// <reference types="node" />
import Innertube, { Utils as YTUtils } from 'volumio-youtubei.js';
import EventEmitter from 'events';
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
export declare enum AuthEvent {
    SignIn = "SignIn",
    Pending = "Pending",
    Error = "Error"
}
export default class Auth extends EventEmitter {
    #private;
    constructor();
    static create(innertube: Innertube): Auth;
    dispose(): void;
    signIn(): void;
    signOut(): Promise<void>;
    getStatus(): AuthStatusInfo;
}
//# sourceMappingURL=Auth.d.ts.map