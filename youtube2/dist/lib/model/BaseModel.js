"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseModel = void 0;
const YouTube2Context_1 = __importDefault(require("../YouTube2Context"));
class BaseModel {
    getInnertube() {
        return YouTube2Context_1.default.get('innertube');
    }
}
exports.BaseModel = BaseModel;
//# sourceMappingURL=BaseModel.js.map