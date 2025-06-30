import { BaseModel } from './BaseModel';
import { getAccountInitialInfo } from './AccountModelHelper';

export default class AccountModel extends BaseModel {

  async getInfo() {
    const { innertube } = await this.getInnertube();
    return await getAccountInitialInfo(innertube);
  }
}
