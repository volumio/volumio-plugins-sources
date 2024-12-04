import { type PluginConfig } from '../types';
import type Innertube from "volumio-youtubei.js";
export type AccountInfo = {
    isSignedIn: true;
    list: PluginConfig.Account[];
    active: PluginConfig.Account;
} | {
    isSignedIn: false;
    list: null;
    active: null;
};
export declare function getAccountInitialInfo(innertube: Innertube): Promise<AccountInfo>;
//# sourceMappingURL=AccountModelHelper.d.ts.map