"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseModel = void 0;
const InnertubeLoader_1 = __importDefault(require("./InnertubeLoader"));
class BaseModel {
    getInnertube() {
        return InnertubeLoader_1.default.getInstance();
    }
}
exports.BaseModel = BaseModel;
//# sourceMappingURL=BaseModel.js.map