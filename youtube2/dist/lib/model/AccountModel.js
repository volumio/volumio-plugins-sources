"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseModel_1 = require("./BaseModel");
const InnertubeResultParser_1 = __importDefault(require("./InnertubeResultParser"));
class AccountModel extends BaseModel_1.BaseModel {
    async getInfo() {
        const innertube = this.getInnertube();
        if (innertube) {
            const info = await innertube.account.getInfo();
            // This plugin supports single sign-in, so there should only be one account in contents.
            // But we still get the 'selected' one just to be sure.
            const account = info.contents?.contents.find((ac) => ac.is_selected);
            if (account) {
                const result = {
                    name: InnertubeResultParser_1.default.unwrap(account.account_name),
                    photo: InnertubeResultParser_1.default.parseThumbnail(account.account_photo)
                };
                if (info.footers?.endpoint) { // Channel
                    result.channel = {
                        title: InnertubeResultParser_1.default.unwrap(info.footers.title),
                        endpoint: InnertubeResultParser_1.default.parseEndpoint(info.footers.endpoint)
                    };
                }
                return result;
            }
        }
        return null;
    }
}
exports.default = AccountModel;
//# sourceMappingURL=AccountModel.js.map