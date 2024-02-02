"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommonSettingsLoader_1 = __importDefault(require("../config/CommonSettingsLoader"));
const now_playing_common_1 = require("now-playing-common");
class SettingsAPI {
    async getSettings({ category }) {
        if (Object.values(now_playing_common_1.CommonSettingsCategory).includes(category)) {
            return CommonSettingsLoader_1.default.get(category);
        }
        throw Error(`Unknown settings category ${category}`);
    }
}
const settingsAPI = new SettingsAPI();
exports.default = settingsAPI;
//# sourceMappingURL=SettingsAPI.js.map