"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_views_api_1 = require("@jellyfin/sdk/lib/utils/api/user-views-api");
const BaseModel_1 = __importDefault(require("./BaseModel"));
const UserViewParser_1 = __importDefault(require("./parser/UserViewParser"));
class UserViewModel extends BaseModel_1.default {
    getUserViews() {
        const parser = new UserViewParser_1.default();
        return this.getItemsFromAPI({}, parser, {
            getApi: (api) => (0, user_views_api_1.getUserViewsApi)(api),
            getItems: 'getUserViews'
        });
    }
    getUserView(id) {
        const parser = new UserViewParser_1.default();
        return this.getItemFromApi({ itemId: id }, parser);
    }
}
exports.default = UserViewModel;
//# sourceMappingURL=UserViewModel.js.map