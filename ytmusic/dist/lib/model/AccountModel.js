"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Auth_1 = require("../util/Auth");
const BaseModel_1 = require("./BaseModel");
const InnertubeResultParser_1 = __importDefault(require("./InnertubeResultParser"));
class AccountModel extends BaseModel_1.BaseModel {
    async getInfo() {
        const { innertube, auth } = await this.getInnertube();
        if (auth.getStatus().status !== Auth_1.AuthStatus.SignedIn) {
            return null;
        }
        const info = await innertube.account.getInfo();
        // This plugin supports single sign-in, so there should only be one account in contents.
        // But we still get the 'selected' one just to be sure.
        const account = info.contents?.contents.find((ac) => ac.is_selected);
        const name = InnertubeResultParser_1.default.unwrap(account?.account_name);
        if (account && name) {
            const result = {
                name,
                photo: InnertubeResultParser_1.default.parseThumbnail(account.account_photo)
            };
            return result;
        }
        return null;
    }
}
exports.default = AccountModel;
//# sourceMappingURL=AccountModel.js.map