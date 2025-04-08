"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("@jellyfin/sdk/lib/generated-client/models");
const entities_1 = require("../../entities");
const UserView_1 = require("../../entities/UserView");
const BaseParser_1 = __importDefault(require("./BaseParser"));
class UserViewParser extends BaseParser_1.default {
    async parseDto(data, api) {
        const base = await super.parseDto(data, api);
        if (!base) {
            return null;
        }
        const result = {
            ...base,
            type: entities_1.EntityType.UserView
        };
        if (data.Type === models_1.BaseItemKind.CollectionFolder && data.CollectionType === 'boxsets') {
            result.userViewType = UserView_1.UserViewType.Collections;
        }
        else if (data.Type === models_1.BaseItemKind.UserView && data.CollectionType === 'playlists') {
            result.userViewType = UserView_1.UserViewType.Playlists;
        }
        else if (data.Type === models_1.BaseItemKind.CollectionFolder && data.CollectionType === 'music') {
            result.userViewType = UserView_1.UserViewType.Library;
        }
        else if (data.Type === models_1.BaseItemKind.UserView && data.CollectionType === 'folders') {
            result.userViewType = UserView_1.UserViewType.Folders;
        }
        else {
            return null;
        }
        return result;
    }
}
exports.default = UserViewParser;
//# sourceMappingURL=UserViewParser.js.map