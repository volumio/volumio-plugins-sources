"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseModel_1 = __importDefault(require("./BaseModel"));
const FolderContentParser_1 = __importDefault(require("./parser/FolderContentParser"));
const FolderParser_1 = __importDefault(require("./parser/FolderParser"));
class FolderModel extends BaseModel_1.default {
    getFolderContents(params) {
        const parser = new FolderContentParser_1.default();
        return this.getItemsFromAPI({ ...params, recursive: false }, parser);
    }
    getFolder(id) {
        const parser = new FolderParser_1.default();
        return this.getItemFromApi({ itemId: id }, parser);
    }
}
exports.default = FolderModel;
//# sourceMappingURL=FolderModel.js.map