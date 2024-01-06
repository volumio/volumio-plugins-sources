import { PluginConfig } from '../types';
import { BaseModel } from './BaseModel';
export default class AccountModel extends BaseModel {
    getInfo(): Promise<PluginConfig.Account | null>;
}
//# sourceMappingURL=AccountModel.d.ts.map