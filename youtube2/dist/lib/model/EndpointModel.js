"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _EndpointModel_instances, _EndpointModel_doGetContents;
Object.defineProperty(exports, "__esModule", { value: true });
const volumio_youtubei_js_1 = require("volumio-youtubei.js");
const BaseModel_1 = require("./BaseModel");
const Endpoint_1 = require("../types/Endpoint");
const InnertubeResultParser_1 = __importDefault(require("./InnertubeResultParser"));
const EndpointHelper_1 = __importDefault(require("../util/EndpointHelper"));
class EndpointModel extends BaseModel_1.BaseModel {
    constructor() {
        super(...arguments);
        _EndpointModel_instances.add(this);
    }
    async getContents(endpoint) {
        const { innertube } = await this.getInnertube();
        if (EndpointHelper_1.default.isType(endpoint, Endpoint_1.EndpointType.Browse, Endpoint_1.EndpointType.BrowseContinuation)) {
            return __classPrivateFieldGet(this, _EndpointModel_instances, "m", _EndpointModel_doGetContents).call(this, innertube, '/browse', endpoint);
        }
        if (EndpointHelper_1.default.isType(endpoint, Endpoint_1.EndpointType.Watch, Endpoint_1.EndpointType.WatchContinuation)) {
            return __classPrivateFieldGet(this, _EndpointModel_instances, "m", _EndpointModel_doGetContents).call(this, innertube, '/next', endpoint);
        }
        if (EndpointHelper_1.default.isType(endpoint, Endpoint_1.EndpointType.Search, Endpoint_1.EndpointType.SearchContinuation)) {
            return __classPrivateFieldGet(this, _EndpointModel_instances, "m", _EndpointModel_doGetContents).call(this, innertube, '/search', endpoint);
        }
        return null;
    }
}
exports.default = EndpointModel;
_EndpointModel_instances = new WeakSet(), _EndpointModel_doGetContents = async function _EndpointModel_doGetContents(innertube, url, endpoint) {
    const response = await innertube.actions.execute(url, endpoint.payload);
    const parsed = volumio_youtubei_js_1.Parser.parseResponse(response.data); // First parse by InnerTube
    return InnertubeResultParser_1.default.parseResult(parsed, endpoint); // Second parse
};
//# sourceMappingURL=EndpointModel.js.map