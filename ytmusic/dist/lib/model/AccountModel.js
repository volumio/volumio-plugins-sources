"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseModel_1 = require("./BaseModel");
const AccountModelHelper_1 = require("./AccountModelHelper");
class AccountModel extends BaseModel_1.BaseModel {
    async getInfo() {
        const { innertube } = await this.getInnertube();
        return await (0, AccountModelHelper_1.getAccountInitialInfo)(innertube);
    }
}
exports.default = AccountModel;
//# sourceMappingURL=AccountModel.js.map