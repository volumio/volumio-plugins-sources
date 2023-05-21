"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("@jellyfin/sdk/lib/generated-client/models");
const entities_1 = require("../../entities");
const Folder_1 = require("../../entities/Folder");
const BaseParser_1 = __importDefault(require("./BaseParser"));
class FolderParser extends BaseParser_1.default {
    async parseDto(data, api) {
        const base = await super.parseDto(data, api);
        if (!base || (data.Type !== models_1.BaseItemKind.Folder &&
            data.Type !== models_1.BaseItemKind.CollectionFolder && data.Type !== models_1.BaseItemKind.UserView)) {
            return null;
        }
        const result = {
            ...base,
            type: data.Type === models_1.BaseItemKind.CollectionFolder ? entities_1.EntityType.CollectionFolder : entities_1.EntityType.Folder
        };
        if (data.Type === models_1.BaseItemKind.CollectionFolder && data.CollectionType === 'boxsets') {
            result.folderType = Folder_1.FolderType.Collections;
        }
        else {
            result.folderType = Folder_1.FolderType.Folder;
        }
        return result;
    }
}
exports.default = FolderParser;
//# sourceMappingURL=FolderParser.js.map