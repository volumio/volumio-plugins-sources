"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const volumio_youtubei_js_1 = require("volumio-youtubei.js");
const BaseModel_1 = require("./BaseModel");
const Endpoint_1 = require("../types/Endpoint");
const InnertubeResultParser_1 = __importDefault(require("./InnertubeResultParser"));
class EndpointModel extends BaseModel_1.BaseModel {
    async getContents(endpoint) {
        const innertube = this.getInnertube();
        let url;
        switch (endpoint?.type) {
            case Endpoint_1.EndpointType.Browse:
            case Endpoint_1.EndpointType.BrowseContinuation:
                url = '/browse';
                break;
            case Endpoint_1.EndpointType.Watch:
            case Endpoint_1.EndpointType.WatchContinuation:
                url = '/next';
                break;
            case Endpoint_1.EndpointType.Search:
            case Endpoint_1.EndpointType.SearchContinuation:
                url = '/search';
                break;
            default:
                url = null;
        }
        if (url && innertube) {
            const response = await innertube.actions.execute(url, endpoint.payload);
            const parsed = volumio_youtubei_js_1.Parser.parseResponse(response.data); // First parse by InnerTube
            return InnertubeResultParser_1.default.parseResult(parsed, endpoint.type); // Second parse
        }
        return null;
    }
}
exports.default = EndpointModel;
//# sourceMappingURL=EndpointModel.js.map