"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseModel = void 0;
const InnertubeLoader_1 = __importDefault(require("./InnertubeLoader"));
const YouTube2Context_1 = __importDefault(require("../YouTube2Context"));
class BaseModel {
    getInnertube() {
        return InnertubeLoader_1.default.getInstance();
    }
    async fetchAccountMenu() {
        const { innertube } = await this.getInnertube();
        const requestData = {
            client: 'WEB'
        };
        try {
            const response = await innertube.session.http.fetch('/account/account_menu', {
                method: 'POST',
                body: JSON.stringify(requestData),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return JSON.parse(await response.text());
        }
        catch (error) {
            YouTube2Context_1.default.getLogger().error(YouTube2Context_1.default.getErrorMessage('[youtube2] Error in Model.fetchAccountMenu(): ', error));
            return null;
        }
    }
}
exports.BaseModel = BaseModel;
//# sourceMappingURL=BaseModel.js.map