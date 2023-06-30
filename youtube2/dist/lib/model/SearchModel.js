"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Endpoint_1 = require("../types/Endpoint");
const EndpointModel_1 = __importDefault(require("./EndpointModel"));
class SearchModel extends EndpointModel_1.default {
    getSearchResultsByQuery(query) {
        const endpoint = {
            type: Endpoint_1.EndpointType.Search,
            payload: {
                query
            }
        };
        return this.getContents(endpoint);
    }
}
exports.default = SearchModel;
//# sourceMappingURL=SearchModel.js.map